'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Breadcrumb from '@/components/Breadcrumb'

interface CreatorProfile {
  id: string
  display_name: string
  age?: number
  city?: string
  bio?: string
  profile_photo_url?: string
  interests: string[]
  personality_tags?: string[]
  created_at: string
  personality_profile?: {
    profession?: string[]
    location?: string
    country?: string
    gender?: string
  }
  creator_settings?: {
    profession?: string[]
    gender?: string
  }
}

type SortType = 'newest' | 'name' | 'random'

export default function Discover() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [creators, setCreators] = useState<CreatorProfile[]>([])
  const [filteredCreators, setFilteredCreators] = useState<CreatorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortType, setSortType] = useState<SortType>('newest')
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)

  useEffect(() => {
    const loadCreators = async () => {
      if (authLoading) return

      try {
        // Load all creators (allow unauthenticated browsing)
        const { data: creatorsList, error } = await supabase
          .from('creator_profile')
          .select('*')
          .not('voice_fingerprint', 'is', null) // Only show creators who completed onboarding
          .order('created_at', { ascending: false })

        if (!error && creatorsList) {
          setCreators(creatorsList)
          setFilteredCreators(creatorsList)
        }
      } catch (err) {
        console.error('Error loading discover page:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCreators()
  }, [authLoading])

  // Filter and sort creators
  useEffect(() => {
    let results = [...creators]

    // Search filter
    if (searchTerm) {
      results = results.filter((creator) =>
        creator.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.interests?.some((i) => i.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Interest filter
    if (selectedInterest) {
      results = results.filter((creator) =>
        creator.interests?.includes(selectedInterest)
      )
    }

    // Sort
    if (sortType === 'name') {
      results.sort((a, b) => a.display_name.localeCompare(b.display_name))
    } else if (sortType === 'random') {
      results.sort(() => Math.random() - 0.5)
    }
    // 'newest' is default (already sorted by created_at)

    setFilteredCreators(results)
  }, [creators, searchTerm, sortType, selectedInterest])

  // Get all unique interests
  const allInterests = Array.from(
    new Set(creators.flatMap((c) => c.interests || []))
  ).sort().slice(0, 8)

  const handleStartChat = (creatorId: string) => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    router.push(`/chat/${creatorId}`)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gray-400">Loading creators...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Home', href: '/discover' }]} />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gold mb-2">Discover</h1>
          <p className="text-gray-400">Meet AI twins and start meaningful conversations</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, interests, or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold"
          />
        </div>

        {/* Filters & Sort */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Interest Filter */}
          {allInterests.length > 0 && (
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-2">Filter by Interest</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedInterest(null)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedInterest === null
                      ? 'bg-gold text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {allInterests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => setSelectedInterest(interest)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      selectedInterest === interest
                        ? 'bg-gold text-gray-900'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort */}
          <div>
            <p className="text-sm text-gray-400 mb-2">Sort by</p>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-gold"
            >
              <option value="newest">Newest</option>
              <option value="name">Name (A-Z)</option>
              <option value="random">Random</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-400 text-sm">
            {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Creator Grid */}
        {filteredCreators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredCreators.map((creator) => (
              <div
                key={creator.id}
                className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-gold transition flex flex-col"
              >
                {/* Creator Image */}
                <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                  {creator.profile_photo_url ? (
                    <img
                      src={creator.profile_photo_url}
                      alt={creator.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gold bg-opacity-10">
                      <span className="text-6xl font-bold text-gold opacity-50">
                        {creator.display_name[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Creator Info */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* Name & Age/Location */}
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {creator.display_name}
                    </h3>

                    {/* Profession */}
                    {(creator.personality_profile?.profession && creator.personality_profile.profession.length > 0) ||
                    (creator.creator_settings?.profession && creator.creator_settings.profession.length > 0) ? (
                      <p className="text-gold text-sm font-semibold mb-1">
                        💼 {(creator.personality_profile?.profession || creator.creator_settings?.profession || []).slice(0, 2).join(' / ')}
                      </p>
                    ) : null}

                    {/* Age & Location */}
                    <div className="flex flex-wrap gap-2 text-gray-400 text-sm">
                      {creator.age && <span>{creator.age}</span>}
                      {creator.personality_profile?.country && (
                        <span>🌍 {creator.personality_profile.country}</span>
                      )}
                      {creator.personality_profile?.location && (
                        <span>📍 {creator.personality_profile.location}</span>
                      )}
                      {!creator.personality_profile?.location && creator.city && (
                        <span>📍 {creator.city}</span>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {creator.bio && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {creator.bio}
                    </p>
                  )}

                  {/* Interests */}
                  {creator.interests && creator.interests.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {creator.interests.slice(0, 3).map((interest, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs"
                          >
                            {interest}
                          </span>
                        ))}
                        {creator.interests.length > 3 && (
                          <span className="text-gray-500 text-xs px-2 py-1">
                            +{creator.interests.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Personality Tags */}
                  {creator.personality_tags && creator.personality_tags.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {creator.personality_tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-gold bg-opacity-20 text-gold px-2 py-1 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1"></div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleStartChat(creator.id)}
                    className="w-full bg-gold text-gray-900 px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition mt-4"
                  >
                    💬 Start Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-800 bg-opacity-50 rounded-lg mb-8">
            <p className="text-gray-400 mb-2">No creators found</p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedInterest(null)
                }}
                className="text-gold hover:underline text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gray-800 bg-opacity-50 rounded p-4 text-sm text-gray-400">
          <p>💡 Each AI twin has a unique personality. Start a conversation to explore! Sign in to save your chats.</p>
        </div>
      </div>
    </div>
  )
}
