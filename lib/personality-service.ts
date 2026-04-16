/**
 * Personality Profile Service
 *
 * Utilities for building, updating, and retrieving creator personality profiles.
 * Handles merging of voice_fingerprint with creator_settings and database operations.
 */

import { supabaseAdmin } from '@/lib/supabase'
import {
  CreatorPersonalityProfile,
  CreatorPersonalityProfileUpdate,
  CreatorSettings,
  VoiceFingerprint,
  getDefaultPersonalityProfile,
} from '@/lib/types/creator-profile'

/**
 * Build a unified personality profile from existing data
 * Merges voice_fingerprint + creator_settings + other fields
 */
export async function buildCreatorPersonalityProfile(
  creatorId: string
): Promise<CreatorPersonalityProfile | null> {
  try {
    const adminClient = supabaseAdmin()

    // Get creator profile from database
    const { data: creator, error } = await adminClient
      .from('creator_profile')
      .select('*')
      .eq('id', creatorId)
      .single()

    if (error || !creator) {
      console.error('Error fetching creator:', error)
      return null
    }

    // If personality_profile already exists, return it
    if (creator.personality_profile) {
      return creator.personality_profile as CreatorPersonalityProfile
    }

    // Build from existing data
    const profile = buildFromLegacyData(creator)
    return profile
  } catch (error) {
    console.error('Error building personality profile:', error)
    return null
  }
}

/**
 * Build personality profile from legacy creator_settings and voice_fingerprint
 * Exported for use in migration scripts
 */
export function buildFromLegacyData(creator: any): CreatorPersonalityProfile {
  const settings = creator.creator_settings || {}
  const voiceFingerprint = creator.voice_fingerprint as VoiceFingerprint | null

  // Determine language style from settings
  let language_style: 'british' | 'american' | 'singlish' | 'mixed' | null = null
  if (settings.language_style) {
    language_style = settings.language_style
  } else if (voiceFingerprint) {
    // Try to infer from voice fingerprint
    language_style = inferLanguageStyle(voiceFingerprint)
  }

  // Map communication style to formality and other dimensions
  let formality: 'very_formal' | 'formal' | 'casual' | 'very_casual' = 'casual'
  if (settings.communication_style) {
    formality = mapCommunicationStyleToFormality(settings.communication_style)
  }

  // Determine tone from emotional_tone
  let tone_tendency: 'sarcastic' | 'warm' | 'neutral' | 'dry' | 'enthusiastic' = 'warm'
  if (voiceFingerprint?.emotional_tone) {
    tone_tendency = mapEmotionalToneToTone(voiceFingerprint.emotional_tone)
  }

  // Extract interests from both voice_fingerprint and settings
  const interests = [
    ...(voiceFingerprint?.interests?.map(i => i.name) || []),
    ...(settings.interests || []),
  ]
  const uniqueInterests = Array.from(new Set(interests))

  return {
    id: creator.id,
    display_name: creator.display_name,
    age: settings.age || null,
    gender: settings.gender || null,
    profession: settings.profession || [],
    location: creator.city || null,
    country: inferCountry(creator.city),
    language_style,
    accent_patterns: null,
    code_switching: false,
    formality,
    expressiveness: 'moderate',
    directness: 'balanced',
    tone_tendency,
    traits: [],
    archetype: null,
    voice_fingerprint: voiceFingerprint || null,
    interests: uniqueInterests,
    values: voiceFingerprint?.values || [],
    topics_comfortable: settings.comfort_topics || [],
    topics_off_limits: creator.topics_off_limits || [],
    cultural_background: null,
    education_level: null,
    life_experience: null,
    favorite_phrases: [],
    common_emojis: [],
    speech_patterns: null,
    habitual_behaviors: [],
    maturity_level: settings.maturity_level || 'casual',
    is_fictional: creator.is_fictional || false,
    creator_user_id: creator.user_id,
    bio: creator.bio || null,
    profile_photo_url: creator.profile_photo_url || null,
    gallery_urls: creator.gallery_urls || [],
    created_at: creator.created_at,
    updated_at: creator.updated_at || creator.created_at,
  }
}

/**
 * Infer language style from voice fingerprint characteristics
 */
function inferLanguageStyle(
  fp: VoiceFingerprint
): 'british' | 'american' | 'singlish' | 'mixed' | null {
  // Check example messages and writing style for language indicators
  const examples = (fp.example_messages || []).join(' ').toLowerCase()

  if (
    examples.includes('lah') ||
    examples.includes('lor') ||
    examples.includes('meh') ||
    examples.includes('leh')
  ) {
    return 'singlish'
  }

  if (
    examples.includes('innit') ||
    examples.includes('blimey') ||
    examples.includes('cheers') ||
    examples.includes('brilliant')
  ) {
    return 'british'
  }

  if (
    examples.includes("y'all") ||
    examples.includes('gonna') ||
    examples.includes('awesome')
  ) {
    return 'american'
  }

  return null
}

/**
 * Infer country from location string
 */
