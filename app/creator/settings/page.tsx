'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import Breadcrumb from '@/components/Breadcrumb'
import BackButton from '@/components/BackButton'
import PersonalityBuilder from '@/components/admin/PersonalityBuilder'
import { CreatorPersonalityProfile } from '@/lib/types/creator-profile'
import { buildFromLegacyData } from '@/lib/personality-service'

interface CreatorSettings {
  maturity_level: 'conservative' | 'casual' | 'very_open'
  communication_style: 'professional' | 'casual' | 'flirty' | 'serious' | 'playful'
  language_style: 'english' | 'singlish' | 'mixed' | 'other'
  age: number | null
  comfort_topics: string[]
  personality_archetype: string
}

export default function CreatorSettings() {
  const router = useRouter()
  const { user, isCreator } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'legacy' | 'personality'>('personality')
  const [settings, setSettings] = useState<CreatorSettings>({
    maturity_level: 'casual',
    communication_style: 'casual',
    language_style: 'english',
    age: null,
    comfort_topics: [],
    personality_archetype: 'friendly',
  })
  const [personalityProfile, setPersonalityProfile] = useState<CreatorPersonalityProfile | null>(null)

  useEffect(() => {
    if (!user || !isCreator) {
      router.push('/auth/signin')
      return
    }

    loadSettings()
  }, [user, isCreator, router])

  const loadSettings = async () => {
    if (!user) return

    const { data } = await supabase
      .from('creator_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      // Load legacy settings
      if (data.creator_settings) {
        setSettings(data.creator_settings)
      }
      if (data.age) {
        setSettings(prev => ({ ...prev, age: data.age }))
      }

      // Load or build personality profile
      if (data.personality_profile) {
        setPersonalityProfile(data.personality_profile)
      } else {
        // Build from legacy data
        const built = buildFromLegacyData(data)
        setPersonalityProfile(built)
      }
    }

    setLoading(false)
  }

  const saveSettings = async () => {
    if (!user) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updateData: any = {
        creator_settings: settings,
        age: settings.age,
      }

      // Also save personality profile if edited
      if (personalityProfile) {
        updateData.personality_profile = personalityProfile
      }

      const { error: updateError } = await supabase
        .from('creator_profile')
        .update(updateData)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      setSuccess('Settings saved successfully!')
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/creator/dashboard' },
          { label: 'Settings' },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-2">Settings</h1>
            <p className="text-gray-400">Configure your AI twin's personality</p>
          </div>
          <BackButton href="/creator/dashboard" label="← Dashboard" />
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-900 text-red-100 p-4 rounded mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900 text-green-100 p-4 rounded mb-6">
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4">
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
            onClick={() => setActiveTab('legacy')}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              activeTab === 'legacy'
                ? 'bg-gold text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            ⚙️ Legacy Settings
          </button>
        </div>

        {/* Personality Builder Tab */}
        {activeTab === 'personality' && personalityProfile && (
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
            <PersonalityBuilder
              value={personalityProfile}
              onChange={setPersonalityProfile}
            />
          </div>
        )}

        {/* Legacy Settings Tab */}
        {activeTab === 'legacy' && (
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 space-y-6">
          {/* Maturity Level */}
          <div className="pb-6 border-b border-gray-800">
            <label className="block text-lg font-semibold text-white mb-4">Maturity Level</label>
            <p className="text-gray-400 mb-3 text-sm">How open are you with adult/mature topics?</p>
            <div className="space-y-2">
              {(['conservative', 'casual', 'very_open'] as const).map((level) => (
                <label key={level} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="maturity"
                    value={level}
                    checked={settings.maturity_level === level}
                    onChange={(e) =>
                      setSettings({ ...settings, maturity_level: e.target.value as any })
                    }
                    className="mr-3"
                  />
                  <span className="text-gray-300 capitalize">
                    {level === 'conservative' && 'Conservative - Avoid adult topics'}
                    {level === 'casual' && 'Casual - Comfortable with adult humor'}
                    {level === 'very_open' && 'Very Open - Explicit, no filter'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Communication Style */}
          <div className="pb-6 border-b border-gray-800">
            <label className="block text-lg font-semibold text-white mb-4">Communication Style</label>
            <p className="text-gray-400 mb-3 text-sm">How do you naturally communicate?</p>
            <div className="space-y-2">
              {(['professional', 'casual', 'flirty', 'serious', 'playful'] as const).map((style) => (
                <label key={style} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="style"
                    value={style}
                    checked={settings.communication_style === style}
                    onChange={(e) =>
                      setSettings({ ...settings, communication_style: e.target.value as any })
                    }
                    className="mr-3"
                  />
                  <span className="text-gray-300 capitalize">
                    {style === 'professional' && 'Professional - Work-focused, formal'}
                    {style === 'casual' && 'Casual - Relaxed, friendly'}
                    {style === 'flirty' && 'Flirty - Playful, charming'}
                    {style === 'serious' && 'Serious - Direct, no-nonsense'}
                    {style === 'playful' && 'Playful - Fun, joking around'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Language Style */}
          <div className="pb-6 border-b border-gray-800">
            <label className="block text-lg font-semibold text-white mb-4">Language Style</label>
            <p className="text-gray-400 mb-3 text-sm">How do you speak?</p>
            <div className="space-y-2">
              {(['english', 'singlish', 'mixed', 'other'] as const).map((lang) => (
                <label key={lang} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="language"
                    value={lang}
                    checked={settings.language_style === lang}
                    onChange={(e) =>
                      setSettings({ ...settings, language_style: e.target.value as any })
                    }
                    className="mr-3"
                  />
                  <span className="text-gray-300 capitalize">
                    {lang === 'english' && 'English - Standard, fluent English'}
                    {lang === 'singlish' && 'Singlish - Mixed English/Chinese with casual grammar'}
                    {lang === 'mixed' && 'Mixed - Multiple languages and dialects'}
                    {lang === 'other' && 'Other - Unique style'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Age */}
          <div className="pb-6 border-b border-gray-800">
            <label className="block text-lg font-semibold text-white mb-4">Age</label>
            <p className="text-gray-400 mb-3 text-sm">Your age (affects maturity and references)</p>
            <input
              type="number"
              value={settings.age || ''}
              onChange={(e) =>
                setSettings({ ...settings, age: e.target.value ? parseInt(e.target.value) : null })
              }
              placeholder="Enter your age"
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gold"
            />
          </div>

          {/* Comfort Topics */}
          <div>
            <label className="block text-lg font-semibold text-white mb-4">Comfort Topics</label>
            <p className="text-gray-400 mb-3 text-sm">What topics are you comfortable discussing?</p>
            <div className="space-y-2">
              {[
                { key: 'adult_humor', label: 'Adult/Sexual humor' },
                { key: 'relationships', label: 'Relationships & dating' },
                { key: 'personal_life', label: 'Personal life details' },
                { key: 'politics', label: 'Politics & controversial topics' },
                { key: 'money', label: 'Money & financial topics' },
                { key: 'health', label: 'Health & medical topics' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.comfort_topics.includes(key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings({
                          ...settings,
                          comfort_topics: [...settings.comfort_topics, key],
                        })
                      } else {
                        setSettings({
                          ...settings,
                          comfort_topics: settings.comfort_topics.filter((t) => t !== key),
                        })
                      }
                    }}
                    className="mr-3"
                  />
                  <span className="text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

            {/* Save Button */}
            <div className="flex gap-4 pt-6 border-t border-gray-800">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex-1 bg-gold text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-400 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={() => router.push('/creator/dashboard')}
                className="flex-1 bg-gray-800 text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Save Button for Personality */}
        {activeTab === 'personality' && (
          <div className="flex gap-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex-1 bg-gold text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-400 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Personality Profile'}
            </button>
            <button
              onClick={() => router.push('/creator/dashboard')}
              className="flex-1 bg-gray-800 text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gray-800 bg-opacity-50 rounded p-4 text-sm text-gray-400 mt-6">
          <p>💡 <strong>Personality Profile:</strong> Controls how your AI twin sounds, communicates, and behaves. This is what visitors experience in conversations.</p>
          <p className="mt-2 text-xs">Legacy Settings are kept for backward compatibility but Personality Profile is recommended for the full customization.</p>
        </div>
      </div>
    </div>
  )
}
