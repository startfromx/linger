/**
 * Enhanced voice fingerprint extraction supporting multiple transcript formats
 * Analyzes personality from WhatsApp, YouTube, Podcast, or generic transcripts
 * Supports merging multiple sources for richer personality profiles
 */

import { extractFromTranscript, TranscriptSource, ExtractedMessages, mergeExtractedMessages } from './transcript-formats'

export interface VoiceFingerprint {
  writing_style: string
  interests: Array<{ name: string; frequency: number }>
  emotional_tone: string
  humor_style: string
  conversational_patterns: string
  vocabulary_level: string
  values: string[]
  example_messages: string[]
  emojis?: Array<{ emoji: string; frequency: number }> // Top emojis used, extracted from transcript
  message_length_pattern?: 'short' | 'medium' | 'long' // How much they write per message
  reply_frequency_pattern?: 'single' | 'moderate' | 'burst' // How many messages per response
  confidence_scores?: {
    writing_style: number
    emotional_tone: number
    vocabulary_level: number
    overall: number
  }
}

/**
 * Main extraction function - supports multiple formats
 */
export function extractVoiceFingerprint(
  text: string,
  creatorName?: string,
  options?: TranscriptSource
): VoiceFingerprint {
  // Extract messages using format-specific logic
  const extracted = extractFromTranscript(text, options || { type: 'whatsapp' })

  return analyzePersonality(extracted.messages, extracted.confidence)
}

/**
 * Merge multiple personality fingerprints from different sources
 */
