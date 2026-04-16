'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Breadcrumb from '@/components/Breadcrumb'
import BackButton from '@/components/BackButton'

interface CreatorProfile {
  id: string
  user_id: string
  display_name: string
  age?: number
  city?: string
  bio?: string
  interests: string[]
  personality_tags?: string[]
  profile_photo_url?: string
  gallery_urls: string[]
  created_at: string
}

export default function CreatorProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, isCreator } = useAuth()
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading) return

      if (!user || !isCreator) {
        router.push('/auth/signin')
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('creator_profile')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (fetchError) throw fetchError
        if (data) {
          setProfile(data)
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, authLoading, isCreator, router])

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
          { label: 'Dashboard', href: '/creator/dashboard' },
          { label: 'Profile Preview' },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-2">Your Profile</h1>
            <p className="text-gray-400">This is how visitors see you</p>
          </div>
          <BackButton href="/creator/dashboard" label="← Dashboard" />
        </div>

        {/* Profile Preview Card */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          {/* Header Row */}
          <div className="flex gap-4 mb-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={profile.display_name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gold bg-opacity-20 flex items-center justify-center text-gold text-3xl font-bold">
                  {profile.display_name[0]}
                </div>
              )}
            </div>

            {/* Name & Stats */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{profile.display_name}</h2>
              <div className="flex gap-3 text-gray-400 text-sm mb-3">
                {profile.age && <span>{profile.age}F</span>}
                {profile.city && <span>📍 {profile.city}</span>}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800 rounded p-3 text-center">
                  <p className="text-gold font-bold text-lg">0</p>
                  <p className="text-gray-400 text-xs">Conversations</p>
                </div>
                <div className="bg-gray-800 rounded p-3 text-center">
                  <p className="text-gold font-bold text-lg">0</p>
                  <p className="text-gray-400 text-xs">Messages Received</p>
                </div>
                <div className="bg-gray-800 rounded p-3 text-center">
                  <p className="text-gold font-bold text-lg">0</p>
                  <p className="text-gray-400 text-xs">Avg Response</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          {profile.bio && (
            <div className="mb-6 pb-6 border-b border-gray-800">
              <p className="text-gray-300">{profile.bio}</p>
            </div>
          )}

          {/* Interests Section */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mb-6 pb-6 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Personality Tags Section */}
          {profile.personality_tags && profile.personality_tags.length > 0 && (
            <div className="mb-6 pb-6 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Personality</h3>
              <div className="flex flex-wrap gap-2">
                {profile.personality_tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-gold bg-opacity-20 text-gold px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Section */}
          {profile.gallery_urls && profile.gallery_urls.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Gallery</h3>
              <div className="grid grid-cols-3 gap-3">
                {profile.gallery_urls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Gallery ${idx}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <a
            href="/creator/settings"
            className="bg-gold text-gray-900 px-4 py-3 rounded font-semibold hover:bg-yellow-400 text-center"
          >
            ✏️ Edit Profile
          </a>
          <a
            href="/creator/dashboard"
            className="bg-gray-800 text-gray-300 px-4 py-3 rounded font-semibold hover:bg-gray-700 text-center"
          >
            ← Back to Dashboard
          </a>
        </div>

        {/* Info Section */}
        <div className="bg-gray-800 bg-opacity-50 rounded p-4 text-sm text-gray-400 mt-6">
          <p>💡 This is a preview of how visitors see your profile. To edit, click "Edit Profile".</p>
        </div>
      </div>
    </div>
  )
}
