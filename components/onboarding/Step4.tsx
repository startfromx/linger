'use client'

import { useState } from 'react'

interface Props {
  formData: any
  setFormData: (data: any) => void
}

export default function Step4({ formData, setFormData }: Props) {
  const [uploading, setUploading] = useState(false)

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    try {
      for (let file of Array.from(files)) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFormData({
            ...formData,
            gallery_urls: [...formData.gallery_urls, reader.result as string],
          })
        }
        reader.readAsDataURL(file)
      }
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    setFormData({
      ...formData,
      gallery_urls: formData.gallery_urls.filter((_: string, i: number) => i !== index),
    })
  }

  return (
    <div className="bg-gray-900 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-gold mb-2">Gallery</h2>
      <p className="text-gray-400 mb-6">Add 2-5 more photos (optional)</p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {formData.gallery_urls.map((url: string, idx: number) => (
            <div key={idx} className="relative">
              <img
                src={url}
                alt={`Gallery ${idx}`}
                className="w-full aspect-square object-cover rounded-lg"
              />
              <button
                onClick={() => removePhoto(idx)}
                className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
              >
                ✕
              </button>
            </div>
          ))}

          {formData.gallery_urls.length < 5 && (
            <label className="flex items-center justify-center aspect-square bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gold transition">
              <div className="text-center">
                <div className="text-2xl mb-1">+</div>
                <p className="text-gray-400 text-xs">Add photo</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleGalleryUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        <p className="text-gray-500 text-sm">
          {formData.gallery_urls.length}/5 photos
        </p>
      </div>
    </div>
  )
}
