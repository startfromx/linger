'use client'

import { useState } from 'react'
import {
  CreatorPersonalityProfile,
  CreatorPersonalityProfileUpdate,
} from '@/lib/types/creator-profile'
import { PERSONALITY_OPTIONS } from '@/lib/constants/personality-options'

interface PersonalityBuilderProps {
  initialProfile?: Partial<CreatorPersonalityProfile>
  onChange?: (updates: CreatorPersonalityProfileUpdate) => void
}

/**
 * PersonalityBuilder Component
 *
 * Interactive form for editing all personality dimensions.
 * Organized into collapsible sections for easy navigation.
 */
export default function PersonalityBuilder({
  initialProfile = {},
  onChange,
}: PersonalityBuilderProps) {
  const [profile, setProfile] = useState<Partial<CreatorPersonalityProfile>>(
    initialProfile
  )
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    location: true,
    communication: true,
    personality: true,
    values: false,
    cultural: false,
    quirks: false,
    maturity: false,
  })

  const handleUpdate = (key: keyof CreatorPersonalityProfile, value: any) => {
    const updated = { ...profile, [key]: value }
    setProfile(updated)
    onChange?.(updated)
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const renderMultiSelect = (
    label: string,
    value: string[],
    options: string[],
    onChange: (val: string[]) => void,
    maxItems: number = 5
  ) => (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value?.map((item) => (
          <span
            key={item}
            className="bg-gold/20 text-gold px-2 py-1 rounded text-sm flex items-center gap-1"
          >
            {item}
            <button
              onClick={() => onChange(value.filter((v) => v !== item))}
              className="hover:text-gold/60 ml-1"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      {(!value || value.length < maxItems) && (
        <select
          onChange={(e) => {
            if (e.target.value && !value?.includes(e.target.value)) {
              onChange([...(value || []), e.target.value])
            }
            e.target.value = ''
          }}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
        >
          <option value="">+ Add {label.toLowerCase()}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
    </div>
  )

  const renderSelect = (
    label: string,
    value: string | undefined,
    options: Array<{ value: string; label: string }>,
    onChange: (val: string) => void
  ) => (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
      >
        <option value="">Select {label.toLowerCase()}...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )

  const renderTextInput = (
    label: string,
    value: string | null | undefined,
    onChange: (val: string | null) => void,
    placeholder: string = ''
  ) => (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500"
      />
    </div>
  )

  const SectionHeader = ({ title, id }: { title: string; id: string }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full text-left flex items-center gap-2 font-semibold text-gold hover:text-gold/80 mb-3 pt-4 mt-4 border-t border-gray-700"
    >
      <span>{expandedSections[id] ? '▼' : '▶'}</span> {title}
    </button>
  )

  return (
    <div className="bg-gray-900 rounded border border-gray-700 p-4 max-h-[60vh] overflow-y-auto">
      <div className="space-y-4">
        {/* LOCATION & LINGUISTIC */}
        <SectionHeader title="Geographic & Linguistic Context" id="location" />
        {expandedSections.location && (
          <div className="pl-4 space-y-3">
            {renderTextInput(
              'Location',
              profile.location,
              (val) => handleUpdate('location', val),
              'e.g., "London, UK" or "Singapore"'
            )}

            {renderSelect(
              'Language Style',
              profile.language_style,
              PERSONALITY_OPTIONS.languageStyles,
              (val) =>
                handleUpdate(
                  'language_style',
                  val as 'british' | 'american' | 'singlish' | 'mixed'
                )
            )}

            {renderSelect(
              'Accent Patterns',
              profile.accent_patterns,
              PERSONALITY_OPTIONS.accentPatterns.map((accent) => ({
                value: accent,
                label: accent,
              })),
              (val) => handleUpdate('accent_patterns', val || null)
            )}

            <div className="mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <input
                  type="checkbox"
                  checked={profile.code_switching || false}
                  onChange={(e) =>
                    handleUpdate('code_switching', e.target.checked)
                  }
                  className="w-4 h-4"
                />
                Code-switching (mix multiple languages)
              </label>
            </div>
          </div>
        )}

        {/* COMMUNICATION STYLE */}
        <SectionHeader title="Communication Style" id="communication" />
        {expandedSections.communication && (
          <div className="pl-4 space-y-3">
            {renderSelect(
              'Formality',
              profile.formality,
              PERSONALITY_OPTIONS.communicationStyles,
              (val) =>
                handleUpdate(
                  'formality',
                  val as 'very_formal' | 'formal' | 'casual' | 'very_casual'
                )
            )}

            {renderSelect(
              'Expressiveness',
              profile.expressiveness,
              PERSONALITY_OPTIONS.expressiveness,
              (val) =>
                handleUpdate(
                  'expressiveness',
                  val as 'reserved' | 'moderate' | 'expressive' | 'very_expressive'
                )
            )}

            {renderSelect(
              'Directness',
              profile.directness,
              PERSONALITY_OPTIONS.directness,
              (val) =>
                handleUpdate(
                  'directness',
                  val as 'indirect' | 'balanced' | 'direct' | 'blunt'
                )
            )}

            {renderSelect(
              'Tone Tendency',
              profile.tone_tendency,
              PERSONALITY_OPTIONS.toneTendencies,
              (val) =>
                handleUpdate(
                  'tone_tendency',
                  val as 'sarcastic' | 'warm' | 'neutral' | 'dry' | 'enthusiastic'
                )
            )}
          </div>
        )}

        {/* PERSONALITY */}
        <SectionHeader title="Personality Traits & Archetype" id="personality" />
        {expandedSections.personality && (
          <div className="pl-4 space-y-3">
            {renderMultiSelect(
              'Personality Traits',
              profile.traits || [],
              PERSONALITY_OPTIONS.traits,
              (val) => handleUpdate('traits', val),
              5
            )}

            {renderSelect(
              'Archetype',
              profile.archetype,
              PERSONALITY_OPTIONS.archetypes.map((arch) => ({
                value: arch,
                label: arch.charAt(0).toUpperCase() + arch.slice(1),
              })),
              (val) => handleUpdate('archetype', val || null)
            )}
          </div>
        )}

        {/* VALUES & INTERESTS */}
        <SectionHeader title="Values & Interests" id="values" />
        {expandedSections.values && (
          <div className="pl-4 space-y-3">
            {renderMultiSelect(
              'Main Interests',
              profile.interests || [],
              [
                'design',
                'tech',
                'art',
                'music',
                'sports',
                'food',
                'travel',
                'philosophy',
                'business',
                'fashion',
              ],
              (val) => handleUpdate('interests', val)
            )}

            {renderMultiSelect(
              'Core Values',
              profile.values || [],
              [
                'authenticity',
                'creativity',
                'growth',
                'integrity',
                'kindness',
                'freedom',
                'achievement',
                'connection',
              ],
              (val) => handleUpdate('values', val)
            )}

            {renderMultiSelect(
              'Topics You Engage With',
              profile.topics_comfortable || [],
              [
                'work',
                'design',
                'personal',
                'philosophy',
                'humor',
                'relationships',
                'travel',
                'health',
              ],
              (val) => handleUpdate('topics_comfortable', val)
            )}

            {renderMultiSelect(
              'Topics to Avoid',
              profile.topics_off_limits || [],
              [
                'politics',
                'religion',
                'violence',
                'explicit content',
                'sensitive topics',
              ],
              (val) => handleUpdate('topics_off_limits', val)
            )}
          </div>
        )}

        {/* CULTURAL & BACKGROUND */}
        <SectionHeader title="Cultural & Background Context" id="cultural" />
        {expandedSections.cultural && (
          <div className="pl-4 space-y-3">
            {renderSelect(
              'Cultural Background',
              profile.cultural_background,
              PERSONALITY_OPTIONS.culturalBackgrounds.map((bg) => ({
                value: bg,
                label: bg,
              })),
              (val) => handleUpdate('cultural_background', val || null)
            )}

            {renderSelect(
              'Education Level',
              profile.education_level,
              PERSONALITY_OPTIONS.educationLevels,
              (val) =>
                handleUpdate(
                  'education_level',
                  val as 'high_school' | 'bachelor' | 'master' | 'phd'
                )
            )}

            {renderSelect(
              'Life Experience',
              profile.life_experience,
              PERSONALITY_OPTIONS.lifeExperiences.map((exp) => ({
                value: exp,
                label: exp.replace(/_/g, ' ').toUpperCase(),
              })),
              (val) => handleUpdate('life_experience', val || null)
            )}
          </div>
        )}

        {/* UNIQUE QUIRKS */}
        <SectionHeader title="Unique Quirks & Patterns" id="quirks" />
        {expandedSections.quirks && (
          <div className="pl-4 space-y-3">
            {renderMultiSelect(
              'Favorite Phrases',
              profile.favorite_phrases || [],
              PERSONALITY_OPTIONS.favoritePhrases,
              (val) => handleUpdate('favorite_phrases', val),
              8
            )}

            {renderMultiSelect(
              'Common Emojis',
              profile.common_emojis || [],
              PERSONALITY_OPTIONS.commonEmojis,
              (val) => handleUpdate('common_emojis', val),
              8
            )}

            {renderSelect(
              'Speech Pattern',
              profile.speech_patterns,
              PERSONALITY_OPTIONS.speechPatterns.map((pattern) => ({
                value: pattern,
                label: pattern,
              })),
              (val) => handleUpdate('speech_patterns', val || null)
            )}

            {renderMultiSelect(
              'Habitual Behaviors',
              profile.habitual_behaviors || [],
              PERSONALITY_OPTIONS.habitualBehaviors,
              (val) => handleUpdate('habitual_behaviors', val),
              5
            )}
          </div>
        )}

        {/* MATURITY */}
        <SectionHeader title="Content Maturity" id="maturity" />
        {expandedSections.maturity && (
          <div className="pl-4 space-y-3">
            {renderSelect(
              'Maturity Level',
              profile.maturity_level,
              PERSONALITY_OPTIONS.maturityLevels,
              (val) =>
                handleUpdate(
                  'maturity_level',
                  val as 'cautious' | 'casual' | 'very_open'
                )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
