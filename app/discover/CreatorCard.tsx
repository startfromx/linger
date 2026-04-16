'use client'

import Link from 'next/link'

interface CreatorProfile {
  id: string
  display_name: string
  age?: number
  city?: string
  bio?: string
  profile_photo_url?: string
  personality_tags: string[]
  created_at: string
}

interface Props {
  creator: CreatorProfile
}

export default function CreatorCard({ creator }: Props) {
  // Mock online status - in production, check last_message_at timestamp
  const isOnline = Math.random() > 0.5

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden hover:shadow-xl transition hover:scale-105">
      {/* Photo */}
      <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
        {creator.profile_photo_url ? (
          <img
            src={creator.profile_photo_url}
            alt={creator.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-2">✨</div>
            <p className="text-gray-500">{creator.display_name}</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <div>
          <h3 className="text-lg font-semibold text-gold">{creator.display_name}</h3>
          <p className="text-gray-400 text-sm">
            {creator.age && creator.city && `${creator.age} · ${creator.city}`}
            {creator.age && !creator.city && `${creator.age}`}
            {!creator.age && creator.city && `${creator.city}`}
          </p>
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-gray-300 text-sm line-clamp-2">{creator.bio}</p>
        )}

        {/* Tags */}
        {creator.personality_tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {creator.personality_tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-gray-800 text-gold text-xs px-2 py-1 rounded capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <span className={`text-xs font-semibold ${isOnline ? 'text-green-400' : 'text-gray-500'}`}>
            {isOnline ? '● Online' : '● Offline'}
          </span>
          <Link
            href={`/chat/${creator.id}`}
            className="bg-gold text-dark-bg px-4 py-2 rounded font-semibold hover:opacity-90 transition text-sm"
          >
            Chat
          </Link>
        </div>
      </div>
    </div>
  )
}
