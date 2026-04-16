/**
 * Migration Script: Populate personality_profile for existing creators
 *
 * This script reads all existing creators from the database and builds
 * CreatorPersonalityProfile objects from their existing voice_fingerprint
 * and creator_settings, then saves them to the personality_profile column.
 *
 * Usage: Run this once after deploying the new personality system.
 * It's safe to run multiple times - it will overwrite existing data.
 */

import { supabaseAdmin } from '@/lib/supabase'
import { buildFromLegacyData } from '@/lib/personality-service'
import { CreatorPersonalityProfile } from '@/lib/types/creator-profile'

export interface MigrationResults {
  totalCreators: number
  migratedCount: number
  failedCount: number
  errors: Array<{
    creatorId: string
    creatorName: string
    error: string
  }>
}

/**
 * Run the personality profile migration
 */
export async function runPersonalityMigration(): Promise<MigrationResults> {
  const results: MigrationResults = {
    totalCreators: 0,
    migratedCount: 0,
    failedCount: 0,
    errors: [],
  }

  try {
    console.log('Starting personality profile migration...')

    const adminClient = supabaseAdmin()

    // Get all creators
    const { data: creators, error: fetchError } = await adminClient
      .from('creator_profile')
      .select('*')
      .order('created_at', { ascending: true })

    if (fetchError || !creators) {
      console.error('Error fetching creators:', fetchError)
      throw new Error(`Failed to fetch creators: ${fetchError?.message}`)
    }

    results.totalCreators = creators.length
    console.log(`Found ${creators.length} creators to migrate`)

    // Process each creator
    for (const creator of creators) {
      try {
        // Skip if already migrated
        if (creator.personality_profile) {
          console.log(`✓ Creator ${creator.display_name} already migrated`)
          continue
        }

        // Build personality profile from legacy data
        const profile = buildFromLegacyData(creator)

        // Save to database
        const { error: updateError } = await adminClient
          .from('creator_profile')
          .update({
            personality_profile: profile,
            updated_at: new Date().toISOString(),
          })
          .eq('id', creator.id)

        if (updateError) {
          throw updateError
        }

        results.migratedCount++
        console.log(
          `✓ Migrated ${creator.display_name} (${results.migratedCount}/${creators.length})`
        )
      } catch (error) {
        results.failedCount++
        const errorMsg = error instanceof Error ? error.message : String(error)
        results.errors.push({
          creatorId: creator.id,
          creatorName: creator.display_name,
          error: errorMsg,
        })
        console.error(
          `✗ Failed to migrate ${creator.display_name}:`,
          errorMsg
        )
      }
    }

    console.log('\n=== MIGRATION COMPLETE ===')
    console.log(`Total creators: ${results.totalCreators}`)
    console.log(`Successfully migrated: ${results.migratedCount}`)
    console.log(`Failed: ${results.failedCount}`)

    if (results.errors.length > 0) {
      console.log('\nErrors encountered:')
      results.errors.forEach((err) => {
        console.log(`  - ${err.creatorName} (${err.creatorId}): ${err.error}`)
      })
    }

    return results
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

/**
 * Helper function to check if creator already has personality_profile
 */
export async function hasPersonalityProfile(creatorId: string): Promise<boolean> {
  try {
    const adminClient = supabaseAdmin()
    const { data, error } = await adminClient
      .from('creator_profile')
      .select('personality_profile')
      .eq('id', creatorId)
      .single()

    if (error || !data) return false
    return !!data.personality_profile
  } catch {
    return false
  }
}

/**
 * Helper function to revert migration (set personality_profile to null)
 * Only do this if something goes wrong
 */
export async function revertMigration(): Promise<MigrationResults> {
  const results: MigrationResults = {
    totalCreators: 0,
    migratedCount: 0,
    failedCount: 0,
    errors: [],
  }

  try {
    console.log('Reverting personality profile migration...')

    const adminClient = supabaseAdmin()

    // Get all creators with personality_profile
    const { data: creators, error: fetchError } = await adminClient
      .from('creator_profile')
      .select('*')
      .not('personality_profile', 'is', null)

    if (fetchError || !creators) {
      throw new Error(`Failed to fetch creators: ${fetchError?.message}`)
    }

    results.totalCreators = creators.length

    // Revert each creator
    for (const creator of creators) {
      try {
        const { error: updateError } = await adminClient
          .from('creator_profile')
          .update({
            personality_profile: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', creator.id)

        if (updateError) throw updateError

        results.migratedCount++
        console.log(`✓ Reverted ${creator.display_name}`)
      } catch (error) {
        results.failedCount++
        const errorMsg = error instanceof Error ? error.message : String(error)
        results.errors.push({
          creatorId: creator.id,
          creatorName: creator.display_name,
          error: errorMsg,
        })
      }
    }

    console.log('Reversion complete')
    return results
  } catch (error) {
    console.error('Reversion failed:', error)
    throw error
  }
}
