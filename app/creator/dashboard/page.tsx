'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Breadcrumb from '@/components/Breadcrumb'

export default function CreatorDashboard() {
  const router = useRouter()
  const { user, loading: authLoading, signOut, isCreator } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user || !isCreator) {
        router.push('/auth/signin')
        return
      }

      const { data } = await supabase
        .from('creator_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!data?.voice_fingerprint) {
        // Not yet completed onboarding
        router.push('/creator/onboarding')
        return
      }

      setProfile(data)
      setLoading(false)
    }

    if (!authLoading) {
      loadProfile()
    }
  }, [user, authLoading, isCreator, router])

  const handleResetOnboarding = async () => {
    if (!user?.id) return

    const confirmed = confirm('This will reset your onboarding. You\'ll need to re-upload your WhatsApp chat. Continue?')
    if (!confirmed) return

    setResetting(true)
    try {
      const response = await fetch('/api/admin/reset-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to reset onboarding')
      }

      // Redirect to onboarding
      router.push('/creator/onboarding')
    } catch (error) {
      console.error('Reset error:', error)
      alert('Error resetting onboarding. Please try again.')
      setResetting(false)
    }
  }

  if (authLoading || loading) {
    return <div className="min-h-screen bg-dark-bg flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <nav className="bg-gray-900 p-6 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-2xl font-bold text-gold">Creator Dashboard</h1>
        <button
          onClick={signOut}
          className="bg-gray-800 px-4 py-2 rounded hover:bg-gray-700"
        >
          Logout
        </button>
      </nav>

      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/creator/dashboard' },
          { label: 'Home' },
        ]}
      />

      <div className="max-w-4xl mx-auto p-6">
        {/* Welcome Card */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-xl text-gold mb-4">Welcome, {profile?.display_name}</h2>
          <p className="text-gray-400 mb-4">Your profile is live ✓</p>

          <div className="space-y-2 text-gray-400 mb-6">
            <p>Profile ID: {profile?.id}</p>
            <p>Created: {new Date(profile?.created_at).toLocaleDateString()}</p>
            <p>Visitors: Coming soon</p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Profile Section */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-gold mb-4">👤 Profile</h3>
            <p className="text-gray-400 text-sm mb-4">View and edit your creator profile</p>
            <div className="flex gap-2">
              <a
                href="/creator/profile"
                className="flex-1 bg-gray-800 text-gray-300 px-3 py-2 rounded hover:bg-gray-700 text-center text-sm"
              >
                View Profile
              </a>
              <a
                href="/creator/settings"
                className="flex-1 bg-gold text-gray-900 px-3 py-2 rounded hover:bg-yellow-400 text-center text-sm font-semibold"
              >
                Edit Settings
              </a>
            </div>
          </div>

          {/* Conversations Section */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-gold mb-4">💬 Conversations</h3>
            <p className="text-gray-400 text-sm mb-4">View chat history and feedback</p>
            <a
              href="/creator/conversations"
              className="w-full bg-blue-900 text-blue-100 px-4 py-2 rounded hover:bg-blue-800 text-center font-semibold"
            >
              View Conversations
            </a>
          </div>

          {/* Analytics Section */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-gold mb-4">📊 Analytics</h3>
            <p className="text-gray-400 text-sm mb-4">Track engagement and performance</p>
            <a
              href="/creator/analytics"
              className="w-full bg-purple-900 text-purple-100 px-4 py-2 rounded hover:bg-purple-800 text-center font-semibold"
            >
              View Analytics
            </a>
          </div>

          {/* Voice Fingerprint Section */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-gold mb-4">🎤 Voice Fingerprint</h3>
            <p className="text-gray-400 text-sm mb-4">Re-upload your transcript</p>
            <button
              onClick={handleResetOnboarding}
              disabled={resetting}
              className="w-full bg-orange-900 text-orange-100 px-4 py-2 rounded hover:bg-orange-800 font-semibold disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : 'Re-upload'}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gray-800 bg-opacity-50 rounded p-4 text-sm text-gray-400">
          <p>💡 Use the sections above to manage your creator profile, view conversations, and track your performance metrics.</p>
        </div>
      </div>
    </div>
  )
}
