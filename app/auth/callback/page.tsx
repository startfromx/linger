import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string }
}) {
  // Create server client with cookie handling
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle cookie setting errors silently
          }
        },
      },
    }
  )

  // Handle OAuth errors
  if (searchParams.error) {
    console.error('OAuth error:', searchParams.error)
    redirect('/auth/signin')
  }

  // Exchange code for session
  if (searchParams.code) {
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
        searchParams.code
      )

      if (exchangeError) {
        console.error('Session exchange failed:', exchangeError)
        redirect('/auth/signin')
      }

      // Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('Failed to get user:', userError)
        redirect('/auth/signin')
      }

      console.log('User authenticated:', user.email)

      // Check if creator or visitor
      const { data: creatorProfile } = await supabase
        .from('creator_profile')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (creatorProfile) {
        redirect('/creator/dashboard')
      }

      const { data: visitorProfile } = await supabase
        .from('male_profile')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (visitorProfile) {
        redirect('/discover')
      }

      // Create visitor profile for new user
      await supabase.from('male_profile').insert({
        user_id: user.id,
        display_name: user.email?.split('@')[0] || 'Visitor',
        credits_balance: 100,
      })

      redirect('/discover')
    } catch (error) {
      console.error('Auth callback error:', error)
      redirect('/auth/signin')
    }
  }

  redirect('/auth/signin')
}
