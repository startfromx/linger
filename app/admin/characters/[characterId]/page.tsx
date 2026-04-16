'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { checkAdminAccess } from '@/lib/admin-auth'
import { supabase } from '@/lib/supabase'
import { extractVoiceFingerprint, type VoiceFingerprint } from '@/lib/voiceFingerprint'
import { type TranscriptSource } from '@/lib/transcript-formats'
import PersonalityBuilder from '@/components/admin/PersonalityBuilder'
import { CreatorPersonalityProfile } from '@/lib/types/creator-profile'

interface Character {
  id: string
  display_name: string
  age: number | null
  bio: string | null
  profile_photo_url: string | null
  gallery_urls: string[]
  personality_tags: string[]
  voice_fingerprint: VoiceFingerprint | null
  creator_settings: any
  personality_profile: CreatorPersonalityProfile | null
  source_count: number
  created_at: string
}

interface Source {
  id: string
  source_type: string
  source_name: string
  speaker_detected: string | null
  confidence: number
  created_at: string
}

type TabType = 'basic' | 'personality' | 'sources'

export default function EditCharacterPage() {
  const router = useRouter()
  const params = useParams()
  const characterId = params.characterId as string
  const { user, loading: authLoading } = useAuth()

  const [character, setCharacter] = useState<Character | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [merging, setMerging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('basic')

  // Edit state
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [personalityProfile, setPersonalityProfile] = useState<CreatorPersonalityProfile | null>(null)

  // Merge transcript state
  const [showMergeForm, setShowMergeForm] = useState(false)
  const [transcriptText, setTranscriptText] = useState('')
  const [sourceType, setSourceType] = useState<TranscriptSource['type']>('generic')
  const [speakerName, setSpeakerName] = useState('')

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return

      if (!user) {
        router.push('/auth/signin')
        return
      }

      const admin = await checkAdminAccess(user.email)
      if (!admin) {
        router.push('/')
        return
      }

      setIsAdmin(true)
    }

    checkAdmin()
  }, [user, authLoading, router])

  useEffect(() => {
    if (!isAdmin) return

    const loadCharacter = async () => {
      try {
        setLoading(true)

        const { data: charData, error: charErr } = await supabase
          .from('creator_profile')
          .select('*')
          .eq('id', characterId)
          .single()

        if (charErr) throw charErr
        if (!charData) throw new Error('Character not found')

        setCharacter(charData)
        setDisplayName(charData.display_name)
        setAge(charData.age?.toString() || '')
        setBio(charData.bio || '')

        // Load or create personality profile
        if (charData.personality_profile) {
          setPersonalityProfile(charData.personality_profile)
        } else {
          // Create empty profile from scratch
          const emptyProfile: CreatorPersonalityProfile = {
            id: charData.id,
            user_id: charData.user_id,
            display_name: charData.display_name,
            age: charData.age,
            gender: charData.gender || 'female',
            profession: [],
            location: '',
            country: '',
            language_style: 'american',
            accent_patterns: '',
            code_switching: false,
            formality: 'casual',
            expressiveness: 'moderate',
            directness: 'balanced',
            tone_tendency: 'warm',
            traits: [],
            archetype: 'friendly',
            voice_fingerprint: charData.voice_fingerprint,
            interests: charData.interests || [],
            values: [],
            topics_comfortable: [],
            topics_off_limits: [],
            cultural_background: '',
            education_level: 'bachelor',
            life_experience: '',
            favorite_phrases: [],
            common_emojis: [],
            speech_patterns: '',
            habitual_behaviors: [],
            maturity_level: 'casual',
            created_at: charData.created_at,
            updated_at: new Date().toISOString(),
          }
          setPersonalityProfile(emptyProfile)
        }

        const { data: sourcesData, error: sourcesErr } = await supabase
          .from('creator_sources')
          .select('id, source_type, source_name, speaker_detected, confidence, created_at')
          .eq('creator_id', characterId)
          .order('created_at', { ascending: false })

        if (sourcesErr) throw sourcesErr
        setSources(sourcesData || [])
      } catch (err) {
        console.error('Error loading character:', err)
        setError('Failed to load character')
      } finally {
        setLoading(false)
      }
    }

    loadCharacter()
  }, [characterId, isAdmin])

  const handleSave = async () => {
    if (!character) return

    setSaving(true)
    setError(null)

    try {
      const updateData: any = {
        character_id: characterId,
        display_name: displayName,
        age: age ? parseInt(age) : null,
        bio: bio || null,
      }

      if (activeTab === 'personality' && personalityProfile) {
        updateData.personality_profile = personalityProfile
      }

      const response = await fetch('/api/admin/characters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save character')
      }

      const { character: updated } = await response.json()

      setCharacter({
        ...character,
        display_name: displayName,
        age: age ? parseInt(age) : null,
        bio,
        personality_profile: personalityProfile,
        ...updated
      })
      alert('Changes saved successfully!')
    } catch (err) {
      console.error('Error saving character:', err)
      setError(err instanceof Error ? err.message : 'Failed to save character')
    } finally {
      setSaving(false)
    }
  }

  const handleMergeTranscript = async () => {
    if (!transcriptText.trim()) {
      setError('Please enter transcript text')
      return
    }

    setMerging(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/characters', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_id: characterId,
          transcript_text: transcriptText,
          source_type: sourceType,
          speaker_name: speakerName || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to merge transcript')
      }

      setTranscriptText('')
      setSpeakerName('')
      setShowMergeForm(false)
      await loadCharacter()
    } catch (err) {
      console.error('Error merging transcript:', err)
      setError(err instanceof Error ? err.message : 'Failed to merge transcript')
    } finally {
      setMerging(false)
    }
  }

  const loadCharacter = async () => {
    try {
      const { data: charData } = await supabase
        .from('creator_profile')
        .select('*')
        .eq('id', characterId)
        .single()

      if (charData) {
        setCharacter(charData)
        if (charData.personality_profile) {
          setPersonalityProfile(charData.personality_profile)
        }
      }

      const { data: sourcesData } = await supabase
        .from('creator_sources')
        .select('id, source_type, source_name, speaker_detected, confidence, created_at')
        .eq('creator_id', characterId)
        .order('created_at', { ascending: false })

      setSources(sourcesData || [])
    } catch (err) {
      console.error('Error reloading character:', err)
    }
  }

  if (authLoading || !isAdmin || loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <nav className="bg-gray-900 p-6">
          <Link href="/admin/characters" className="text-gray-400 hover:text-white">
            ← Back to Characters
          </Link>
        </nav>
        <div className="max-w-4xl mx-auto p-6 text-center text-gray-400">
          Character not found
        </div>
      </div>
    )
  }

  const fp = character.voice_fingerprint

  return (
    <div className="min-h-screen bg-dark-bg">
      <nav className="bg-gray-900 p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gold">{character.display_name}</h1>
        <Link href="/admin/characters" className="text-gray-400 hover:text-white">
          ← Back
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {error && (
          <div className="bg-red-900 text-red-100 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              activeTab === 'basic'
                ? 'bg-gold text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            📋 Basic Info
          </button>
          <button
            onClick={() => setActiveTab('personality')}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              activeTab === 'personality'
                ? 'bg-gold text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            ✨ Personality Profile
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              activeTab === 'sources'
                ? 'bg-gold text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            📚 Sources
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: Content Area */}
          <div className={activeTab === 'basic' ? 'col-span-2' : 'col-span-3'}>
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="bg-gray-900 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gold mb-4">Basic Information</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sources</label>
                    <div className="bg-gray-800 rounded px-4 py-2 text-gold font-semibold">
                      {character.source_count}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-gold text-gray-900 px-4 py-2 rounded font-semibold hover:bg-yellow-400 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : '✓ Save Changes'}
                </button>
              </div>
            )}

            {/* Personality Profile Tab */}
            {activeTab === 'personality' && personalityProfile && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gold mb-4">✨ Personality Profile</h2>
                <p className="text-gray-400 text-sm mb-4">Edit all personality dimensions</p>
                <PersonalityBuilder
                  initialProfile={personalityProfile}
                  onChange={setPersonalityProfile}
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full mt-6 bg-gold text-gray-900 px-4 py-2 rounded font-semibold hover:bg-yellow-400 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : '✓ Save Personality'}
                </button>
              </div>
            )}

            {/* Personality Fingerprint (in basic tab only) */}
            {activeTab === 'basic' && fp && (
              <div className="bg-gray-900 rounded-lg p-6 mt-6">
                <h2 className="text-xl font-semibold text-gold mb-4">Extracted Personality</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded p-4">
                    <h3 className="text-gold font-semibold mb-1">✍️ Writing Style</h3>
                    <p className="text-gray-300 text-sm">{fp.writing_style}</p>
                  </div>
                  <div className="bg-gray-800 rounded p-4">
                    <h3 className="text-gold font-semibold mb-1">💭 Emotional Tone</h3>
                    <p className="text-gray-300 text-sm">{fp.emotional_tone}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Sources Sidebar (show in basic or sources tab) */}
          {(activeTab === 'basic' || activeTab === 'sources') && (
            <div className="col-span-1 space-y-6">
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gold mb-4">📚 Sources</h2>

                {sources.length === 0 ? (
                  <p className="text-gray-400 text-sm">No sources yet</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {sources.map((source) => (
                      <div key={source.id} className="bg-gray-800 rounded p-3 text-sm">
                        <div className="font-semibold text-gold">{source.source_name}</div>
                        <p className="text-gray-400 text-xs">
                          {source.source_type === 'whatsapp' && '💬 WhatsApp'}
                          {source.source_type === 'youtube' && '📺 YouTube'}
                          {source.source_type === 'podcast' && '🎙️ Podcast'}
                          {source.source_type === 'generic' && '📝 Generic'}
                        </p>
                        <div className="flex justify-between items-center mt-2 text-xs">
                          <span className="text-gray-500">{new Date(source.created_at).toLocaleDateString()}</span>
                          <span className="text-gold">{(source.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowMergeForm(!showMergeForm)}
                  className="w-full mt-4 bg-blue-900 text-blue-100 px-4 py-2 rounded font-semibold hover:bg-blue-800 text-sm"
                >
                  {showMergeForm ? '✕ Close' : '+ Add Transcript'}
                </button>
              </div>

              {showMergeForm && (
                <div className="bg-gray-900 rounded-lg p-6 border border-blue-800">
                  <h3 className="text-gold font-semibold mb-4">Add Source</h3>

                  <div className="space-y-3">
                    <select
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value as TranscriptSource['type'])}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold"
                    >
                      <option value="generic">Generic</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="youtube">YouTube</option>
                      <option value="podcast">Podcast</option>
                    </select>

                    {(sourceType === 'youtube' || sourceType === 'podcast') && (
                      <input
                        type="text"
                        value={speakerName}
                        onChange={(e) => setSpeakerName(e.target.value)}
                        placeholder="Speaker (optional)"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold"
                      />
                    )}

                    <textarea
                      value={transcriptText}
                      onChange={(e) => setTranscriptText(e.target.value)}
                      placeholder="Paste transcript..."
                      rows={6}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-gold font-mono"
                    />

                    <button
                      onClick={handleMergeTranscript}
                      disabled={merging || !transcriptText.trim()}
                      className="w-full bg-blue-900 text-blue-100 px-3 py-2 rounded font-semibold hover:bg-blue-800 disabled:opacity-50 text-sm"
                    >
                      {merging ? 'Merging...' : '✓ Merge'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
