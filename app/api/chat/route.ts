import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { getOrBuildPersonalityProfile } from '@/lib/personality-service'
import { CreatorPersonalityProfile } from '@/lib/types/creator-profile'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      conversationId,
      creatorId,
      message,
      personalityProfile,
      // Legacy fields (for backward compatibility)
      voiceFingerprint,
      creatorName,
      creatorSettings,
    } = body

    console.log('Chat API received:', {
      conversationId,
      creatorId,
      message: message.substring(0, 50),
      hasPersonalityProfile: !!personalityProfile,
      hasLegacyFields: !!(voiceFingerprint || creatorSettings),
    })

    // Initialize Anthropic client inside the request
    const apiKey = process.env.ANTHROPIC_API_KEY
    console.log('API Key available:', !!apiKey)

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }

    const client = new Anthropic({ apiKey })

    if (!conversationId || !message || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, creatorId, message' },
        { status: 400 }
      )
    }

    // Use admin client for reading/writing to bypass RLS for API operations
    const adminClient = supabaseAdmin()

    // Get personality profile (from request or from database)
    let profile: CreatorPersonalityProfile | null = personalityProfile
    if (!profile) {
      console.log('Personality profile not provided, fetching from database...')
      profile = await getOrBuildPersonalityProfile(creatorId)
    }

    if (!profile) {
      console.error('Could not get personality profile for creator:', creatorId)
      return NextResponse.json(
        { error: 'Could not load creator personality profile' },
        { status: 500 }
      )
    }

    // Get conversation history for context
    const { data: messageHistory } = await adminClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10) // Last 10 messages for context

    // Build system prompt with full personality profile
    const systemPrompt = buildSystemPrompt(profile, messageHistory || [])

    // Extract reply frequency pattern for message handling
    const replyFrequencyPattern = (profile?.voice_fingerprint as any)?.reply_frequency_pattern || 'single'

    // Format messages for API
    const apiMessages = (messageHistory || [])
      .map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))
      .concat({
        role: 'user' as const,
        content: message,
      })

    // Use Haiku (fast, reliable) with improved system prompt for natural responses
    const model = 'claude-3-haiku-20240307'

    // Call Anthropic API with prompt caching
    const response = await client.messages.create({
      model,
      max_tokens: 500,
      system: [
        {
          type: 'text',
          text: systemPrompt,
        },
      ],
      messages: apiMessages,
    })

    // Extract text response
    let responseText =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // ENFORCE: Remove all asterisks and narrative descriptions
    responseText = cleanResponse(responseText)

    // ENFORCE: Truncate long responses for "short" pattern creators
    if (replyFrequencyPattern === 'single' && (profile?.voice_fingerprint as any)?.message_length_pattern === 'short') {
      // For short-message creators, limit response to 1-2 sentences max (~150 chars)
      const sentences = responseText.split(/(?<=[.!?])\s+/)
      if (sentences.length > 2) {
        responseText = sentences.slice(0, 2).join(' ')
        console.log('[Chat] Truncated short response to:', responseText)
      }
      if (responseText.length > 150) {
        // If still too long, cut at word boundary
        responseText = responseText.substring(0, 150).split(' ').slice(0, -1).join(' ') + '.'
        console.log('[Chat] Hard truncated to 150 chars')
      }
    }

    // ENFORCE: Respect reply_frequency_pattern
    // If creator naturally sends single messages, keep response as 1 message only
    let messageParts: string[]
    if (replyFrequencyPattern === 'single') {
      // Single message only - no splitting
      messageParts = [responseText]
      console.log('[Chat] Single-message mode: keeping response as 1 message')
    } else if (replyFrequencyPattern === 'moderate') {
      // Moderate: allow 2-3 messages max
      messageParts = splitResponseIntoMessages(responseText)
      messageParts = messageParts.slice(0, 3) // Limit to 3
      console.log('[Chat] Moderate mode: limited to', messageParts.length, 'messages')
    } else {
      // Burst: allow natural splitting (4+ messages)
      messageParts = splitResponseIntoMessages(responseText)
      console.log('[Chat] Burst mode: allowing', messageParts.length, 'messages')
    }

    // NATURAL DELAY: Simulate human-like response time (2-10 seconds)
    // Based on interest level and random distraction
    const naturalDelay = calculateNaturalDelay(message, profile?.interests || [])
    console.log('[Chat] Waiting', (naturalDelay / 1000).toFixed(1), 'seconds before responding...')
    await new Promise((resolve) => setTimeout(resolve, naturalDelay))

    // Save each message part separately
    console.log('Saving', messageParts.length, 'message(s) to conversation:', conversationId)
    const savedMessages = []

    for (const messagePart of messageParts) {
      const { data: savedMsg, error: saveError } = await adminClient
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: messagePart,
        })
        .select()
        .single()

      if (saveError) {
        throw new Error(`Failed to save message: ${saveError.message}`)
      }

      savedMessages.push(savedMsg)

      // Simulate typing delay between messages
      if (messageParts.length > 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, 300 + Math.random() * 200)
        )
      }
    }

    console.log('Saved', savedMessages.length, 'messages')
    const assistantMessage = savedMessages[0] // Return first message for response

    // Update conversation with actual message count from database
    const { data: allMessages } = await adminClient
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('conversation_id', conversationId)

    await adminClient
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        message_count: allMessages?.length || 0,
        is_active: true,
      })
      .eq('id', conversationId)

    return NextResponse.json({ assistantMessage })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Chat API error:', errorMsg, error)
    return NextResponse.json(
      { error: `Failed to process message: ${errorMsg}` },
      { status: 500 }
    )
  }
}

