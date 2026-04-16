import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Setup endpoint to create a visitor profile for the current user
 * This allows testing the chat functionality
 * POST /api/setup/create-visitor
 */

export async function POST(req: NextRequest) {
  try {
    const adminClient = supabaseAdmin()

    // Get all users from auth.users (to find the test user)
    const { data: allUsers, error: usersError } = await adminClient.auth.admin.listUsers()

    if (usersError || !allUsers?.users) {
      console.error('Error listing users:', usersError)
      return NextResponse.json(
        { error: `Failed to list users: ${usersError?.message}` },
        { status: 500 }
      )
    }

    // Find lum@startfromx.com user
    const user = allUsers.users.find((u) => u.email === 'lum@startfromx.com')

    if (!user) {
      return NextResponse.json(
        { error: 'User lum@startfromx.com not found' },
        { status: 404 }
      )
    }

    console.log('Found user:', user.id, user.email)

    // Create male_profile for the user
    const { data, error } = await adminClient
      .from('male_profile')
      .upsert({
        user_id: user.id,
        display_name: 'Test Visitor',
        credits_balance: 1000,
        is_beta: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating visitor profile:', error)
      return NextResponse.json(
        { error: `Failed to create visitor profile: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Visitor profile created:', data)

    return NextResponse.json({
      success: true,
      profile: data,
      message: 'Visitor profile created successfully. Refresh the page and try chatting with a creator!',
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Setup error:', errorMsg)
    return NextResponse.json(
      { error: `Failed: ${errorMsg}` },
      { status: 500 }
    )
  }
}
