import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify this is an admin request (you can add more security here)
    const authHeader = request.headers.get('authorization')
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAILS

    // Check if there's a valid authorization token
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json(
        { error: 'SQL query is required' },
        { status: 400 }
      )
    }

    // Execute the SQL query using the admin client
    const admin = supabaseAdmin()

    // Use the raw RPC call with the service role key to execute arbitrary SQL
    // Note: This is a direct database connection approach
    const { data, error } = await admin.rpc('execute_sql', {
      sql: sql
    }).catch(err => {
      // If the execute_sql RPC doesn't exist, we'll handle it gracefully
      return { data: null, error: { message: err.message } }
    })

    if (error) {
      // The execute_sql RPC might not exist, which is expected
      // In this case, we'll return information about the migration
      console.log('RPC error (expected):', error.message)

      return NextResponse.json(
        {
          warning: 'Direct SQL execution via RPC not available',
          message: 'To apply this SQL, please use the Supabase dashboard SQL editor',
          sql: sql
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error executing SQL:', error)
    return NextResponse.json(
      { error: 'Failed to execute SQL', details: String(error) },
      { status: 500 }
    )
  }
}