/**
 * Build rich system prompt from unified personality profile
 * Uses ALL 12+ personality dimensions to create distinctive characters
 */
function buildSystemPrompt(
  profile: CreatorPersonalityProfile,
  messageHistory: any[]
): string {
  const {
    display_name,
    age,
    gender,
    profession,
    location,
    country,
    language_style,
    accent_patterns,
    code_switching,
    formality,
    expressiveness,
    directness,
    tone_tendency,
    traits,
    archetype,
    voice_fingerprint,
    interests,
    values,
    topics_comfortable,
    topics_off_limits,
    cultural_background,
    education_level,
    life_experience,
    favorite_phrases,
    common_emojis,
    speech_patterns,
    habitual_behaviors,
    maturity_level,
  } = profile

  // Extract communication patterns from voice fingerprint if available
  const messageLengthPattern = (voice_fingerprint as any)?.message_length_pattern || 'medium'
  const replyFrequencyPattern = (voice_fingerprint as any)?.reply_frequency_pattern || 'single'

  // ====== IDENTITY SECTION ======
  let identitySection = `You are **${display_name}**`

  if (age) identitySection += `, ${age} years old`
  if (gender) identitySection += `, ${gender}`
  if (profession && profession.length > 0) identitySection += `, ${profession.join(' / ')}`
  if (location) identitySection += `, from ${location}`

  identitySection += '.'

  // ====== RESPONSE FORMAT (CRITICAL!) ======
  const formatSection = `\n**CRITICAL - RESPONSE FORMAT (ENFORCE STRICTLY):**
🚫 NEVER EVER use asterisks, narrative descriptions, or action markers.
🚫 NEVER write *like this* or *does something*
🚫 NEVER describe your actions or emotions with asterisks

✅ ALWAYS respond with PURE DIALOGUE ONLY
✅ Just write what you would actually say in a text message
✅ No asterisks, no descriptions, no roleplay actions

EXAMPLES OF WHAT TO NEVER DO:
- ❌ "*responds cheerfully* Hey there!"
- ❌ "*sends a warm message* I'm doing great!"
- ❌ "*laughs* That's funny!"
- ❌ "*typing..." or any asterisk format

ONLY SEND DIALOGUE:
- ✅ "Hey there! How's it going?"
- ✅ "That's so funny! 😂"
- ✅ "I'm doing great, thanks for asking!"

You are texting a friend. Just write what you'd actually text.`

  // ====== MESSAGE STYLE SECTION (Based on actual communication patterns) ======
  let messageStyleSection = '\n**YOUR NATURAL COMMUNICATION STYLE:**'

  // Message length guidance
  if (messageLengthPattern === 'short') {
    messageStyleSection += '\n🚫 SHORT MESSAGE RULE - ENFORCE STRICTLY:'
    messageStyleSection += '\n- NEVER write paragraphs'
    messageStyleSection += '\n- NEVER write multiple sentences'
    messageStyleSection += '\n- ALWAYS keep to 1-2 sentences MAX, usually just 1 short sentence'
    messageStyleSection += '\n- Examples: "Yeah sounds good!" or "Haha that\'s funny" or "Cool, let me know!"'
    messageStyleSection += '\n- Be casual, brief, direct - like texting a friend quickly'
  } else if (messageLengthPattern === 'long') {
    messageStyleSection += '\n- You naturally write LONG messages: full paragraphs with lots of details'
    messageStyleSection += '\n- Share more context and elaborate on your thoughts'
  } else {
    messageStyleSection += '\n- You naturally write MEDIUM-length messages: 1-2 sentences with normal detail'
    messageStyleSection += '\n- Balance between concise and informative'
  }

  // Reply frequency guidance
  if (replyFrequencyPattern === 'burst') {
    messageStyleSection += '\n- You often send MULTIPLE messages in a row (3-5+ messages at once)'
    messageStyleSection += '\n- It\'s natural for you to continue talking without waiting for a response'
  } else if (replyFrequencyPattern === 'moderate') {
    messageStyleSection += '\n- You sometimes send 2-3 messages together when you have more to say'
    messageStyleSection += '\n- Depends on the topic and how engaged you are'
  } else {
    messageStyleSection += '\n- You naturally send ONE message and wait for a response'
    messageStyleSection += '\n- After they reply, you respond with your own message'
  }

  messageStyleSection += '\n\n⚠️ IMPORTANT: Respond in THIS style naturally. Don\'t overthink it - just be yourself.'

  // ====== PERSONALITY SECTION ======
  let personalitySection = '\n**YOUR PERSONALITY:**'

  if (traits && traits.length > 0) {
    personalitySection += `\n- Personality traits: ${traits.slice(0, 5).join(', ')}`
  }

  if (archetype) {
    personalitySection += `\n- Archetype: The ${archetype}`
  }

  if (cultural_background) {
    personalitySection += `\n- Cultural background: ${cultural_background}`
  }

  if (education_level) {
    const levelLabel = {
      high_school: 'High school',
      bachelor: "Bachelor's degree",
      master: "Master's degree",
      phd: 'PhD',
    }[education_level]
    personalitySection += `\n- Education: ${levelLabel}`
  }

  if (life_experience) {
    personalitySection += `\n- Life experience: ${life_experience}`
  }

  // ====== COMMUNICATION STYLE SECTION ======
  let communicationSection = '\n**HOW YOU COMMUNICATE:**'

  // Language style guidance
  if (language_style === 'singlish') {
    communicationSection += '\n- **Language**: Singlish - casual grammar, code-switch English & Chinese naturally'
    communicationSection += '\n  Examples: "lah", "lor", "leh", "can or not", "lor lor lor", "got what"'
  } else if (language_style === 'british') {
    communicationSection += '\n- **Language**: British English - use "brilliant", "innit", "cheers", British spellings'
    communicationSection += '\n  Examples: "colour" not "color", "flat" not "apartment", "blimey"'
  } else if (language_style === 'american') {
    communicationSection += '\n- **Language**: American English - casual, direct, American spellings'
    communicationSection += '\n  Examples: "y\'all", "gonna", "awesome", "cool"'
  } else if (language_style === 'mixed') {
    communicationSection += '\n- **Language**: Mixed languages - naturally code-switch between multiple languages'
  }

  if (accent_patterns) {
    communicationSection += `\n- **Accent patterns**: ${accent_patterns} (reflect this in word choice and phrasing)`
  }

  // Formality
  const formalityGuide = {
    very_formal: 'Very formal - use proper grammar, academic tone',
    formal: 'Formal - professional but warm',
    casual: 'Casual - friendly and relaxed',
    very_casual: 'Very casual - informal, relaxed, conversational',
  }
  communicationSection += `\n- **Formality**: ${formalityGuide[formality]}`

  // Expressiveness
  const expressivenessGuide = {
    reserved: 'Reserved - measured responses, thoughtful',
    moderate: 'Balanced - natural expressiveness',
    expressive: 'Expressive - animated, showing emotions',
    very_expressive: 'Very expressive - enthusiastic, uses emojis, exclamation marks',
  }
  communicationSection += `\n- **Expressiveness**: ${expressivenessGuide[expressiveness]}`

  // Directness
  const directnessGuide = {
    indirect: 'Indirect - diplomatic, tactful',
    balanced: 'Balanced - straightforward but kind',
    direct: 'Direct - gets to the point',
    blunt: 'Blunt - very direct, no sugar-coating',
  }
  communicationSection += `\n- **Directness**: ${directnessGuide[directness]}`

  // Tone
  const toneGuide = {
    sarcastic: 'Sarcastic - witty, uses irony and humor',
    warm: 'Warm & friendly - genuine, caring',
    neutral: 'Neutral - balanced, not overly emotional',
    dry: 'Dry humor - subtle, understated jokes',
    enthusiastic: 'Enthusiastic & positive - upbeat, encouraging',
  }
  communicationSection += `\n- **Tone**: ${toneGuide[tone_tendency]}`

  // ====== INTERESTS & VALUES SECTION ======
  let interestsSection = '\n**WHAT YOU CARE ABOUT:**'

  if (interests && interests.length > 0) {
    interestsSection += `\n- Interested in: ${interests.slice(0, 5).join(', ')}`
  }

  if (values && values.length > 0) {
    interestsSection += `\n- Core values: ${values.slice(0, 5).join(', ')}`
  }

  if (topics_comfortable && topics_comfortable.length > 0) {
    interestsSection += `\n- Love talking about: ${topics_comfortable.slice(0, 5).join(', ')}`
  }

  if (topics_off_limits && topics_off_limits.length > 0) {
    interestsSection += `\n- Avoid: ${topics_off_limits.join(', ')}`
  }

  // ====== UNIQUE QUIRKS SECTION ======
  let quirksSection = '\n**YOUR UNIQUE QUIRKS:**'

  if (favorite_phrases && favorite_phrases.length > 0) {
    quirksSection += `\n- Favorite phrases: "${favorite_phrases.slice(0, 5).join('", "')}"`
  }

  // Use emojis from voice fingerprint if available, else fall back to common_emojis
  const emojisToUse = voice_fingerprint?.emojis?.map(e => e.emoji) || common_emojis || []
  if (emojisToUse.length > 0) {
    quirksSection += `\n- Common emojis: ${emojisToUse.slice(0, 5).join(' ')} (use naturally when it fits)`
  }

  if (speech_patterns) {
    quirksSection += `\n- Speech pattern: ${speech_patterns}`
  }

  if (habitual_behaviors && habitual_behaviors.length > 0) {
    quirksSection += `\n- Habitual behaviors: You ${habitual_behaviors.slice(0, 3).join(', you ')}`
  }

  // ====== VOICE FINGERPRINT SECTION ======
  let voiceSection = ''
  if (voice_fingerprint) {
    const vf = voice_fingerprint
    voiceSection += '\n**YOUR ACTUAL MESSAGE EXAMPLES:**'
    if (vf.example_messages && vf.example_messages.length > 0) {
      voiceSection += '\n' + vf.example_messages.slice(0, 4).map(msg => `- "${msg}"`).join('\n')
    }
    voiceSection += `\n\n**YOUR WRITING STYLE:**`
    if (vf.writing_style) voiceSection += `\n- Writing: ${vf.writing_style}`
    if (vf.humor_style) voiceSection += `\n- Humor: ${vf.humor_style}`
    if (vf.conversational_patterns) voiceSection += `\n- Conversation: ${vf.conversational_patterns}`
    if (vf.vocabulary_level) voiceSection += `\n- Vocabulary: ${vf.vocabulary_level}`
  }

  // ====== MATURITY SECTION ======
  let maturitySection = '\n**CONTENT MATURITY:**'
  const maturityGuide = {
    cautious: 'Keep away from adult/sexual content - stay friendly and appropriate',
    casual: 'Comfortable with some adult humor and casual references',
    very_open: 'Very open with adult topics and mature humor',
  }
  maturitySection += `\n${maturityGuide[maturity_level]}`

  // ====== RESPONSE GUIDELINES ======
  const guidelinesSection = `\n**MESSAGE RULE - ALWAYS 1 MESSAGE PER REPLY:**
IMPORTANT: Send exactly ONE message per visitor message. Never send 2-3 messages.
- Keep it short: 1-2 sentences, ~30 words
- One response, then stop
- Let the visitor respond next

**HOW TO RESPOND:**
1. BE YOURSELF - Use your actual voice, language style, and personality
2. KEEP IT SHORT - 1-2 sentences, ~30 words maximum
3. STAY CONSISTENT - Same personality throughout conversation
4. MIRROR YOUR STYLE - Use your favorite phrases and speech patterns
5. RESPECT YOUR VALUES - Engage with topics you care about
6. BE HONEST - If something's not your area, say so briefly
7. SHOW EMOTION - Let your tone shine through
8. DON'T DRIFT TO FORMAL - Stay at your actual English level
9. USE YOUR QUIRKS - Natural emojis, phrases, and behaviors (used naturally)
10. BE SPECIFIC - When asked about hobbies/interests/opinions, give ONE specific example with brief context

**CONTEXT MATTERS:**
- Personal questions → brief, SPECIFIC, authentic responses
- Outside your area → honest and brief
- Simple greeting → simple 1-message response
- Topics you care about → still just 1 message, but show genuine interest in it

**KEY:** Be ${display_name} authentically - with your unique voice, quirks, language patterns, and personality. Not Claude trying to be someone. Stay in character consistently. One message at a time.`

  return identitySection + formatSection + messageStyleSection + personalitySection + communicationSection + interestsSection + quirksSection + voiceSection + maturitySection + guidelinesSection
}

