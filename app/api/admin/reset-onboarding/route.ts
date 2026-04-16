import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    // Get the user from the request (in a real app, verify the session)
    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    console.log('Resetting onboarding for user:', userId)

    // Clear voice_fingerprint for this user's creator profile
    const { data, error } = await supabase
      .from('creator_profile')
      .update({
        voice_fingerprint: null,
      })
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Error resetting onboarding:', error)
      throw error
    }

    console.log('Onboarding reset successfully:', data)

    return NextResponse.json({
      success: true,
      message: 'Onboarding reset. Redirecting to onboarding...',
      data,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Reset onboarding error:', errorMsg)
    return NextResponse.json(
      { error: `Failed to reset onboarding: ${errorMsg}` },
      { status: 500 }
    )
  }
}
