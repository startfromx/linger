'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from URL hash
        const { data, error: authError } = await supabase.auth.getSession()

        if (authError) throw authError
        if (!data.session?.user) {
          throw new Error('No session found')
        }

        const user = data.session.user
        console.log('Auth callback - User:', user.email)

        // Check if they have a creator profile
        const { data: creatorProfile } = await supabase
          .from('creator_profile')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (creatorProfile) {
          // Already a creator
          console.log('User is a creator, redirecting to dashboard')
          router.push('/creator/dashboard')
          return
        }

        // Check if they have a visitor profile
        const { data: visitorProfile } = await supabase
          .from('male_profile')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (visitorProfile) {
          // Already a visitor
          console.log('User is a visitor, redirecting to discover')
          router.push('/discover')
          return
        }

        // New user - create visitor profile by default
        // They can upgrade to creator through onboarding later
        console.log('New user - creating visitor profile for user_id:', user.id)
        const { data: insertData, error: insertError } = await supabase.from('male_profile').insert({
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'Visitor',
          credits_balance: 100,
        }).select()

        console.log('Insert response - data:', insertData, 'error:', insertError)

        if (insertError) {
          console.error('Insert error:', insertError)
          throw new Error(`Failed to create visitor profile: ${insertError.message}`)
        }

        console.log('Visitor profile created successfully, redirecting to discover')
        router.push('/discover')
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('Authentication failed. Please try again.')
        setTimeout(() => router.push('/auth/signin'), 2000)
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        {loading && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-400">Signing you in...</p>
          </>
        )}
        {error && (
          <>
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-gray-500 text-sm">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  )
}