/**
 * Detect if message contains emotional depth (triggers Sonnet)
 */
function detectEmotionalDepth(message: string): boolean {
  const emotionalKeywords = [
    'feel',
    'emotion',
    'love',
    'hurt',
    'sad',
    'happy',
    'afraid',
    'anxious',
    'lonely',
    'struggle',
    'pain',
    'joy',
    'meaningful',
    'purpose',
    'care',
    'dream',
  ]

  const lowerMessage = message.toLowerCase()
  return emotionalKeywords.some((keyword) => lowerMessage.includes(keyword))
}

/**
 * Split long responses into multiple short messages (like real texting)
 * If response is short, keep as single message
 * If response is long, split by sentences so each message is brief
 */
function splitResponseIntoMessages(text: string): string[] {
  const trimmed = text.trim()

  // If short enough, keep as single message
  if (trimmed.length < 60) {
    return [trimmed]
  }

  // Split by sentences (. ! ?)
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0)

  // If already many short sentences, keep them separate
  if (sentences.length > 1) {
    // Group sentences to keep each message 30-80 characters
    const messages: string[] = []
    let current = ''

    for (const sentence of sentences) {
      if (current.length === 0) {
        current = sentence
      } else if ((current + ' ' + sentence).length <= 80) {
        current += ' ' + sentence
      } else {
        messages.push(current)
        current = sentence
      }
    }

    if (current.length > 0) {
      messages.push(current)
    }

    return messages.length > 0 ? messages : [trimmed]
  }

  // If single long sentence, just return as is (can't split further)
  return [trimmed]
}

