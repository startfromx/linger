'use client'

import { useState } from 'react'
import { extractVoiceFingerprint } from '@/lib/voiceFingerprint'

interface Props {
  formData: any
  setFormData: (data: any) => void
}

export default function Step3({ formData, setFormData }: Props) {
  const [uploading, setUploading] = useState(false)
  const [extracted, setExtracted] = useState(false)

  const handleWhatsAppUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Step3: onChange triggered', e)
    console.log('Step3: e.target:', e.target)
    console.log('Step3: e.target.files:', e.target.files)

    const file = e.target.files?.[0]
    console.log('Step3: File selected:', file?.name || 'NO FILE')

    if (!file) {
      console.log('Step3: No file, returning')
      return
    }

    setUploading(true)
    try {
      console.log('Step3: Starting to read file:', file.name, 'Size:', file.size)
      const text = await file.text()
      console.log('Step3: File text read successfully, length:', text.length)
      console.log('Step3: First 200 chars:', text.substring(0, 200))

      console.log('Step3: Calling extractVoiceFingerprint...')
      const fingerprint = extractVoiceFingerprint(text, undefined)
      console.log('Step3: Extracted fingerprint:', {
        writing_style: fingerprint.writing_style,
        emotional_tone: fingerprint.emotional_tone,
        interests: fingerprint.interests,
        values: fingerprint.values,
        example_messages_count: fingerprint.example_messages?.length || 0,
      })

      console.log('Step3: Updating formData...')
      setFormData({
        ...formData,
        voice_fingerprint: fingerprint,
      })
      console.log('Step3: FormData updated with fingerprint')
      setExtracted(true)
      console.log('Step3: Extracted set to true')
    } catch (error) {
      console.error('Step3: ERROR:', error)
      console.error('Step3: Error stack:', error instanceof Error ? error.stack : 'N/A')
      alert('Error reading file. Make sure it\'s a .txt file. Error: ' + String(error))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-gold mb-2">Your Voice</h2>
      <p className="text-gray-400 mb-6">Upload WhatsApp chat to extract your personality</p>

      <div className="space-y-4">
        {!extracted ? (
          <label className="flex flex-col items-center justify-center aspect-square bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gold transition">
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-gray-400">Click to upload .txt file</p>
              <p className="text-gray-500 text-xs mt-1">WhatsApp export (Android)</p>
            </div>
            <input
              id="whatsapp-file-upload"
              name="whatsapp-file"
              type="file"
              accept=".txt"
              onChange={handleWhatsAppUpload}
              disabled={uploading}
              className="hidden"
              onClick={(e) => console.log('Step3: File input clicked')}
            />
          </label>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gold">Voice Profile Extracted ✓</h3>
              <button
                onClick={() => {
                  setExtracted(false)
                  setFormData({ ...formData, voice_fingerprint: null })
                }}
                className="text-sm text-gray-400 hover:text-gray-300"
              >
                Change
              </button>
            </div>

            {formData.voice_fingerprint && (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400">Writing Style</p>
                  <p className="text-white capitalize">{formData.voice_fingerprint.writing_style}</p>
                </div>
                <div>
                  <p className="text-gray-400">Emotional Tone</p>
                  <p className="text-white capitalize">{formData.voice_fingerprint.emotional_tone}</p>
                </div>
                <div>
                  <p className="text-gray-400">Interests</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.voice_fingerprint.interests.map((interest: string) => (
                      <span key={interest} className="bg-gold bg-opacity-20 text-gold px-2 py-1 rounded text-xs">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400">Values</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.voice_fingerprint.values.map((value: string) => (
                      <span key={value} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {uploading && <p className="text-gray-400 text-center">Analyzing chat...</p>}
      </div>
    </div>
  )
}
