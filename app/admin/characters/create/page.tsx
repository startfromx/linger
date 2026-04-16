'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { checkAdminAccess } from '@/lib/admin-auth'
import { extractVoiceFingerprint, type VoiceFingerprint } from '@/lib/voiceFingerprint'
import { extractFromTranscript, type TranscriptSource } from '@/lib/transcript-formats'
import { CreatorPersonalityProfile, CreatorPersonalityProfileUpdate, getDefaultPersonalityProfile } from '@/lib/types/creator-profile'
import PersonalityBuilder from '@/components/admin/PersonalityBuilder'

export default function CreateCharacterPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('other')
  const [profession, setProfession] = useState('')
  const [interests, setInterests] = useState('')
  const [description, setDescription] = useState('')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('')
  const [galleryUrls, setGalleryUrls] = useState('')

  // Transcript state
  const [transcriptText, setTranscriptText] = useState('')
  const [sourceType, setSourceType] = useState<TranscriptSource['type']>('generic')
  const [speakerName, setSpeakerName] = useState('')

  // Generated fingerprint
  const [fingerprint, setFingerprint] = useState<VoiceFingerprint | null>(null)
  const [extractionConfidence, setExtractionConfidence] = useState(0)

  // Personality profile state
  const [personalityProfile, setPersonalityProfile] = useState<Partial<CreatorPersonalityProfile> | null>(null)

  // UI state
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'details' | 'transcript' | 'personality' | 'preview' | 'creating'>('details')

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

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const handleExtractPersonality = async () => {
    if (!transcriptText.trim()) {
      setError('Please enter or paste transcript text')
      return
    }

    setExtracting(true)
    setError(null)

    try {
      const fp = extractVoiceFingerprint(transcriptText, displayName, {
        type: sourceType,
        speaker_name: speakerName || undefined,
      })

      setFingerprint(fp)
      setExtractionConfidence(fp.confidence_scores?.overall || 0)

      // Initialize personality profile with fingerprint
      const initialProfile: Partial<CreatorPersonalityProfile> = {
        display_name: displayName,
        age: age ? parseInt(age) : null,
        gender,
        profession: profession ? profession.split(',').map((p) => p.trim()) : [],
        interests: interests ? interests.split(',').map((i) => i.trim()) : [],
        voice_fingerprint: fp,
      }

      setPersonalityProfile(initialProfile)
      setStep('personality')
    } catch (err) {
      console.error('Error extracting personality:', err)
      setError('Failed to extract personality from transcript')
    } finally {
      setExtracting(false)
    }
  }

  const handleCreate = async () => {
    if (!displayName.trim()) {
      setError('Character name is required')
      return
    }

    if (!fingerprint) {
      setError('Please extract personality from transcript first')
      return
    }

    if (!personalityProfile) {
      setError('Please fill in personality profile')
      return
    }

    setLoading(true)
    setStep('creating')
    setError(null)

    try {
      // Build the full personality profile
      const fullProfile: CreatorPersonalityProfile = {
        ...(personalityProfile as any),
        id: '', // Will be generated
        creator_user_id: user?.id || '',
        is_fictional: true,
        bio: description || null,
        profile_photo_url: profilePhotoUrl || null,
        gallery_urls: galleryUrls
          ? galleryUrls.split('\n').map((url) => url.trim()).filter(Boolean)
          : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Use the raw SQL endpoint for character creation to avoid foreign key constraint issues
      const response = await fetch('/api/admin/characters-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          age: age ? parseInt(age) : null,
          gender,
          profession: profession ? profession.split(',').map((p) => p.trim()) : [],
          interests: interests ? interests.split(',').map((i) => i.trim()) : [],
          character_description: description,
          voice_fingerprint: fingerprint,
          profile_photo_url: profilePhotoUrl || null,
          gallery_urls: galleryUrls
            ? galleryUrls.split('\n').map((url) => url.trim()).filter(Boolean)
            : [],
          personality_tags: [],
          personality_profile: fullProfile, // Include the full personality profile
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create character')
      }

      const data = await response.json()

      if (transcriptText.trim()) {
        await fetch('/api/admin/characters', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character_id: data.character_id,
            transcript_text: transcriptText,
            source_type: sourceType,
            speaker_name: speakerName || undefined,
          }),
        })
      }

      router.push('/admin/characters')
    } catch (err) {
      console.error('Error creating character:', err)
      setError(err instanceof Error ? err.message : 'Failed to create character')
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <nav className="bg-gray-900 p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gold">Create Fictional Character</h1>
        <Link href="/admin/characters" className="text-gray-400 hover:text-white">
          ← Back
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {error && (
          <div className="bg-red-900 text-red-100 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex gap-1 mb-8 text-sm">
          <div
            className={`flex-1 py-2 px-2 rounded text-center ${
              step === 'details' ? 'bg-gold text-gray-900 font-semibold' : 'bg-gray-800 text-gray-400'
            }`}
          >
            1. Details
          </div>
          <div
            className={`flex-1 py-2 px-2 rounded text-center ${
              step === 'transcript'
                ? 'bg-gold text-gray-900 font-semibold'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            2. Transcript
          </div>
          <div
            className={`flex-1 py-2 px-2 rounded text-center ${
              step === 'personality'
                ? 'bg-gold text-gray-900 font-semibold'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            3. Personality
          </div>
          <div
            className={`flex-1 py-2 px-2 rounded text-center ${
              step === 'preview' ? 'bg-gold text-gray-900 font-semibold' : 'bg-gray-800 text-gray-400'
            }`}
          >
            4. Preview
          </div>
          <div
            className={`flex-1 py-2 px-2 rounded text-center ${
              step === 'creating' ? 'bg-gold text-gray-900 font-semibold' : 'bg-gray-800 text-gray-400'
            }`}
          >
            5. Done
          </div>
        </div>

        {/* Step 1: Character Details */}
        {step === 'details' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gold mb-6">Character Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Asian Office Lady, Gym Master"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g., 28"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profession (comma-separated)
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g., Software Engineer, Designer"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Interests (comma-separated)
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g., Travel, Fitness, Art"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the character..."
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  value={profilePhotoUrl}
                  onChange={(e) => setProfilePhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gallery URLs (one per line)
                </label>
                <textarea
                  value={galleryUrls}
                  onChange={(e) => setGalleryUrls(e.target.value)}
                  placeholder="https://..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setStep('transcript')}
                  className="flex-1 bg-gold text-gray-900 px-6 py-2 rounded font-semibold hover:bg-yellow-400"
                >
                  Next: Add Transcript
                </button>
                <button
                  onClick={() => router.push('/admin/characters')}
                  className="flex-1 bg-gray-800 text-gray-400 px-6 py-2 rounded font-semibold hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Transcript Upload */}
        {step === 'transcript' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gold mb-6">Add Transcript</h2>

            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Paste or upload a transcript to extract the character's personality.
                You can add more transcripts later to improve accuracy.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Transcript Source Type
                </label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as TranscriptSource['type'])}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-gold"
                >
                  <option value="generic">Generic Text</option>
                  <option value="whatsapp">WhatsApp Chat</option>
                  <option value="youtube">YouTube Transcript</option>
                  <option value="podcast">Podcast Transcript</option>
                </select>
              </div>

              {(sourceType === 'youtube' || sourceType === 'podcast') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Speaker Name (optional)
                  </label>
                  <input
                    type="text"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    placeholder="e.g., Alex, Host 1"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Leave empty to auto-detect the main speaker
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Transcript Text *
                </label>
                <textarea
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Paste transcript here..."
                  rows={10}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gold font-mono text-sm"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleExtractPersonality}
                  disabled={extracting || !transcriptText.trim()}
                  className="flex-1 bg-blue-900 text-blue-100 px-6 py-2 rounded font-semibold hover:bg-blue-800 disabled:opacity-50"
                >
                  {extracting ? 'Extracting...' : 'Extract Personality'}
                </button>
                <button
                  onClick={() => setStep('details')}
                  className="flex-1 bg-gray-800 text-gray-400 px-6 py-2 rounded font-semibold hover:bg-gray-700"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Personality Builder */}
        {step === 'personality' && personalityProfile && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gold mb-2">Personality Profile Builder</h2>
            <p className="text-gray-400 text-sm mb-6">
              Customize the personality dimensions to make this character more distinct and realistic.
              Edit different sections below to refine the character's voice.
            </p>

            <PersonalityBuilder
              initialProfile={personalityProfile}
              onChange={(updates) => {
                setPersonalityProfile({
                  ...personalityProfile,
                  ...updates,
                })
              }}
            />

            <div className="flex gap-2 pt-6 mt-6 border-t border-gray-700">
              <button
                onClick={() => setStep('preview')}
                className="flex-1 bg-gold text-gray-900 px-6 py-2 rounded font-semibold hover:bg-yellow-400"
              >
                Next: Preview
              </button>
              <button
                onClick={() => {
                  setStep('transcript')
                  setPersonalityProfile(null)
                }}
                className="flex-1 bg-gray-800 text-gray-400 px-6 py-2 rounded font-semibold hover:bg-gray-700"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Preview Fingerprint */}
        {step === 'preview' && fingerprint && personalityProfile && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gold mb-6">Personality Preview</h2>

            <div className="space-y-6">
              {/* Confidence Indicator */}
              <div className="bg-gray-800 rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Extraction Confidence</span>
                  <span className="text-gold font-semibold">{(extractionConfidence * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gold rounded-full h-2 transition-all"
                    style={{ width: `${extractionConfidence * 100}%` }}
                  />
                </div>
                {extractionConfidence < 0.7 && (
                  <p className="text-yellow-400 text-xs mt-2">
                    💡 Confidence is low. Add more transcript text for better accuracy.
                  </p>
                )}
              </div>

              {/* Writing Style */}
              <div className="bg-gray-800 rounded p-4">
                <h3 className="text-gold font-semibold mb-2">✍️ Writing Style</h3>
                <p className="text-gray-300">{fingerprint.writing_style}</p>
              </div>

              {/* Emotional Tone */}
              <div className="bg-gray-800 rounded p-4">
                <h3 className="text-gold font-semibold mb-2">💭 Emotional Tone</h3>
                <p className="text-gray-300">{fingerprint.emotional_tone}</p>
              </div>

              {/* Humor Style */}
              <div className="bg-gray-800 rounded p-4">
                <h3 className="text-gold font-semibold mb-2">😄 Humor Style</h3>
                <p className="text-gray-300">{fingerprint.humor_style}</p>
              </div>

              {/* Vocabulary Level */}
              <div className="bg-gray-800 rounded p-4">
                <h3 className="text-gold font-semibold mb-2">📚 Vocabulary Level</h3>
                <p className="text-gray-300">{fingerprint.vocabulary_level}</p>
              </div>

              {/* Conversational Patterns */}
              <div className="bg-gray-800 rounded p-4">
                <h3 className="text-gold font-semibold mb-2">🗣️ Conversational Patterns</h3>
                <p className="text-gray-300">{fingerprint.conversational_patterns}</p>
              </div>

              {/* Interests */}
              {fingerprint.interests.length > 0 && (
                <div className="bg-gray-800 rounded p-4">
                  <h3 className="text-gold font-semibold mb-2">⭐ Interests</h3>
                  <div className="space-y-1">
                    {fingerprint.interests.slice(0, 5).map((interest) => (
                      <div key={interest.name} className="flex justify-between text-gray-300">
                        <span>{interest.name}</span>
                        <span className="text-gray-500">
                          {(interest.frequency * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Values */}
              {fingerprint.values.length > 0 && (
                <div className="bg-gray-800 rounded p-4">
                  <h3 className="text-gold font-semibold mb-2">🎯 Values</h3>
                  <div className="flex flex-wrap gap-2">
                    {fingerprint.values.map((value) => (
                      <span
                        key={value}
                        className="bg-gold bg-opacity-20 text-gold px-3 py-1 rounded text-sm"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Example Messages */}
              {fingerprint.example_messages.length > 0 && (
                <div className="bg-gray-800 rounded p-4">
                  <h3 className="text-gold font-semibold mb-2">💬 Example Messages</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {fingerprint.example_messages.slice(0, 3).map((msg, idx) => (
                      <p key={idx} className="text-gray-400 text-sm italic">
                        "{msg}"
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 bg-gold text-gray-900 px-6 py-2 rounded font-semibold hover:bg-yellow-400 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : '✓ Create Character'}
                </button>
                <button
                  onClick={() => setStep('personality')}
                  className="flex-1 bg-gray-800 text-gray-400 px-6 py-2 rounded font-semibold hover:bg-gray-700"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Creating */}
        {step === 'creating' && (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <div className="mb-4">
              <div className="inline-block animate-spin">⚙️</div>
            </div>
            <p className="text-gray-300 text-lg">Creating character...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
          </div>
        )}
      </div>
    </div>
  )
}