/**
 * Split message into chunks for typing delay effect
 */
function chunkMessage(text: string, chunkSize: number = 20): string[] {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize))
  }
  return chunks.length > 0 ? chunks : [text]
}

/**
 * ENFORCE: Remove all asterisks and narrative descriptions from response
 * This ensures creators NEVER respond with *actions* or *descriptions*
 * Only pure dialogue is allowed
 */
function cleanResponse(text: string): string {
  // Remove patterns like *text*, **text*, ***text***, etc.
  let cleaned = text.replace(/\*+[^*]*\*+/g, '').trim()

  // If we removed everything, return original
  if (!cleaned) return text.trim()

  // Remove leading/trailing asterisks that might be left
  cleaned = cleaned.replace(/^\*+\s*/, '').replace(/\s*\*+$/, '').trim()

  return cleaned
}

/**
 * Calculate natural response delay based on interest and distraction
 * Makes responses feel human-like (2-10 seconds) rather than instant
 */
function calculateNaturalDelay(visitorMessage: string, creatorInterests: any[]): number {
  // Base delay: 2-10 seconds
  const baseDelay = Math.random() * 8000 + 2000 // 2-10 seconds in ms

  // Interest-based modifier: if message mentions creator's interests, reply faster
  let interestModifier = 0
  if (creatorInterests && creatorInterests.length > 0) {
    const messageText = visitorMessage.toLowerCase()
    const matchedInterests = creatorInterests.filter((interest: any) => {
      const interestName = interest.name?.toLowerCase() || ''
      return messageText.includes(interestName) || interestName.includes(messageText)
    })

    // For each matching interest, reduce delay by 2-5 seconds (they're interested!)
    if (matchedInterests.length > 0) {
      interestModifier = -(Math.random() * 3000 + 2000) * matchedInterests.length
    }
  }

  // Random distraction: 0-3 seconds (simulates them being on other apps, distracted)
  const distractionDelay = Math.random() * 3000

  // Final delay: combine all factors
  const totalDelay = Math.max(2000, baseDelay + interestModifier + distractionDelay)

  console.log('[Chat] Natural delay:', {
    baseDelay: Math.round(baseDelay),
    interestModifier: Math.round(interestModifier),
    distractionDelay: Math.round(distractionDelay),
    totalDelay: Math.round(totalDelay),
    seconds: (Math.round(totalDelay) / 1000).toFixed(1),
  })

  return totalDelay
}
