'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import OnboardingStep1 from '@/components/onboarding/Step1'
import OnboardingStep2 from '@/components/onboarding/Step2'
import OnboardingStep3 from '@/components/onboarding/Step3'
import OnboardingStep4 from '@/components/onboarding/Step4'
import OnboardingStep5 from '@/components/onboarding/Step5'
import OnboardingStep6 from '@/components/onboarding/Step6'

export default function Onboarding() {
  const router = useRouter()
  const { user, loading: authLoading, isCreator } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    display_name: '',
    age: '',
    city: '',
    bio: '',
    profile_photo_url: '',
    gallery_urls: [] as string[],
    personality_tags: [] as string[],
    topics_off_limits: [] as string[],
    voice_fingerprint: null as any,
  })

  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading) return

      if (!user || !isCreator) {
        router.push('/auth/signin')
        return
      }

      const { data: profile } = await supabase
        .from('creator_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile?.voice_fingerprint) {
        // Already completed onboarding
        router.push('/creator/dashboard')
        return
      }

      if (profile) {
        setFormData(prev => ({
          ...prev,
          display_name: profile.display_name || '',
          age: profile.age || '',
          city: profile.city || '',
          bio: profile.bio || '',
          profile_photo_url: profile.profile_photo_url || '',
          gallery_urls: profile.gallery_urls || [],
          personality_tags: profile.personality_tags || [],
          topics_off_limits: profile.topics_off_limits || [],
        }))
      }
      setLoading(false)
    }

    checkAuth()
  }, [user, authLoading, isCreator, router])

  const handleNext = () => {
    // Validate Step 3 requires voice fingerprint
    if (step === 3 && !formData.voice_fingerprint) {
      alert('Please upload your WhatsApp chat to extract your voice fingerprint')
      return
    }

    if (step < 6) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (!user?.id) {
        throw new Error('User ID not found')
      }

      console.log('Submitting with user:', user.id)
      console.log('Form data:', {
        display_name: formData.display_name,
        age: formData.age,
        city: formData.city,
        bio: formData.bio,
        personality_tags: formData.personality_tags,
        topics_off_limits: formData.topics_off_limits,
        voice_fingerprint: formData.voice_fingerprint ? 'set' : 'empty',
      })

      const { data, error } = await supabase
        .from('creator_profile')
        .update({
          display_name: formData.display_name,
          age: formData.age ? parseInt(formData.age) : null,
          city: formData.city,
          bio: formData.bio,
          profile_photo_url: formData.profile_photo_url,
          gallery_urls: formData.gallery_urls,
          personality_tags: formData.personality_tags,
          topics_off_limits: formData.topics_off_limits,
          voice_fingerprint: formData.voice_fingerprint,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      console.log('Update response:', { data, error })

      if (error) {
        throw new Error(error.message || JSON.stringify(error))
      }

      alert('Profile saved! ✓')
      router.push('/creator/dashboard')
    } catch (error) {
      console.error('Onboarding error:', error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      alert(`Error: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-dark-bg flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Progress bar */}
      <div className="bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gold">Create Your Twin</h1>
            <p className="text-gray-400 text-sm">Step {step} of 6</p>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-gold h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto p-6">
        {step === 1 && (
          <OnboardingStep1 formData={formData} setFormData={setFormData} />
        )}
        {step === 2 && (
          <OnboardingStep2 formData={formData} setFormData={setFormData} />
        )}
        {step === 3 && (
          <OnboardingStep3 formData={formData} setFormData={setFormData} />
        )}
        {step === 4 && (
          <OnboardingStep4 formData={formData} setFormData={setFormData} />
        )}
        {step === 5 && (
          <OnboardingStep5 formData={formData} setFormData={setFormData} />
        )}
        {step === 6 && (
          <OnboardingStep6 formData={formData} setFormData={setFormData} />
        )}

        {/* Navigation */}
        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <button
              onClick={handleBack}
              disabled={loading}
              className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition disabled:opacity-50"
            >
              Back
            </button>
          )}
          <button
            onClick={step === 6 ? handleSubmit : handleNext}
            disabled={loading || (step === 3 && !formData.voice_fingerprint)}
            className="flex-1 bg-gold text-dark-bg py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            title={step === 3 && !formData.voice_fingerprint ? 'Upload your WhatsApp chat first' : ''}
          >
            {loading ? 'Saving...' : step === 6 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
