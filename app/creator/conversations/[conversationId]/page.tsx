'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Breadcrumb from '@/components/Breadcrumb'
import BackButton from '@/components/BackButton'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  flagged?: boolean
}

interface Conversation {
  id: string
  creator_id: string
  man_id: string
  started_at: string
  message_count: number
  is_active: boolean
}

export default function ConversationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.conversationId as string
  const { user, loading: authLoading, isCreator } = useAuth()

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!user || !isCreator) {
        router.push('/auth/signin')
        return
      }

      try {
        setLoading(true)

        // Get conversation
        const { data: convData } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single()

        if (!convData) {
          router.push('/creator/conversations')
          return
        }

        // Verify creator owns this conversation
        const { data: profile } = await supabase
          .from('creator_profile')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (profile?.id !== convData.creator_id) {
          router.push('/creator/conversations')
          return
        }

        setConversation(convData)

        // Get messages
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        setMessages(messagesData || [])
      } catch (error) {
        console.error('Error loading conversation:', error)
        router.push('/creator/conversations')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadData()
    }
  }, [user, authLoading, isCreator, conversationId, router])

  const handleFlagMessage = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ flagged: true })
        .eq('id', messageId)

      setMessages(messages.map((m) => (m.id === messageId ? { ...m, flagged: true } : m)))
    } catch (error) {
      console.error('Error flagging message:', error)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!selectedMessage || !feedbackText.trim() || !conversation) return

    setSubmitting(true)
    try {
      const message = messages.find((m) => m.id === selectedMessage)
      if (!message) return

      // Save correction
      await supabase.from('twin_corrections').insert({
        creator_id: conversation.creator_id,
        original_message: message.content,
        correction: feedbackText,
        reason: 'User feedback from conversation review',
      })

      alert('Feedback saved! This helps improve the AI twin.')
      setFeedbackText('')
      setSelectedMessage(null)
    } catch (error) {
      console.error('Error saving feedback:', error)
      alert('Failed to save feedback')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gray-400">Loading conversation...</div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <div className="max-w-4xl mx-auto p-6 text-center text-gray-400">
          Conversation not found
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/creator/dashboard' },
          { label: 'Conversations', href: '/creator/conversations' },
          { label: 'Chat Review' },
        ]}
      />

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-2">Chat Review</h1>
            <p className="text-gray-400">Review and provide feedback on your AI twin's responses</p>
          </div>
          <BackButton href="/creator/conversations" label="← Conversations" />
        </div>

        {/* Conversation Info */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Started</p>
              <p className="text-gold font-semibold">
                {new Date(conversation.started_at).toLocaleDateString()} at{' '}
                {new Date(conversation.started_at).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Messages</p>
              <p className="text-gold font-semibold text-lg">{conversation.message_count}</p>
            </div>
            <div>
              <span
                className={`px-3 py-1 rounded text-sm ${
                  conversation.is_active
                    ? 'bg-green-900 text-green-100'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {conversation.is_active ? '🟢 Active' : '⚫ Completed'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Messages */}
          <div className="col-span-2 space-y-3 max-h-[600px] overflow-y-auto">
            {messages.map((message, idx) => (
              <div
                key={message.id}
                className={`rounded-lg p-4 cursor-pointer transition ${
                  message.role === 'user'
                    ? 'bg-blue-900 bg-opacity-30 border border-blue-800'
                    : 'bg-gray-800 border border-gray-700'
                } ${selectedMessage === message.id ? 'ring-2 ring-gold' : 'hover:border-gray-600'}`}
                onClick={() => setSelectedMessage(message.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      message.role === 'user'
                        ? 'bg-blue-800 text-blue-100'
                        : 'bg-gray-700 text-gray-200'
                    }`}
                  >
                    {message.role === 'user' ? '👤 Visitor' : '🤖 Your AI Twin'}
                  </span>
                  {message.flagged && <span className="text-red-400 text-sm">🚩 Flagged</span>}
                </div>

                <p className="text-gray-200 text-sm leading-relaxed">{message.content}</p>

                <div className="text-gray-500 text-xs mt-2 flex justify-between">
                  <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                  {message.role === 'assistant' && !message.flagged && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFlagMessage(message.id)
                      }}
                      className="text-gray-400 hover:text-red-400"
                    >
                      Flag as weird
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Feedback Form */}
          <div className="col-span-1">
            <div className="bg-gray-900 rounded-lg p-4 sticky top-6">
              <h3 className="text-gold font-semibold mb-4">📝 Leave Feedback</h3>

              {selectedMessage ? (
                <>
                  <div className="bg-gray-800 rounded p-3 mb-4">
                    <p className="text-gray-400 text-xs mb-2">Selected message:</p>
                    <p className="text-gray-200 text-sm">
                      {messages.find((m) => m.id === selectedMessage)?.content}
                    </p>
                  </div>

                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="What was weird about this response? How should it have been instead?"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold mb-4"
                    rows={5}
                  />

                  <button
                    onClick={handleSubmitFeedback}
                    disabled={submitting || !feedbackText.trim()}
                    className="w-full bg-gold text-gray-900 px-3 py-2 rounded font-semibold hover:bg-yellow-400 disabled:opacity-50 text-sm"
                  >
                    {submitting ? 'Saving...' : '✓ Save Feedback'}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMessage(null)
                      setFeedbackText('')
                    }}
                    className="w-full bg-gray-800 text-gray-300 px-3 py-2 rounded text-sm mt-2 hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <p className="text-gray-500 text-sm">
                  Click on an AI message to leave feedback about weird or incorrect responses.
                </p>
              )}

              <div className="mt-6 pt-4 border-t border-gray-800">
                <p className="text-gray-400 text-xs mb-2">💡 How it works:</p>
                <ul className="text-gray-500 text-xs space-y-1">
                  <li>✓ Click AI messages to review them</li>
                  <li>✓ Describe what was wrong</li>
                  <li>✓ We learn and improve</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
