import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Create Supabase client with service role key (has admin privileges)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Execute the RLS policy creation SQL
    const sql = `CREATE POLICY "authenticated_insert_creator" ON creator_profile
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');`;

    // Use Supabase's RPC to execute arbitrary SQL
    let error = null;
    try {
      const result = await supabase.rpc('execute_sql', {
        query: sql,
      });
      error = result.error;
    } catch (err) {
      // If the standard rpc fails, log and continue
      console.log('RPC execute_sql not available:', err);
      error = { message: 'RPC execute_sql failed' };
    }

    if (error) {
      // Policy might already exist - that's fine
      if (error.message?.includes('already exists')) {
        return NextResponse.json({
          message: 'Policy already exists',
          success: true,
          status: 'already_exists'
        });
      }
      console.error('Policy creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'RLS policy created successfully',
      status: 'created'
    });
  } catch (error) {
    console.error('Migration error:', error);

    // Check if this is an "already exists" error
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg?.includes('already exists')) {
      return NextResponse.json({
        success: true,
        message: 'Policy already exists',
        status: 'already_exists'
      });
    }

    return NextResponse.json(
      { error: 'Failed to apply migration', details: errorMsg },
      { status: 500 }
    );
  }
}
