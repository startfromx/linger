'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Breadcrumb from '@/components/Breadcrumb'
import BackButton from '@/components/BackButton'

interface VisitorProfile {
  id: string
  user_id: string
  display_name: string
  avatar_url?: string
  credits_balance: number
  created_at: string
}

export default function VisitorProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, isMan } = useAuth()
  const [profile, setProfile] = useState<VisitorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading) return

      if (!user || !isMan) {
        router.push('/auth/signin')
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('male_profile')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (fetchError) throw fetchError
        if (data) {
          setProfile(data)
          setEditName(data.display_name)
        }
      } catch (err) {
        console.error('Error loading profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, authLoading, isMan, router])

  const handleSaveName = async () => {
    if (!profile) return

    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('male_profile')
        .update({ display_name: editName })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, display_name: editName })
      setEditing(false)
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gray-400">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gray-400">Profile not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/discover' },
          { label: 'Profile' },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6">
        {error && (
          <div className="bg-red-900 text-red-100 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gold mb-2">My Profile</h1>
              <p className="text-gray-400 text-sm">Manage your Linger account</p>
            </div>
            <BackButton href="/discover" label="← Back" />
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            {/* Display Name */}
            <div className="border-b border-gray-800 pb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500"
                    placeholder="Enter your name"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="bg-gold text-gray-900 px-4 py-2 rounded font-semibold hover:bg-yellow-400 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditName(profile.display_name)
                    }}
                    className="bg-gray-800 text-gray-300 px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <p className="text-white text-lg">{profile.display_name}</p>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-gold hover:text-yellow-400 text-sm"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="border-b border-gray-800 pb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <p className="text-gray-400">{user?.email}</p>
              <p className="text-gray-500 text-xs mt-1">Cannot be changed</p>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-3 gap-4 border-b border-gray-800 pb-6">
              <div className="bg-gray-800 rounded p-4 text-center">
                <p className="text-2xl font-bold text-gold mb-1">0</p>
                <p className="text-gray-400 text-sm">Conversations</p>
              </div>
              <div className="bg-gray-800 rounded p-4 text-center">
                <p className="text-2xl font-bold text-gold mb-1">0</p>
                <p className="text-gray-400 text-sm">Messages Sent</p>
              </div>
              <div className="bg-gray-800 rounded p-4 text-center">
                <p className="text-2xl font-bold text-gold mb-1">{profile.credits_balance}</p>
                <p className="text-gray-400 text-sm">Credits</p>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-gray-800 rounded p-4 border border-gray-700 mb-6">
              <p className="text-gray-300 text-sm">
                <span className="text-gray-400">Joined: </span>
                <span className="text-white">
                  {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-gray-800">
              <button className="w-full bg-gray-800 text-gray-300 px-4 py-3 rounded hover:bg-gray-700 text-sm font-medium">
                📥 Download My Data
              </button>
              <button className="w-full bg-red-900 text-red-100 px-4 py-3 rounded hover:bg-red-800 text-sm font-medium">
                🗑️ Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-gray-800 bg-opacity-50 rounded p-4 text-sm text-gray-400">
          <p>💡 Need help? Check out our <a href="#" className="text-gold hover:underline">Help Center</a></p>
        </div>
      </div>
    </div>
  )
}
