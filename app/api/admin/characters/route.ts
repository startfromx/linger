import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { mergeVoiceFingerprints, type VoiceFingerprint } from '@/lib/voiceFingerprint'

/**
 * Admin API for creating and managing fictional characters
 * POST /api/admin/characters/create - Create a new fictional character
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      display_name,
      age,
      gender,
      profession,
      interests,
      character_description,
      is_fictional = true,
      voice_fingerprint,
      profile_photo_url,
      gallery_urls,
      personality_tags,
      creator_user_id,
    } = body

    console.log('Admin: Creating fictional character:', display_name)

    // Validation
    if (!display_name || !voice_fingerprint) {
      return NextResponse.json(
        { error: 'Missing required fields: display_name, voice_fingerprint' },
        { status: 400 }
      )
    }

    if (!creator_user_id) {
      return NextResponse.json(
        { error: 'Missing creator_user_id - user must be authenticated' },
        { status: 400 }
      )
    }

    // For fictional characters, use a special system user ID
    // For real users, use the provided creator_user_id
    let userId = creator_user_id

    if (is_fictional) {
      // Use a special system user ID for all fictional characters
      // This satisfies the foreign key constraint while keeping fictional characters separate
      // The system user is a special account created in Supabase Auth for this purpose
      userId = '00000000-0000-0000-0000-000000000001' // System user for fictional characters
      console.log('Creating fictional character with system user ID')
    }

    console.log('Creating character profile:', display_name, 'user_id:', userId)

    // Create creator_profile for the character
    // Use admin client to bypass RLS policies for fictional character creation
    const adminClient = supabaseAdmin()

    // For fictional characters, we can directly insert since each gets a unique ID
    // For real characters, check if one exists for this user
    let creatorData;
    let creatorError;

    if (is_fictional) {
      // Insert new fictional character profile
      console.log('Creating new fictional character profile:', display_name)
      const result = await adminClient
        .from('creator_profile')
        .insert({
          user_id: userId,
          display_name,
          age: age || null,
          bio: character_description || null,
          voice_fingerprint: ensureProperVoiceFingerprint(voice_fingerprint),
          personality_tags: personality_tags || [],
          gallery_urls: gallery_urls || [],
          profile_photo_url: profile_photo_url || null,
          is_fictional: true,
          creator_settings: {
            gender: gender || 'other',
            profession: profession || [],
            interests: interests || [],
            character_description: character_description || '',
          },
        })
        .select()
        .single()
      creatorData = result.data
      creatorError = result.error
    } else {
      // For real users, check if profile exists
      const { data: existingProfile } = await adminClient
        .from('creator_profile')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (existingProfile) {
        // Update existing profile
        console.log('Updating existing creator profile for user:', userId)
        const result = await adminClient
          .from('creator_profile')
          .update({
            display_name,
            age: age || null,
            bio: character_description || null,
            voice_fingerprint: ensureProperVoiceFingerprint(voice_fingerprint),
            personality_tags: personality_tags || [],
            gallery_urls: gallery_urls || [],
            profile_photo_url: profile_photo_url || null,
            is_fictional: false,
            creator_settings: {
              gender: gender || 'other',
              profession: profession || [],
              interests: interests || [],
              character_description: character_description || '',
            },
          })
          .eq('user_id', userId)
          .select()
          .single()
        creatorData = result.data
        creatorError = result.error
      } else {
        // Create new profile for real user
        console.log('Creating new creator profile for user:', userId)
        const result = await adminClient
          .from('creator_profile')
          .insert({
            user_id: userId,
            display_name,
            age: age || null,
            bio: character_description || null,
            voice_fingerprint: ensureProperVoiceFingerprint(voice_fingerprint),
            personality_tags: personality_tags || [],
            gallery_urls: gallery_urls || [],
            profile_photo_url: profile_photo_url || null,
            is_fictional: false,
            creator_settings: {
              gender: gender || 'other',
              profession: profession || [],
              interests: interests || [],
              character_description: character_description || '',
            },
          })
          .select()
          .single()
        creatorData = result.data
        creatorError = result.error
      }
    }

    if (creatorError) {
      console.error('Creator creation error:', creatorError)
      return NextResponse.json(
        { error: `Failed to create character profile: ${creatorError.message}` },
        { status: 500 }
      )
    }

    console.log('Fictional character created:', creatorData.id)

    return NextResponse.json({
      success: true,
      character_id: creatorData.id,
      character_name: display_name,
      created_at: creatorData.created_at,
      message: `Fictional character "${display_name}" created successfully`,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Admin character creation error:', errorMsg)
    return NextResponse.json(
      { error: `Failed to create character: ${errorMsg}` },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/characters/merge-transcript
 * Merge a new transcript into an existing character's personality
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      character_id,
      transcript_text,
      source_type = 'generic',
      speaker_name,
    } = body

    console.log('Admin: Merging transcript into character:', character_id)

    if (!character_id || !transcript_text) {
      return NextResponse.json(
        { error: 'Missing required fields: character_id, transcript_text' },
        { status: 400 }
      )
    }

    // Get current character - use admin client to bypass RLS
    const adminClient = supabaseAdmin()
    const { data: character, error: charError } = await adminClient
      .from('creator_profile')
      .select('*')
      .eq('id', character_id)
      .single()

    if (charError || !character) {
      console.error('Character not found error:', charError)
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    // Import transcript extraction
    const { extractFromTranscript } = await import('@/lib/transcript-formats')
    const { extractVoiceFingerprint, mergeVoiceFingerprints } = await import('@/lib/voiceFingerprint')

    // Extract personality from new transcript
    const sourceOptions = {
      type: source_type as 'whatsapp' | 'youtube' | 'podcast' | 'generic',
      speaker_name,
    }

    const extracted = extractFromTranscript(transcript_text, sourceOptions)
    const newFingerprint = extractVoiceFingerprint(transcript_text, undefined, sourceOptions)

    // Merge with existing fingerprint
    const currentFingerprint = character.voice_fingerprint as VoiceFingerprint | null
    let mergedFingerprint = newFingerprint

    if (currentFingerprint) {
      mergedFingerprint = mergeVoiceFingerprints([currentFingerprint, newFingerprint], [0.5, 0.5])
    }

    // Save source to creator_sources table - use admin client
    const { data: sourceData, error: sourceError } = await adminClient
      .from('creator_sources')
      .insert({
        creator_id: character_id,
        source_type,
        source_name: speaker_name || `${source_type} transcript`,
        uploaded_text: transcript_text,
        extracted_messages_count: extracted.message_count,
        speaker_detected: speaker_name || extracted.speaker_name,
        fingerprint: newFingerprint,
        confidence: extracted.confidence,
      })
      .select()
      .single()

    if (sourceError) {
      console.error('Source save error:', sourceError)
      // Continue anyway - still update the fingerprint
    }

    // Update character with merged fingerprint - use admin client
    const { data: updatedChar, error: updateError } = await adminClient
      .from('creator_profile')
      .update({
        voice_fingerprint: mergedFingerprint,
        merged_fingerprint_from_sources: true,
        source_count: (character.source_count || 1) + 1,
      })
      .eq('id', character_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: `Failed to merge transcript: ${updateError.message}` },
        { status: 500 }
      )
    }

    console.log('Transcript merged successfully')

    return NextResponse.json({
      success: true,
      character_id,
      merged_fingerprint: mergedFingerprint,
      improvement_metrics: {
        messages_added: extracted.message_count,
        sources_total: updatedChar.source_count,
        confidence: mergedFingerprint.confidence_scores?.overall || 0,
      },
      message: `Transcript merged. Character now has ${updatedChar.source_count} sources.`,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Admin merge transcript error:', errorMsg)
    return NextResponse.json(
      { error: `Failed to merge transcript: ${errorMsg}` },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/characters - Update character properties
 * Allows admins to update display_name, age, bio, personality_profile, etc.
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      character_id,
      display_name,
      age,
      bio,
      personality_profile,
    } = body

    if (!character_id) {
      return NextResponse.json(
        { error: 'Missing required field: character_id' },
        { status: 400 }
      )
    }

    console.log('Admin: Updating character:', character_id, {
      display_name,
      age,
      hasPersonalityProfile: !!personality_profile,
    })

    const adminClient = supabaseAdmin()

    // Build update object with only provided fields
    const updateData: any = {}
    if (display_name !== undefined) updateData.display_name = display_name
    if (age !== undefined) updateData.age = age
    if (bio !== undefined) updateData.bio = bio
    if (personality_profile !== undefined) updateData.personality_profile = personality_profile

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const { data: updated, error: updateError } = await adminClient
      .from('creator_profile')
      .update(updateData)
      .eq('id', character_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      const errorMsg = updateError.message || JSON.stringify(updateError)
      throw new Error(errorMsg)
    }

    console.log('Character updated successfully')

    return NextResponse.json({
      success: true,
      character: updated,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Admin update character error:', errorMsg)
    return NextResponse.json(
      { error: `Failed to update character: ${errorMsg}` },
      { status: 500 }
    )
  }
}

/**
 * Ensure voice fingerprint has proper structure
 */
function ensureProperVoiceFingerprint(fp: any): VoiceFingerprint {
  return {
    writing_style: fp.writing_style || 'thoughtful',
    interests: Array.isArray(fp.interests)
      ? fp.interests.map((i: any) => (typeof i === 'string' ? { name: i, frequency: 1 } : i))
      : [],
    emotional_tone: fp.emotional_tone || 'balanced',
    humor_style: fp.humor_style || 'subtle or dry',
    conversational_patterns: fp.conversational_patterns || 'expressive and open',
    vocabulary_level: fp.vocabulary_level || 'casual',
    values: Array.isArray(fp.values) ? fp.values : [],
    example_messages: Array.isArray(fp.example_messages) ? fp.example_messages : [],
    confidence_scores: fp.confidence_scores || {
      writing_style: 0.7,
      emotional_tone: 0.7,
      vocabulary_level: 0.7,
      overall: 0.7,
    },
  }
}
