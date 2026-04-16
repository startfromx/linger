'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Breadcrumb from '@/components/Breadcrumb'
import BackButton from '@/components/BackButton'

interface ConversationStats {
  total_conversations: number
  active_conversations: number
  completed_conversations: number
  total_messages: number
  total_credits_earned: number
}

export default function CreatorAnalyticsPage() {
  const router = useRouter()
  const { user, loading: authLoading, isCreator } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<ConversationStats>({
    total_conversations: 0,
    active_conversations: 0,
    completed_conversations: 0,
    total_messages: 0,
    total_credits_earned: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      if (authLoading) return

      if (!user || !isCreator) {
        router.push('/auth/signin')
        return
      }

      try {
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

        // Get conversations data
        const { data: conversationsData } = await supabase
          .from('conversations')
          .select('*')
          .eq('creator_id', profileData.id)

        if (conversationsData) {
          const totalConversations = conversationsData.length
          const activeConversations = conversationsData.filter((c) => c.is_active).length
          const completedConversations = totalConversations - activeConversations
          const totalMessages = conversationsData.reduce((sum, c) => sum + (c.message_count || 0), 0)
          const totalCreditsEarned = conversationsData.reduce((sum, c) => sum + (c.credits_earned || 0), 0)

          setStats({
            total_conversations: totalConversations,
            active_conversations: activeConversations,
            completed_conversations: completedConversations,
            total_messages: totalMessages,
            total_credits_earned: totalCreditsEarned,
          })
        }
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [user, authLoading, isCreator, router])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gray-400">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/creator/dashboard' },
          { label: 'Analytics' },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-2">Analytics</h1>
            <p className="text-gray-400">Your conversation and engagement metrics</p>
          </div>
          <BackButton href="/creator/dashboard" label="← Dashboard" />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Total Conversations */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Conversations</p>
                <p className="text-4xl font-bold text-gold">{stats.total_conversations}</p>
              </div>
              <div className="text-4xl">💬</div>
            </div>
          </div>

          {/* Active Conversations */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Active Conversations</p>
                <p className="text-4xl font-bold text-green-400">{stats.active_conversations}</p>
              </div>
              <div className="text-4xl">🟢</div>
            </div>
          </div>

          {/* Completed Conversations */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Completed Conversations</p>
                <p className="text-4xl font-bold text-gray-400">{stats.completed_conversations}</p>
              </div>
              <div className="text-4xl">⚫</div>
            </div>
          </div>

          {/* Total Messages */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Messages Received</p>
                <p className="text-4xl font-bold text-blue-400">{stats.total_messages}</p>
              </div>
              <div className="text-4xl">📨</div>
            </div>
          </div>

          {/* Credits Earned */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Credits Earned</p>
                <p className="text-4xl font-bold text-yellow-400">{stats.total_credits_earned}</p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>
        </div>

        {/* Engagement Section */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-xl font-semibold text-gold mb-4">Engagement Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded p-4 text-center">
              <p className="text-2xl font-bold text-white mb-1">
                {stats.total_conversations > 0
                  ? (stats.total_messages / stats.total_conversations).toFixed(1)
                  : 0}
              </p>
              <p className="text-gray-400 text-xs">Avg Messages per Conversation</p>
            </div>
            <div className="bg-gray-800 rounded p-4 text-center">
              <p className="text-2xl font-bold text-white mb-1">
                {stats.total_conversations > 0
                  ? ((stats.active_conversations / stats.total_conversations) * 100).toFixed(0)
                  : 0}
                %
              </p>
              <p className="text-gray-400 text-xs">Active Conversation Rate</p>
            </div>
            <div className="bg-gray-800 rounded p-4 text-center">
              <p className="text-2xl font-bold text-white mb-1">
                {stats.total_messages > 0 && stats.total_conversations > 0
                  ? (stats.total_credits_earned / stats.total_conversations).toFixed(1)
                  : 0}
              </p>
              <p className="text-gray-400 text-xs">Avg Credits per Chat</p>
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-xl font-semibold text-gold mb-4">Tips to Improve Engagement</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex gap-3">
              <span className="text-gold">✓</span>
              <p>Keep your responses natural and personalized - avoid generic replies</p>
            </div>
            <div className="flex gap-3">
              <span className="text-gold">✓</span>
              <p>Ask follow-up questions to keep conversations flowing</p>
            </div>
            <div className="flex gap-3">
              <span className="text-gold">✓</span>
              <p>Use your unique voice fingerprint to stand out from other creators</p>
            </div>
            <div className="flex gap-3">
              <span className="text-gold">✓</span>
              <p>Respond consistently to maintain active conversations</p>
            </div>
            <div className="flex gap-3">
              <span className="text-gold">✓</span>
              <p>Update your profile interests to attract visitors you connect with</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <a
            href="/creator/conversations"
            className="bg-blue-900 text-blue-100 px-4 py-3 rounded font-semibold hover:bg-blue-800 text-center"
          >
            📝 View All Conversations
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
          <p>💡 Analytics update in real-time as visitors engage with you. Check back regularly to track your progress!</p>
        </div>
      </div>
    </div>
  )
}
