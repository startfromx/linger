'use client'

import { useState } from 'react'

interface Props {
  formData: any
  setFormData: (data: any) => void
}

export default function Step2({ formData, setFormData }: Props) {
  const [uploading, setUploading] = useState(false)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // For now, create a data URL (in production, upload to Cloudflare R2)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({
          ...formData,
          profile_photo_url: reader.result as string,
        })
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
      setUploading(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-gold mb-2">Profile Photo</h2>
      <p className="text-gray-400 mb-6">Choose your main photo</p>

      <div className="space-y-4">
        {formData.profile_photo_url ? (
          <div className="relative">
            <img
              src={formData.profile_photo_url}
              alt="Preview"
              className="w-full aspect-square object-cover rounded-lg"
            />
            <button
              onClick={() => setFormData({ ...formData, profile_photo_url: '' })}
              className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center aspect-square bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gold transition">
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📸</div>
              <p className="text-gray-400">Click to upload photo</p>
              <p className="text-gray-500 text-xs mt-1">JPG, PNG up to 5MB</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}

        {uploading && <p className="text-gray-400 text-center">Uploading...</p>}
      </div>
    </div>
  )
}