function inferCountry(location: string | null): string | null {
  if (!location) return null

  const lower = location.toLowerCase()

  if (
    lower.includes('uk') ||
    lower.includes('london') ||
    lower.includes('england') ||
    lower.includes('scotland')
  ) {
    return 'UK'
  }

  if (
    lower.includes('singapore') ||
    lower.includes('sg')
  ) {
    return 'SG'
  }

  if (
    lower.includes('usa') ||
    lower.includes('us') ||
    lower.includes('america') ||
    lower.includes('texas') ||
    lower.includes('california') ||
    lower.includes('new york')
  ) {
    return 'US'
  }

  if (
    lower.includes('india') ||
    lower.includes('delhi') ||
    lower.includes('mumbai')
  ) {
    return 'IN'
  }

  if (lower.includes('china') || lower.includes('beijing')) {
    return 'CN'
  }

  return null
}

/**
 * Map communication style to formality level
 */
function mapCommunicationStyleToFormality(
  style: string
): 'very_formal' | 'formal' | 'casual' | 'very_casual' {
  const lower = style.toLowerCase()

  if (lower.includes('formal') || lower.includes('professional')) {
    return 'formal'
  }

  if (lower.includes('blunt') || lower.includes('direct')) {
    return 'very_casual'
  }

  return 'casual'
}

/**
 * Map emotional tone to tone tendency
 */
function mapEmotionalToneToTone(
  tone: string
): 'sarcastic' | 'warm' | 'neutral' | 'dry' | 'enthusiastic' {
  const lower = tone.toLowerCase()

  if (lower.includes('sarcastic') || lower.includes('sarcasm')) {
    return 'sarcastic'
  }

  if (lower.includes('warm') || lower.includes('friendly') || lower.includes('kind')) {
    return 'warm'
  }

  if (lower.includes('dry') || lower.includes('dry humor')) {
    return 'dry'
  }

  if (lower.includes('enthusiastic') || lower.includes('excited') || lower.includes('energetic')) {
    return 'enthusiastic'
  }

  return 'neutral'
}

/**
 * Update personality profile in database
 */
export async function updatePersonalityProfile(
  creatorId: string,
  updates: CreatorPersonalityProfileUpdate
): Promise<CreatorPersonalityProfile | null> {
  try {
    const adminClient = supabaseAdmin()

    // Get current profile
    let profile = await buildCreatorPersonalityProfile(creatorId)
    if (!profile) {
      console.error('Could not build current profile for update')
      return null
    }

    // Merge updates
    profile = {
      ...profile,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // Save to database
    const { data, error } = await adminClient
      .from('creator_profile')
      .update({
        personality_profile: profile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', creatorId)
      .select()
      .single()

    if (error) {
      console.error('Error updating personality profile:', error)
      return null
    }

    return data?.personality_profile as CreatorPersonalityProfile
  } catch (error) {
    console.error('Error in updatePersonalityProfile:', error)
    return null
  }
}

/**
 * Get personality profile from database
 * Falls back to building from legacy data if not found
 */
export async function getPersonalityProfile(
  creatorId: string
): Promise<CreatorPersonalityProfile | null> {
  try {
    const adminClient = supabaseAdmin()

    const { data: creator, error } = await adminClient
      .from('creator_profile')
      .select('*')
      .eq('id', creatorId)
      .single()

    if (error || !creator) {
      console.error('Error fetching creator:', error)
      return null
    }

    // If personality_profile exists and is valid, return it
    if (creator.personality_profile) {
      return creator.personality_profile as CreatorPersonalityProfile
    }

    // Build from legacy data
    return buildFromLegacyData(creator)
  } catch (error) {
    console.error('Error getting personality profile:', error)
    return null
  }
}

/**
 * Create a new personality profile for fictional character
 */
export async function createPersonalityProfile(
  creatorId: string,
  creatorName: string,
  userId: string,
  profile_data?: Partial<CreatorPersonalityProfile>
): Promise<CreatorPersonalityProfile> {
  const profile = getDefaultPersonalityProfile(creatorId, creatorName, userId, true)

  // Merge any provided data
  if (profile_data) {
    Object.assign(profile, profile_data)
  }

  return profile
}

/**
 * Get personality profile with full fallback and defaults
 */
export async function getOrBuildPersonalityProfile(
  creatorId: string
): Promise<CreatorPersonalityProfile> {
  const profile = await getPersonalityProfile(creatorId)

  if (profile) {
    return profile
  }

  // If we get here, something went wrong - return default
  console.warn(`Could not build personality profile for ${creatorId}, returning default`)
  const adminClient = supabaseAdmin()
  const { data: creator } = await adminClient
    .from('creator_profile')
    .select('id, display_name, user_id, is_fictional')
    .eq('id', creatorId)
    .single()

  if (!creator) {
    throw new Error(`Creator ${creatorId} not found`)
  }

  return getDefaultPersonalityProfile(
    creatorId,
    creator.display_name,
    creator.user_id,
    creator.is_fictional
  )
}
