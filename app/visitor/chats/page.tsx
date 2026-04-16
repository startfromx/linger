'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Breadcrumb from '@/components/Breadcrumb'
import BackButton from '@/components/BackButton'

interface Conversation {
  id: string
  creator_id: string
  message_count: number
  started_at: string
  last_message_at: string
  is_active: boolean
  creator?: {
    id: string
    display_name: string
    profile_photo_url?: string
    age?: number
    city?: string
  }
}

type FilterType = 'all' | 'active' | 'completed' | 'favorites'

export default function VisitorChatsPage() {
  const router = useRouter()
  const { user, loading: authLoading, isMan } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadChats = async () => {
      if (authLoading) return

      if (!user || !isMan) {
        router.push('/auth/signin')
        return
      }

      try {
        // Get visitor profile first
        const { data: visitorProfile } = await supabase
          .from('male_profile')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!visitorProfile) return

        // Get conversations for this visitor
        const { data: conversationsData, error } = await supabase
          .from('conversations')
          .select(
            `
            id,
            creator_id,
            message_count,
            started_at,
            last_message_at,
            is_active,
            creator_profile (
              id,
              display_name,
              profile_photo_url,
              age,
              city
            )
          `
          )
          .eq('man_id', visitorProfile.id)
          .order('last_message_at', { ascending: false })

        if (error) throw error

        // Flatten the creator data
        const formattedConversations = (conversationsData || []).map((conv: any) => ({
          id: conv.id,
          creator_id: conv.creator_id,
          message_count: conv.message_count,
          started_at: conv.started_at,
          last_message_at: conv.last_message_at,
          is_active: conv.is_active,
          creator: Array.isArray(conv.creator_profile)
            ? conv.creator_profile[0]
            : conv.creator_profile,
        }))

        setConversations(formattedConversations)
      } catch (err) {
        console.error('Error loading chats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadChats()
  }, [user, authLoading, isMan, router])

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // Filter by active status
    if (filter === 'active' && !conv.is_active) return false
    if (filter === 'completed' && conv.is_active) return false

    // Filter by search term
    if (searchTerm && !conv.creator?.display_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    return true
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gray-400">Loading chats...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/discover' },
          { label: 'Chat History' },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-2">Chat History</h1>
            <p className="text-gray-400">All your conversations with Linger twins</p>
          </div>
          <BackButton href="/discover" label="← Discover" />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by creator name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4">
          {(['all', 'active', 'completed', 'favorites'] as FilterType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                filter === tab
                  ? 'bg-gold text-gray-900'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab === 'all'
                ? `All (${conversations.length})`
                : tab === 'active'
                  ? `Active (${conversations.filter((c) => c.is_active).length})`
                  : tab === 'completed'
                    ? `Completed (${conversations.filter((c) => !c.is_active).length})`
                    : '★ Favorites (0)'}
            </button>
          ))}
        </div>

        {/* Conversations List */}
        {filteredConversations.length > 0 ? (
          <div className="space-y-4">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.creator_id}`}
                className="block bg-gray-900 rounded-lg p-4 hover:border-gold transition border border-gray-800 hover:bg-gray-800"
              >
                <div className="flex items-start gap-4">
                  {/* Creator Avatar */}
                  <div className="flex-shrink-0">
                    {conv.creator?.profile_photo_url ? (
                      <img
                        src={conv.creator.profile_photo_url}
                        alt={conv.creator.display_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gold bg-opacity-20 flex items-center justify-center text-gold font-bold">
                        {conv.creator?.display_name[0]}
                      </div>
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {conv.creator?.display_name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          conv.is_active
                            ? 'bg-green-900 text-green-100'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {conv.is_active ? 'Active' : 'Completed'}
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm mb-2 truncate">
                      {conv.creator?.age && `${conv.creator.age}`}
                      {conv.creator?.age && conv.creator?.city && ' • '}
                      {conv.creator?.city}
                    </p>

                    <div className="flex items-center justify-between">
                      <p className="text-gray-500 text-sm">
                        {conv.message_count} messages
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(conv.last_message_at || conv.started_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800 bg-opacity-50 rounded-lg">
            <p className="text-gray-400 mb-4">
              {searchTerm ? 'No chats found matching your search' : 'No conversations yet'}
            </p>
            <Link
              href="/discover"
              className="inline-block bg-gold text-gray-900 px-6 py-2 rounded font-semibold hover:bg-yellow-400"
            >
              Start a Conversation
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