export function mergeVoiceFingerprints(
  fingerprints: VoiceFingerprint[],
  weights?: number[]
): VoiceFingerprint {
  if (fingerprints.length === 0) {
    return getDefaultFingerprint()
  }

  if (fingerprints.length === 1) {
    return fingerprints[0]
  }

  const w = weights || fingerprints.map(() => 1)
  const totalWeight = w.reduce((a, b) => a + b, 0)

  // Merge interests (weighted by frequency and source weight)
  const interestMap = new Map<string, number>()
  fingerprints.forEach((fp, idx) => {
    const weight = w[idx] / totalWeight
    fp.interests.forEach(interest => {
      const current = interestMap.get(interest.name) || 0
      interestMap.set(interest.name, current + interest.frequency * weight)
    })
  })

  const mergedInterests = Array.from(interestMap.entries())
    .map(([name, frequency]) => ({ name, frequency }))
    .sort((a, b) => b.frequency - a.frequency)

  // Find consensus on categorical values (most common)
  const writingStyles = fingerprints.map(fp => fp.writing_style)
  const emotionalTones = fingerprints.map(fp => fp.emotional_tone)
  const vocabularyLevels = fingerprints.map(fp => fp.vocabulary_level)

  // Average confidence scores
  const confidenceScores = {
    writing_style: fingerprints.reduce((sum, fp) => sum + (fp.confidence_scores?.writing_style || 0.5), 0) / fingerprints.length,
    emotional_tone: fingerprints.reduce((sum, fp) => sum + (fp.confidence_scores?.emotional_tone || 0.5), 0) / fingerprints.length,
    vocabulary_level: fingerprints.reduce((sum, fp) => sum + (fp.confidence_scores?.vocabulary_level || 0.5), 0) / fingerprints.length,
    overall: fingerprints.reduce((sum, fp) => sum + (fp.confidence_scores?.overall || 0.5), 0) / fingerprints.length,
  }

  // Merge example messages and sort by informativeness
  const allExamples = fingerprints.flatMap(fp => fp.example_messages)
  const uniqueExamples = Array.from(new Set(allExamples))
    .sort((a, b) => b.length - a.length) // Prefer longer, more informative examples
    .slice(0, 25) // Keep top 25

  // Merge emojis (weighted by source weight)
  const emojiMap = new Map<string, number>()
  fingerprints.forEach((fp, idx) => {
    const weight = w[idx] / totalWeight
    ;(fp.emojis || []).forEach(({ emoji, frequency }) => {
      const current = emojiMap.get(emoji) || 0
      emojiMap.set(emoji, current + frequency * weight)
    })
  })

  const mergedEmojis = Array.from(emojiMap.entries())
    .map(([emoji, frequency]) => ({ emoji, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10) // Top 10 emojis

  // Use most common message patterns
  const messageLengthPatterns = fingerprints.map(fp => fp.message_length_pattern).filter(Boolean)
  const replyFrequencyPatterns = fingerprints.map(fp => fp.reply_frequency_pattern).filter(Boolean)

  return {
    writing_style: getMostCommon(writingStyles),
    interests: mergedInterests,
    emotional_tone: getMostCommon(emotionalTones),
    humor_style: fingerprints[0].humor_style, // Use first source
    conversational_patterns: fingerprints[0].conversational_patterns,
    vocabulary_level: getMostCommon(vocabularyLevels),
    values: [...new Set(fingerprints.flatMap(fp => fp.values))],
    example_messages: uniqueExamples,
    emojis: mergedEmojis.length > 0 ? mergedEmojis : undefined,
    message_length_pattern: messageLengthPatterns.length > 0 ? (getMostCommon(messageLengthPatterns) as 'short' | 'medium' | 'long') : undefined,
    reply_frequency_pattern: replyFrequencyPatterns.length > 0 ? (getMostCommon(replyFrequencyPatterns) as 'single' | 'moderate' | 'burst') : undefined,
    confidence_scores: confidenceScores,
  }
}

/**
 * Core personality analysis from extracted messages
 */
function analyzePersonality(messages: string[], baseConfidence: number = 0.7): VoiceFingerprint {
  if (messages.length === 0) {
    return getDefaultFingerprint()
  }

  const fullText = messages.join(' ').toLowerCase()
  const words = fullText.split(/\s+/)

  // === WRITING STYLE ANALYSIS ===
  const emojiCount = (messages.join('').match(/\p{Emoji}/gu) || []).length
  const ellipsisCount = (fullText.match(/\.{2,}/g) || []).length
  const avgMessageLength = messages.reduce((sum, m) => sum + m.length, 0) / messages.length
  const exclamationCount = (fullText.match(/!/g) || []).length

  let writing_style = 'thoughtful'
  const writingConfidence = calculateConfidence(messages.length, 100)

  if (emojiCount > messages.length * 0.3) {
    writing_style = 'expressive'
  } else if (ellipsisCount > messages.length * 0.15) {
    writing_style = 'conversational'
  } else if (exclamationCount > messages.length * 0.2) {
    writing_style = 'expressive'
  } else if (avgMessageLength > 200) {
    writing_style = 'detailed'
  } else if (avgMessageLength < 50) {
    writing_style = 'concise'
  }

  // === INTERESTS ANALYSIS (Frequency-based) ===
  const interestKeywords = {
    travel: ['travel', 'trip', 'vacation', 'explore', 'adventure', 'journey', 'destination'],
    art: ['art', 'creative', 'design', 'aesthetic', 'beautiful', 'draw', 'paint'],
    music: ['music', 'song', 'listen', 'artist', 'concert', 'band', 'album'],
    food: ['food', 'cook', 'eat', 'restaurant', 'recipe', 'coffee', 'diet', 'chef'],
    fitness: ['gym', 'workout', 'fitness', 'run', 'yoga', 'exercise', 'sport', 'train'],
    books: ['read', 'book', 'author', 'novel', 'story', 'literature', 'writing'],
    movies: ['movie', 'watch', 'film', 'series', 'netflix', 'cinema', 'episode'],
    tech: ['tech', 'code', 'app', 'software', 'computer', 'programming', 'develop'],
    nature: ['nature', 'plant', 'outdoor', 'hike', 'garden', 'environment', 'green'],
    fashion: ['fashion', 'style', 'clothes', 'outfit', 'wear', 'dress', 'brand'],
    work: ['work', 'job', 'career', 'meeting', 'project', 'deadline', 'office', 'team'],
    relationships: ['love', 'friend', 'family', 'relationship', 'marriage', 'date'],
  }

  const interests: Array<{ name: string; frequency: number }> = []
  Object.entries(interestKeywords).forEach(([interest, keywords]) => {
    const count = keywords.reduce((sum, k) => sum + (fullText.match(new RegExp(`\\b${k}\\b`, 'gi')) || []).length, 0)
    if (count > 0) {
      interests.push({ name: interest, frequency: count / messages.length })
    }
  })

  interests.sort((a, b) => b.frequency - a.frequency)

  // === EMOTIONAL TONE ANALYSIS ===
  const emotionalCounts = {
    positive: 0,
    thoughtful: 0,
    playful: 0,
    warm: 0,
    passionate: 0,
  }

  const emotionalWords = {
    positive: ['love', 'amazing', 'great', 'awesome', 'wonderful', 'happy', 'excited', 'good', 'best'],
    thoughtful: ['think', 'feel', 'believe', 'understand', 'realize', 'know', 'see', 'mean'],
    playful: ['haha', 'lol', 'xd', 'kidding', 'funny', 'joke', 'hehe', 'pun'],
    warm: ['care', 'sweet', 'kind', 'appreciate', 'grateful', 'miss', 'hope', 'thanks'],
    passionate: ['passionate', 'intense', 'deep', 'forever', 'always', 'perfect', 'incredible'],
  }

  Object.entries(emotionalWords).forEach(([tone, words]) => {
    emotionalCounts[tone as keyof typeof emotionalCounts] = words.reduce(
      (sum, w) => sum + (fullText.match(new RegExp(`\\b${w}\\b`, 'gi')) || []).length,
      0
    )
  })

  let emotional_tone = 'balanced'
  const maxToneCount = Math.max(...Object.values(emotionalCounts))
  if (maxToneCount > 0) {
    const topTone = Object.entries(emotionalCounts).find(([_, count]) => count === maxToneCount)?.[0]
    if (topTone === 'positive') emotional_tone = 'warm'
    else if (topTone === 'thoughtful') emotional_tone = 'introspective'
    else if (topTone === 'playful') emotional_tone = 'playful'
    else if (topTone === 'passionate') emotional_tone = 'passionate'
  }

  const emotionConfidence = calculateConfidence(maxToneCount, 10)

  // === HUMOR STYLE ===
  const humorIndicators = (fullText.match(/(haha|lol|xd|hehe|😂|😄|😆|😅)/gi) || []).length
  const humor_style = humorIndicators > messages.length * 0.05 ? 'witty and playful' : 'subtle or dry'

  // === CONVERSATIONAL PATTERNS ===
  const questionCount = (fullText.match(/\?/g) || []).length
  const conversational_patterns = questionCount > messages.length * 0.1 ? 'engaging and curious' : 'expressive and open'

  // === VOCABULARY LEVEL (Frequency-based) ===
  const sophisticatedWords = [
    'however',
    'nevertheless',
    'eloquent',
    'substantial',
    'pragmatic',
    'deliberate',
    'sophisticated',
    'meticulous',
    'comprehensive',
    'consequently',
  ]
  const casualWords = [
    'yap',
    'ok',
    'yeah',
    'lol',
    'yup',
    'nah',
    'kinda',
    'sorta',
    'gonna',
    'wanna',
    'gotta',
    'haha',
    'cool',
    'lolz',
  ]

  const sophisticatedCount = sophisticatedWords.reduce(
    (sum, w) => sum + (fullText.match(new RegExp(`\\b${w}\\b`, 'gi')) || []).length,
    0
  )
  const casualCount = casualWords.reduce(
    (sum, w) => sum + (fullText.match(new RegExp(`\\b${w}\\b`, 'gi')) || []).length,
    0
  )
  const grammaryIssueCount = (fullText.match(/(is not cannot|didn't recieved|are not like|lowercase i)/gi) || []).length

  let vocabulary_level = 'casual'
  if (casualCount > sophisticatedCount * 0.5 || grammaryIssueCount > 0) {
    vocabulary_level = 'casual/informal'
  }
  if (sophisticatedCount > casualCount * 2) {
    vocabulary_level = 'sophisticated'
  }

  const vocabConfidence = calculateConfidence(sophisticatedCount + casualCount, 5)

  // === EXTRACT BEST EXAMPLE MESSAGES ===
  const scoredMessages = messages.map(msg => ({
    text: msg,
    score: scoreMessageInformativeness(msg),
  }))

  const selectedExamples = scoredMessages
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(m => m.text)

  // === VALUES (Derived) ===
  const values: string[] = []
  if (interests.some(i => ['nature', 'fitness'].includes(i.name))) values.push('health-conscious')
  if (interests.some(i => ['art', 'music'].includes(i.name))) values.push('creative')
  if (emotionalCounts.warm > 0) values.push('empathetic')
  if (questionCount > 0) values.push('curious')
  if (avgMessageLength > 100) values.push('thoughtful')
  if (interests.some(i => ['work', 'tech'].includes(i.name))) values.push('career-focused')

  // === EMOJI EXTRACTION ===
  const emojiMap = new Map<string, number>()
  const fullTextForEmojis = messages.join(' ')
  const emojiMatches = fullTextForEmojis.match(/\p{Emoji}/gu) || []
  emojiMatches.forEach(emoji => {
    emojiMap.set(emoji, (emojiMap.get(emoji) || 0) + 1)
  })

  const emojis = Array.from(emojiMap.entries())
    .map(([emoji, count]) => ({
      emoji,
      frequency: count / (messages.length || 1),
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10) // Top 10 emojis

  // === MESSAGE LENGTH PATTERN ===
  // Determine if this person writes short, medium, or long messages
  let message_length_pattern: 'short' | 'medium' | 'long' = 'medium'
  if (avgMessageLength < 60) {
    message_length_pattern = 'short'
  } else if (avgMessageLength > 150) {
    message_length_pattern = 'long'
  }

  // === REPLY FREQUENCY PATTERN ===
  // Determine if this person sends single messages, moderate (2-3), or bursts (4+)
  // Based on message count relative to what a normal conversation would have
  // If many messages in transcript: likely sends multiple per response
  let reply_frequency_pattern: 'single' | 'moderate' | 'burst' = 'single'

  // Heuristic: if we have many short messages, they likely send multiple per response
  const messageCountIndicator = messages.length
  const shortMessageCount = messages.filter(m => m.length < 60).length
  const shortMessageRatio = shortMessageCount / messageCountIndicator

  if (messageCountIndicator > 50 && shortMessageRatio > 0.6) {
    // Many messages + mostly short = likely sends multiple per response
    reply_frequency_pattern = 'burst'
  } else if (messageCountIndicator > 30 || shortMessageRatio > 0.4) {
    // Some messages or some short ones = moderate
    reply_frequency_pattern = 'moderate'
  }

  return {
    writing_style,
    interests,
    emotional_tone,
    humor_style,
    conversational_patterns,
    vocabulary_level,
    values: [...new Set(values)],
    example_messages: selectedExamples,
    emojis: emojis.length > 0 ? emojis : undefined,
    message_length_pattern,
    reply_frequency_pattern,
    confidence_scores: {
      writing_style: writingConfidence,
      emotional_tone: emotionConfidence,
      vocabulary_level: vocabConfidence,
      overall: baseConfidence * (writingConfidence + emotionConfidence + vocabConfidence) / 3,
    },
  }
}

/**
 * Score message informativeness (preference for longer, more varied content)
 */
function scoreMessageInformativeness(message: string): number {
  const length = message.length
  const uniqueWords = new Set(message.toLowerCase().split(/\s+/)).size
  const hasEmoji = /\p{Emoji}/u.test(message)
  const hasPunctuation = /[!?;:]/.test(message)

  let score = 0
  if (length > 20) score += 2
  if (length > 50) score += 2
  if (uniqueWords > 10) score += 1
  if (hasEmoji) score += 0.5
  if (hasPunctuation) score += 0.5

  return score
}

/**
 * Calculate confidence score based on sample size
 */
function calculateConfidence(sampleSize: number, targetSize: number): number {
  return Math.min(sampleSize / targetSize, 1)
}

/**
 * Get most common item in array
 */
function getMostCommon<T>(arr: T[]): T {
  const counts = new Map<T, number>()
  arr.forEach(item => {
    counts.set(item, (counts.get(item) || 0) + 1)
  })
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0]
}

/**
 * Default fingerprint for empty input
 */
function getDefaultFingerprint(): VoiceFingerprint {
  return {
    writing_style: 'thoughtful',
    interests: [],
    emotional_tone: 'balanced',
    humor_style: 'subtle or dry',
    conversational_patterns: 'expressive and open',
    vocabulary_level: 'casual',
    values: [],
    example_messages: [],
    message_length_pattern: 'medium',
    reply_frequency_pattern: 'single',
    confidence_scores: {
      writing_style: 0,
      emotional_tone: 0,
      vocabulary_level: 0,
      overall: 0,
    },
  }
}
