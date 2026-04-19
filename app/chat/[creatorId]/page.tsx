'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Breadcrumb from '@/components/Breadcrumb'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatInput from '@/components/chat/ChatInput'

interface CreatorProfile {
  id: string
  display_name: string
  voice_fingerprint: any
  personality_tags: string[]
  personality_profile?: any
  creator_settings?: any
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const creatorId = params.creatorId as string

  const { user, loading: authLoading, isMan } = useAuth()
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [showWaitlist, setShowWaitlist] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [hasSeenOutOfCreditsModal, setHasSeenOutOfCreditsModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Show waitlist modal when credits hit 0 (only once per session)
  useEffect(() => {
    console.log('Modal effect: credits=', credits, 'hasSeenOutOfCreditsModal=', hasSeenOutOfCreditsModal, 'showWaitlist=', showWaitlist)
    if (credits === 0 && !hasSeenOutOfCreditsModal) {
      console.log('Triggering waitlist modal!')
      setShowWaitlist(true)
      setHasSeenOutOfCreditsModal(true)
    }
  }, [credits, hasSeenOutOfCreditsModal])

  // Load creator profile and conversation history
  useEffect(() => {
    const loadChatData = async () => {
      if (authLoading || !user) {
        router.push('/auth/signin')
        return
      }

      // Allow access if user is a visitor (man) OR if they have a visitor profile
      // This allows creators to also test chat with their visitor profile

      try {
        console.log('Loading chat for creator:', creatorId, 'user:', user.id)

        // Get creator profile
        const { data: creatorData, error: creatorError } = await supabase
          .from('creator_profile')
          .select('*')
          .eq('id', creatorId)
          .single()

        console.log('Creator data:', creatorData, 'error:', creatorError)

        if (creatorError || !creatorData) {
          throw new Error(`Creator not found: ${creatorError?.message}`)
        }

        console.log('Chat: Creator data retrieved:', {
          id: creatorData.id,
          display_name: creatorData.display_name,
          has_voice_fingerprint: !!creatorData.voice_fingerprint,
          voice_fingerprint_keys: creatorData.voice_fingerprint ? Object.keys(creatorData.voice_fingerprint) : null,
        })

        setCreator(creatorData)

        // Get visitor's profile with credits and waitlist status
        const { data: visitorProfile, error: visitorError } = await supabase
          .from('male_profile')
          .select('id, credits_balance, seen_out_of_credits_modal')
          .eq('user_id', user.id)
          .single()

        if (visitorError || !visitorProfile) {
          throw new Error('Visitor profile not found')
        }

        // Set visitor credits and waitlist status
        setCredits(visitorProfile.credits_balance || 0)
        setHasSeenOutOfCreditsModal(visitorProfile.seen_out_of_credits_modal || false)

        // Get or create conversation
        const { data: conversationsData, error: convQueryError } = await supabase
          .from('conversations')
          .select('*')
          .eq('creator_id', creatorId)
          .eq('man_id', visitorProfile.id)
          .limit(1)

        const conversationData = conversationsData?.[0] || null // Get first result or null

        if (convQueryError) {
          console.error('Error querying conversation:', convQueryError?.message || convQueryError)
          console.error('Full error:', JSON.stringify(convQueryError))
        }

        console.log('Chat: Looking for conversation with creator_id:', creatorId, 'man_id:', visitorProfile.id)
        console.log('Chat: Existing conversation found:', conversationData)

        let convId: string

        if (conversationData?.id) {
          convId = conversationData.id
          console.log('Chat: Loading history for conversation:', convId)
          // Load message history
          const { data: messagesData, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true })

          if (messagesError) {
            console.error('Error loading messages:', messagesError)
          }
          console.log('Chat: Loaded', messagesData?.length || 0, 'messages')
          setMessages(messagesData || [])
        } else {
          // Create new conversation
          console.log('Creating new conversation with creator_id:', creatorId, 'man_id:', user.id)

          const { data: newConversation, error: convError } = await supabase
            .from('conversations')
            .insert({
              creator_id: creatorId,
              man_id: visitorProfile.id,
            })
            .select()
            .single()

          console.log('New conversation:', newConversation, 'error:', convError)

          if (convError) {
            throw new Error(`Failed to create conversation: ${convError.message}`)
          }

          if (!newConversation) {
            throw new Error('No conversation returned from insert')
          }

          convId = newConversation.id
        }

        setConversationId(convId)
      } catch (error) {
        console.error('Error loading chat:', error)
        const errorMsg = error instanceof Error ? error.message : String(error)
        alert(`Error: ${errorMsg}`)
        router.push('/discover')
      } finally {
        setLoading(false)
      }
    }

    loadChatData()
  }, [user, authLoading, isMan, creatorId, router])

  const sendMessage = async (content: string) => {
    if (!conversationId || !creator || !content.trim() || !user) return

    // Check if visitor has credits
    if (credits === null || credits <= 0) {
      setShowWaitlist(true)
      return
    }

    try {
      // Save user message (DON'T show typing yet)
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content,
        })
        .select()
        .single()

      if (userError || !userMessage) throw userError

      // Show user message immediately
      setMessages((prev) => [...prev, userMessage])

