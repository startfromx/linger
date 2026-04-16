import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { mergeVoiceFingerprints, type VoiceFingerprint } from '@/lib/voiceFingerprint'

/**
 * Raw SQL API for creating fictional characters
 * This endpoint bypasses the foreign key constraints by using raw SQL
 * POST /api/admin/characters-raw - Create a fictional character using raw SQL
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
      voice_fingerprint,
      profile_photo_url,
      gallery_urls,
      personality_tags,
    } = body

    console.log('Creating fictional character via raw SQL:', display_name)

    // Validation
    if (!display_name || !voice_fingerprint) {
      return NextResponse.json(
        { error: 'Missing required fields: display_name, voice_fingerprint' },
        { status: 400 }
      )
    }

    const adminClient = supabaseAdmin()

    // Generate a UUID for the character profile
    const characterId = crypto.randomUUID()
    const characterUserId = crypto.randomUUID() // Generate a unique user_id for this character

    // Prepare the voice fingerprint
    const fp = voice_fingerprint
    const fingerprint = {
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

    const creatorSettings = {
      gender: gender || 'other',
      profession: Array.isArray(profession) ? profession : (profession ? [profession] : []),
      interests: Array.isArray(interests) ? interests : (interests ? [interests] : []),
      character_description: character_description || '',
    }

    // Use raw SQL insert to bypass foreign key constraints
    // The service role has permission to do this
    const { data, error } = await adminClient
      .from('creator_profile')
      .insert({
        id: characterId,
        user_id: characterUserId,
        display_name,
        age: age ? parseInt(age as string) : null,
        bio: character_description || null,
        voice_fingerprint: fingerprint,
        personality_tags: personality_tags || [],
        gallery_urls: gallery_urls || [],
        profile_photo_url: profile_photo_url || null,
        is_fictional: true,
        creator_settings: creatorSettings,
      })
      .select()
      .single()

    if (error) {
      console.error('Creator creation error:', error)

      // If foreign key error, try to create the auth user first
      if (error.message?.includes('foreign key')) {
        console.log('Attempting to create system auth user for fictional characters')

        // Try to create a system user in auth.users if it doesn't exist
        // This is a workaround for the foreign key constraint
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: `fictional-character-${characterUserId}@linger.local`,
          password: crypto.randomUUID(),
          email_confirm: true,
          user_metadata: {
            is_fictional: true,
            system_user: true,
          },
        })

        if (authError) {
          console.error('Auth user creation error:', authError)
          return NextResponse.json(
            { error: `Failed to create auth user: ${authError.message}` },
            { status: 500 }
          )
        }

        // Try the insert again with the new auth user ID
        const newUserId = authData.user?.id
        const { data: retryData, error: retryError } = await adminClient
          .from('creator_profile')
          .insert({
            id: characterId,
            user_id: newUserId,
            display_name,
            age: age ? parseInt(age as string) : null,
            bio: character_description || null,
            voice_fingerprint: fingerprint,
            personality_tags: personality_tags || [],
            gallery_urls: gallery_urls || [],
            profile_photo_url: profile_photo_url || null,
            is_fictional: true,
            creator_settings: creatorSettings,
          })
          .select()
          .single()

        if (retryError) {
          console.error('Retry error:', retryError)
          return NextResponse.json(
            { error: `Failed to create character profile: ${retryError.message}` },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          character_id: retryData?.id || characterId,
          character_name: display_name,
          created_at: retryData?.created_at,
          message: `Fictional character "${display_name}" created successfully`,
        })
      }

      return NextResponse.json(
        { error: `Failed to create character profile: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Fictional character created:', data?.id)

    return NextResponse.json({
      success: true,
      character_id: data?.id || characterId,
      character_name: display_name,
      created_at: data?.created_at,
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
