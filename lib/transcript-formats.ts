/**
 * Handle multiple transcript formats (WhatsApp, YouTube, Podcast, Generic)
 * Extract messages from different sources with format-specific logic
 */

export interface ExtractedMessages {
  messages: string[]
  speaker_count?: number
  detected_speakers?: string[]
  speaker_name?: string // If we extracted from a specific speaker
  confidence: number // 0-1, how confident we are about extraction
  source_type: string
  message_count: number
}

export interface TranscriptSource {
  type: 'whatsapp' | 'youtube' | 'podcast' | 'generic'
  speaker_name?: string // For speaker extraction (YouTube/Podcast)
  auto_detect_speaker?: boolean
}

/**
 * Auto-detect transcript format and extract messages
 */
export function extractFromTranscript(
  text: string,
  options: TranscriptSource = { type: 'generic' }
): ExtractedMessages {
  const lines = text.split('\n').filter(line => line.trim())

  switch (options.type) {
    case 'whatsapp':
      return extractFromWhatsApp(text)
    case 'youtube':
      return extractFromYouTube(text, options.speaker_name, options.auto_detect_speaker)
    case 'podcast':
      return extractFromPodcast(text, options.speaker_name, options.auto_detect_speaker)
    case 'generic':
    default:
      return extractFromGeneric(text)
  }
}

/**
 * Extract from WhatsApp format: [HH:MM, DD/MM/YYYY] Name: Message
 */
function extractFromWhatsApp(text: string): ExtractedMessages {
  const lines = text.split('\n').filter(line => line.trim())

  // Detect creator name from first message
  let creatorName = ''
  for (const line of lines) {
    const match = line.match(/\]\s*([^:]+):/)
    if (match) {
      creatorName = match[1].trim()
      break
    }
  }

  // Extract messages only from the creator
  const messages: string[] = []
  if (creatorName) {
    const pattern = new RegExp(`\\]\\s*${creatorName}:\\s*(.+)`)
    for (const line of lines) {
      const match = line.match(pattern)
      if (match) {
        const message = match[1].trim()
        if (message.length > 2 && !message.startsWith('‎')) {
          messages.push(message)
        }
      }
    }
  }

  return {
    messages,
    speaker_name: creatorName,
    confidence: messages.length > 50 ? 0.95 : messages.length > 10 ? 0.8 : 0.5,
    source_type: 'whatsapp',
    message_count: messages.length,
  }
}

/**
 * Extract from YouTube transcript format
 * Patterns: [Speaker:] Message or Speaker:\nMessage or [00:00] Speaker: Message
 */
function extractFromYouTube(
  text: string,
  speakerName?: string,
  autoDetect: boolean = true
): ExtractedMessages {
  const lines = text.split('\n').filter(line => line.trim())

  let detectedSpeakers: Set<string> = new Set()
  const allMessages: Map<string, string[]> = new Map()

  // Try different YouTube transcript formats
  for (const line of lines) {
    // Format 1: [Speaker Name]: Message
    let match = line.match(/^\[?([^\]:\n]+)\]?:\s*(.+)$/)
    if (match && match[2] && match[2].length > 2) {
      const speaker = match[1].trim()
      const message = match[2].trim()

      // Skip timestamp-only speakers like "[00:15]"
      if (!/^\d{2}:\d{2}/.test(speaker)) {
        detectedSpeakers.add(speaker)
        if (!allMessages.has(speaker)) {
          allMessages.set(speaker, [])
        }
        allMessages.get(speaker)!.push(message)
        continue
      }
    }

    // Format 2: Speaker: Message (no brackets)
    match = line.match(/^([A-Za-z\s]+):\s+(.+)$/)
    if (match && match[2] && match[2].length > 2) {
      const speaker = match[1].trim()
      const message = match[2].trim()

      // Skip numbers and timestamps
      if (!/^\d/.test(speaker) && speaker.length < 50) {
        detectedSpeakers.add(speaker)
        if (!allMessages.has(speaker)) {
          allMessages.set(speaker, [])
        }
        allMessages.get(speaker)!.push(message)
      }
    }
  }

  // Determine which speaker to extract
  let targetSpeaker = speakerName
  if (!targetSpeaker && autoDetect && detectedSpeakers.size > 0) {
    // Pick the speaker with most messages
    targetSpeaker = Array.from(detectedSpeakers).reduce((prev, current) =>
      (allMessages.get(current)?.length || 0) > (allMessages.get(prev)?.length || 0) ? current : prev
    )
  }

  const messages = targetSpeaker ? (allMessages.get(targetSpeaker) || []) : []

  return {
    messages,
    detected_speakers: Array.from(detectedSpeakers),
    speaker_name: targetSpeaker,
    confidence: messages.length > 100 ? 0.9 : messages.length > 30 ? 0.75 : 0.5,
    source_type: 'youtube',
    message_count: messages.length,
    speaker_count: detectedSpeakers.size,
  }
}

/**
 * Extract from Podcast transcript format
 * Similar to YouTube with speaker labels
 */
function extractFromPodcast(
  text: string,
  speakerName?: string,
  autoDetect: boolean = true
): ExtractedMessages {
  // Podcast format is similar to YouTube, use same extraction logic
  const result = extractFromYouTube(text, speakerName, autoDetect)
  result.source_type = 'podcast'
  return result
}

/**
 * Generic text extraction - treat entire text as relevant content
 * Split by paragraph breaks or just take all lines
 */
function extractFromGeneric(text: string): ExtractedMessages {
  // Split by double newlines (paragraphs) or single newlines
  const messages = text
    .split(/\n{2,}/)
    .map(para => para.replace(/\n/g, ' ').trim())
    .filter(para => para.length > 5) // Keep paragraphs longer than 5 chars

  return {
    messages,
    confidence: messages.length > 50 ? 0.7 : messages.length > 20 ? 0.6 : 0.4,
    source_type: 'generic',
    message_count: messages.length,
  }
}

/**
 * Merge multiple extracted message sources
 * Combines messages from different transcripts into one deduplicated list
 */
export function mergeExtractedMessages(
  sources: ExtractedMessages[],
  weights?: number[]
): ExtractedMessages {
  const allMessages: string[] = []
  const allSpeakers: Set<string> = new Set()
  let totalConfidence = 0
  let sourceCount = 0

  sources.forEach((source, index) => {
    const weight = weights ? (weights[index] || 1) : 1
    allMessages.push(...source.messages)

    if (source.speaker_name) {
      allSpeakers.add(source.speaker_name)
    }
    if (source.detected_speakers) {
      source.detected_speakers.forEach(s => allSpeakers.add(s))
    }

    totalConfidence += source.confidence * weight
    sourceCount += weight
  })

  // Deduplicate messages (simple approach: remove exact duplicates)
  const uniqueMessages = Array.from(new Set(allMessages))

  return {
    messages: uniqueMessages,
    detected_speakers: Array.from(allSpeakers),
    confidence: sourceCount > 0 ? totalConfidence / sourceCount : 0.5,
    source_type: 'merged',
    message_count: uniqueMessages.length,
  }
}