      // WAIT before showing "typing indicator" (simulating creator seeing message)
      // 5-30 seconds delay before they start typing
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 10000 + 3000))

      // NOW show typing indicator
      setSending(true)

      // Build request body
      // Use new personality_profile if available, otherwise fall back to legacy fields
      const requestBody: any = {
        conversationId,
        creatorId,
        message: content,
      }

      if (creator.personality_profile) {
        // New unified personality profile approach
        requestBody.personalityProfile = creator.personality_profile
        console.log('Chat: Sending with new personalityProfile')
      } else {
        // Fallback to legacy approach for backward compatibility
        requestBody.voiceFingerprint = creator.voice_fingerprint
        requestBody.creatorSettings = creator.creator_settings
        requestBody.creatorName = creator.display_name
        console.log('Chat: Sending with legacy voiceFingerprint + creatorSettings')
      }

      console.log('Chat: Sending to API:', {
        conversationId,
        creatorId,
        message: content.substring(0, 30),
        hasPersonalityProfile: !!creator.personality_profile,
        hasLegacyFields: !!(creator.voice_fingerprint || creator.creator_settings),
      })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const { assistantMessage } = await response.json()

      setMessages((prev) => [...prev, assistantMessage])

      // Deduct 1 credit after successful message
      const newCredits = Math.max(0, (credits || 0) - 1)
      setCredits(newCredits)

      console.log('Deducting credit. Old:', credits, 'New:', newCredits)

      // Update credits in database
      const { data: visitorProfile } = await supabase
        .from('male_profile')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (visitorProfile) {
        await supabase
          .from('male_profile')
          .update({ credits_balance: newCredits })
          .eq('id', visitorProfile.id)

        console.log('Updated database credits to:', newCredits)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <p className="text-gray-400">Loading chat...</p>
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <p className="text-gray-400">Creator not found</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-dark-bg flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gold">{creator.display_name}</h1>
          <p className="text-gray-500 text-xs">Linger Twin</p>
        </div>

        {/* Credits Display + Buttons */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-gray-400">Credits Left</p>
            <p className={`text-lg font-semibold ${credits === 0 ? 'text-red-500' : credits && credits <= 10 ? 'text-yellow-500' : 'text-gold'}`}>
              {credits ?? '--'}
            </p>
          </div>

          <div className="flex gap-2">
          <button
            onClick={() => router.push('/visitor/chats')}
            className="text-gray-400 hover:text-gray-300 text-sm px-3 py-1 hover:bg-gray-800 rounded"
          >
            📋 Chat History
          </button>
          <button
            onClick={() => router.push('/discover')}
            className="text-gray-400 hover:text-gray-300 text-sm px-3 py-1 hover:bg-gray-800 rounded"
          >
            🔍 Discover
          </button>
        </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Discover', href: '/discover' },
          { label: creator.display_name },
        ]}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gold text-lg mb-2">✨ {creator.display_name}</p>
              <p className="text-gray-400 text-sm">Start a conversation...</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}

        {/* Typing Indicator */}
        {sending && (
          <div className="flex items-center gap-2">
            <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg">
              <div className="flex gap-1 items-center">
                <span className="text-sm text-gray-400">{creator.display_name} is typing</span>
                <span className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={sending || credits === 0} />

      {/* Waitlist Modal */}
      {showWaitlist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold text-gold mb-2">Out of Credits</h2>
            <p className="text-gray-400 mb-4">
              You've used all your credits! Join our waitlist to get early access when we launch premium features.
            </p>

            <input
              type="email"
              placeholder="your@email.com"
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-300 placeholder-gray-600 mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowWaitlist(false)}
                className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded font-semibold hover:bg-gray-700"
              >
                Got it
              </button>
              <button
                onClick={async () => {
                  if (!waitlistEmail.trim()) {
                    alert('Please enter your email')
                    return
                  }

                  if (!user) {
                    alert('Please sign in to continue')
                    return
                  }

                  try {
                    // Save email and mark as seen
                    const { data: visitorProfile, error: profileError } = await supabase
                      .from('male_profile')
                      .select('id')
                      .eq('user_id', user.id)
                      .single()

                    console.log('Visitor profile:', visitorProfile, 'Error:', profileError)

                    if (profileError || !visitorProfile) {
                      throw new Error(`Could not find visitor profile: ${profileError?.message}`)
                    }

                    const { data: updateData, error: updateError } = await supabase
                      .from('male_profile')
                      .update({
                        waitlist_email: waitlistEmail,
                        seen_out_of_credits_modal: true,
                      })
                      .eq('id', visitorProfile.id)
                      .select()

                    console.log('Update response:', updateData, 'Error:', updateError)

                    if (updateError) {
                      throw new Error(`Failed to save email: ${updateError.message}`)
                    }

                    alert('Thanks! We\'ll email you when credits are available.')
                    setShowWaitlist(false)
                    setWaitlistEmail('')
                  } catch (error) {
                    console.error('Error saving waitlist email:', error)
                    alert(`Error saving email: ${error instanceof Error ? error.message : String(error)}`)
                  }
                }}
                className="flex-1 px-4 py-2 bg-gold text-gray-900 rounded font-semibold hover:bg-yellow-400"
              >
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
