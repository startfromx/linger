/**
 * Unified Creator Personality Profile Types
 *
 * Consolidates all personality dimensions for both real creators and fictional characters.
 * Used to build rich, distinct system prompts during chat inference.
 */

/**
 * Voice Fingerprint - extracted from transcripts
 */
export interface VoiceFingerprint {
  writing_style: string
  interests: Array<{ name: string; frequency: number }>
  emotional_tone: string
  humor_style: string
  conversational_patterns: string
  vocabulary_level: string
  values: string[]
  example_messages: string[]
  confidence_scores?: {
    writing_style: number
    emotional_tone: number
    vocabulary_level: number
    overall: number
  }
}

/**
 * Creator Settings - user-configured personality dimensions
 * Used for both real creators and fictional characters
 */
export interface CreatorSettings {
  // Basic personality
  maturity_level?: 'cautious' | 'casual' | 'very_open'
  communication_style?: 'formal' | 'casual' | 'blunt' | 'friendly' | 'flirty'
  language_style?: 'british' | 'american' | 'singlish' | 'mixed'
  age?: number

  // New personality dimensions
  gender?: string
  profession?: string[]
  interests?: string[]
  personality_archetype?: string

  // Topics and comfort level
  comfort_topics?: string[]
  personality_tags?: string[]
}

/**
 * Comprehensive Creator Personality Profile
 * Combines all personality dimensions into a single unified interface
 * Stored as JSONB in creator_profile table
 */
export interface CreatorPersonalityProfile {
  // Core Identity
  id: string
  display_name: string
  age: number | null
  gender: string | null
  profession: string[] // e.g., ["Art Student", "Designer"]

  // Geographic & Linguistic Context
  location: string | null // "London, UK", "Singapore", "Austin, Texas"
  country: string | null // "UK", "SG", "US"
  language_style: 'british' | 'american' | 'singlish' | 'mixed' | null
  accent_patterns: string | null // "Scottish", "Southern", "East London"
  code_switching: boolean // Do they mix multiple languages?

  // Communication Style
  formality: 'very_formal' | 'formal' | 'casual' | 'very_casual'
  expressiveness: 'reserved' | 'moderate' | 'expressive' | 'very_expressive'
  directness: 'indirect' | 'balanced' | 'direct' | 'blunt'
  tone_tendency: 'sarcastic' | 'warm' | 'neutral' | 'dry' | 'enthusiastic'

  // Personality Traits & Archetype
  traits: string[] // "perfectionist", "humorous", "introverted", "creative"
  archetype: string | null // "mentor", "friend", "romantic", "intellectual", "rebel"

  // Voice Fingerprint (extracted from transcript)
  voice_fingerprint: VoiceFingerprint | null

  // Values & Interests
  interests: string[] // Main interests/hobbies
  values: string[] // Core values they care about
  topics_comfortable: string[] // Topics they actively engage with
  topics_off_limits: string[] // Topics to avoid in conversation

  // Cultural & Background Context
  cultural_background: string | null // "Indian", "Chinese", "British", "Mixed"
  education_level: 'high_school' | 'bachelor' | 'master' | 'phd' | null
  life_experience: string | null // "digital_nomad", "corporate", "creative", "student"

  // Unique Quirks & Patterns
  favorite_phrases: string[] // "lah", "innit", "honestly", "basically"
  common_emojis: string[] // "😂", "🔥", "✨", "😅"
  speech_patterns: string | null // "uses ellipsis frequently", "repeats words for emphasis"
  habitual_behaviors: string[] // "makes puns", "overthinks", "gives unsolicited advice"

  // Maturity Level
  maturity_level: 'cautious' | 'casual' | 'very_open'

  // Metadata
  is_fictional: boolean
  creator_user_id: string
  bio: string | null
  profile_photo_url: string | null
  gallery_urls: string[]
  created_at: string
  updated_at: string
}

/**
 * Partial type for updates
 */
export type CreatorPersonalityProfileUpdate = Partial<CreatorPersonalityProfile>

/**
 * Request body for creating/updating personality profiles
 */
export interface CreatorPersonalityUpdateRequest {
  personality_profile: CreatorPersonalityProfileUpdate
}

/**
 * Response type for personality operations
 */
export interface CreatorPersonalityResponse {
  success: boolean
  personality_profile: CreatorPersonalityProfile
  message?: string
}

/**
 * Type guard to check if object is CreatorPersonalityProfile
 */
export function isCreatorPersonalityProfile(
  obj: unknown
): obj is CreatorPersonalityProfile {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  const profile = obj as Record<string, unknown>
  return (
    typeof profile.id === 'string' &&
    typeof profile.display_name === 'string' &&
    typeof profile.is_fictional === 'boolean' &&
    typeof profile.creator_user_id === 'string'
  )
}

/**
 * Default/fallback personality profile
 */
export function getDefaultPersonalityProfile(
  creatorId: string,
  creatorName: string,
  userId: string,
  is_fictional: boolean = false
): CreatorPersonalityProfile {
  return {
    id: creatorId,
    display_name: creatorName,
    age: null,
    gender: null,
    profession: [],
    location: null,
    country: null,
    language_style: null,
    accent_patterns: null,
    code_switching: false,
    formality: 'casual',
    expressiveness: 'moderate',
    directness: 'balanced',
    tone_tendency: 'warm',
    traits: [],
    archetype: 'friend',
    voice_fingerprint: null,
    interests: [],
    values: [],
    topics_comfortable: [],
    topics_off_limits: [],
    cultural_background: null,
    education_level: null,
    life_experience: null,
    favorite_phrases: [],
    common_emojis: [],
    speech_patterns: null,
    habitual_behaviors: [],
    maturity_level: 'casual',
    is_fictional,
    creator_user_id: userId,
    bio: null,
    profile_photo_url: null,
    gallery_urls: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
