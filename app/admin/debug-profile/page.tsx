'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

export default function DebugProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading || !user) return

      try {
        console.log('Loading profile for user:', user.id)

        const { data, error: err } = await supabase
          .from('male_profile')
          .select('*')
          .eq('user_id', user.id)
          .single()

        console.log('Profile data:', data)
        console.log('Profile error:', err)

        if (err) throw err
        setProfileData(data)
      } catch (err) {
        console.error('Error loading profile:', err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, authLoading])

  if (authLoading) {
    return <div className="p-8 text-gray-400">Loading auth...</div>
  }

  if (!user) {
    return <div className="p-8 text-gray-400">Not logged in</div>
  }

  return (
    <div className="min-h-screen bg-dark-bg p-8">
      <h1 className="text-2xl font-bold text-gold mb-6">Debug: Your Visitor Profile</h1>

      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gold mb-4">Auth Info</h2>
        <div className="space-y-2 text-gray-300 font-mono text-sm">
          <div>User ID: {user.id}</div>
          <div>Email: {user.email}</div>
        </div>
      </div>

      {loading && <div className="text-gray-400">Loading profile...</div>}

      {error && (
        <div className="bg-red-900 text-red-100 p-4 rounded mb-6">
          Error: {error}
        </div>
      )}

      {profileData && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gold mb-4">Visitor Profile Data</h2>
          <pre className="bg-gray-800 p-4 rounded overflow-auto text-gray-300 text-sm">
            {JSON.stringify(profileData, null, 2)}
          </pre>

          <div className="mt-6 space-y-3">
            <h3 className="font-semibold text-gold">Key Fields:</h3>
            <div className="bg-gray-800 p-4 rounded space-y-2 text-sm">
              <div>
                <span className="text-gold">waitlist_email:</span>{' '}
                <span className="text-gray-300">
                  {profileData.waitlist_email || '(empty)'}
                </span>
              </div>
              <div>
                <span className="text-gold">credits_balance:</span>{' '}
                <span className="text-gray-300">{profileData.credits_balance}</span>
              </div>
              <div>
                <span className="text-gold">seen_out_of_credits_modal:</span>{' '}
                <span className="text-gray-300">
                  {profileData.seen_out_of_credits_modal ? 'true' : 'false'}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={async () => {
                  try {
                    await supabase
                      .from('male_profile')
                      .update({ seen_out_of_credits_modal: false })
                      .eq('user_id', user.id)

                    setProfileData({ ...profileData, seen_out_of_credits_modal: false })
                    alert('Reset! Waitlist modal will show again.')
                  } catch (err) {
                    alert(`Error: ${err instanceof Error ? err.message : String(err)}`)
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Reset Waitlist Modal Flag
              </button>
              <p className="text-gray-400 text-xs">
                Click this if you want to see the waitlist modal popup again
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
