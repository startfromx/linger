'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export default function SignIn() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If already logged in, redirect based on their profile
    if (user && !authLoading) {
      if (user.role === 'creator') {
        router.push('/creator/dashboard')
      } else {
        router.push('/discover')
      }
    }
  }, [user, authLoading, router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error) {
      console.error('Google sign in error:', error)
      alert('Error signing in with Google')
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-gold mb-2 text-center">Linger</h1>
        <p className="text-gray-400 text-center mb-8">Intimate conversations, powered by AI</p>

        <div className="bg-gray-900 rounded-lg p-8 space-y-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-dark-bg py-3 px-4 rounded font-semibold hover:bg-gray-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <text x="0" y="20" fontSize="20" fill="currentColor">
                G
              </text>
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div className="bg-blue-900 bg-opacity-20 border border-blue-800 rounded p-4">
            <p className="text-blue-100 text-sm">
              💡 First time? You'll choose your role (Creator or Visitor) during setup.
            </p>
          </div>
        </div>

        <p className="text-gray-500 text-sm text-center mt-6">
          Sign in securely with your Google account
        </p>
      </div>
    </div>
  )
}
