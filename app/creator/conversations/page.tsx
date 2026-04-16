'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Breadcrumb from '@/components/Breadcrumb'

interface Conversation {
  id: string
  man_id: string
  started_at: string
  last_message_at: string
  message_count: number
  credits_spent: number
  is_active: boolean
}

export default function ConversationsPage() {
  const router = useRouter()
  const { user, loading: authLoading, isCreator } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    const loadData = async () => {
      if (!user || !isCreator) {
        router.push('/auth/signin')
        return
      }

      try {
        setLoading(true)

        // Get creator profile
        const { data: profileData } = await supabase
          .from('creator_profile')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (!profileData?.voice_fingerprint) {
          router.push('/creator/onboarding')
          return
        }

        setProfile(profileData)

        // Get conversations for this creator
        const { data: conversationsData } = await supabase
          .from('conversations')
          .select('*')
          .eq('creator_id', profileData.id)
          .order('last_message_at', { ascending: false })

        setConversations(conversationsData || [])
      } catch (error) {
        console.error('Error loading conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadData()
    }
  }, [user, authLoading, isCreator, router])

  const filteredConversations = conversations.filter((conv) => {
    if (filter === 'active') return conv.is_active
    if (filter === 'completed') return !conv.is_active
    return true
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gray-400">Loading conversations...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <nav className="bg-gray-900 p-6 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-2xl font-bold text-gold">Chat History & Feedback</h1>
        <Link href="/creator/dashboard" className="text-gray-400 hover:text-white">
          ← Dashboard
        </Link>
      </nav>

      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/creator/dashboard' },
          { label: 'Conversations' },
        ]}
      />

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl text-gold mb-4">Your Character</h2>
          <p className="text-gray-300 text-lg font-semibold">{profile?.display_name}</p>
          <p className="text-gray-400 text-sm mt-1">
            Total conversations: <span className="text-gold">{conversations.length}</span>
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all' ? 'bg-gold text-gray-900 font-semibold' : 'bg-gray-800 text-gray-300'
            }`}
          >
            All ({conversations.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded ${
              filter === 'active'
                ? 'bg-gold text-gray-900 font-semibold'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            Active ({conversations.filter((c) => c.is_active).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded ${
              filter === 'completed'
                ? 'bg-gold text-gray-900 font-semibold'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            Completed ({conversations.filter((c) => !c.is_active).length})
          </button>
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <p className="text-gray-400">
              {filter === 'all' && 'No conversations yet'}
              {filter === 'active' && 'No active conversations'}
              {filter === 'completed' && 'No completed conversations'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/creator/conversations/${conv.id}`}
                className="block bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gold font-semibold">Conversation</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          conv.is_active
                            ? 'bg-green-900 text-green-100'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {conv.is_active ? '🟢 Active' : '⚫ Completed'}
                      </span>
                    </div>

                    <div className="text-gray-400 text-sm space-y-1">
                      <p>
                        📅 Started:{' '}
                        {new Date(conv.started_at).toLocaleDateString()}{' '}
                        {new Date(conv.started_at).toLocaleTimeString()}
                      </p>
                      {conv.last_message_at && (
                        <p>
                          💬 Last message:{' '}
                          {new Date(conv.last_message_at).toLocaleDateString()}
                        </p>
                      )}
                      <p>📊 Messages: {conv.message_count}</p>
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-400">
                    <p className="text-gold font-semibold text-lg">{conv.message_count}</p>
                    <p>messages</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
