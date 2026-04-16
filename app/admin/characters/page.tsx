'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { checkAdminAccess } from '@/lib/admin-auth'

interface Character {
  id: string
  display_name: string
  age: number | null
  bio: string | null
  profile_photo_url: string | null
  is_fictional: boolean
  source_count: number
  created_at: string
}

export default function AdminCharactersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const checkAndLoad = async () => {
      // Wait for auth to load
      if (authLoading) {
        return
      }

      // Not logged in
      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Check admin access
      const admin = await checkAdminAccess(user.email)
      if (!admin) {
        router.push('/')
        return
      }

      setIsAdmin(true)

      // Load characters
      try {
        const { data, error: err } = await supabase
          .from('creator_profile')
          .select('id, display_name, age, bio, profile_photo_url, is_fictional, source_count, created_at')
          .eq('is_fictional', true)
          .order('created_at', { ascending: false })

        if (err) throw err
        setCharacters(data || [])
      } catch (err) {
        console.error('Error loading characters:', err)
        setError('Failed to load characters')
      } finally {
        setLoading(false)
      }
    }

    checkAndLoad()
  }, [user, authLoading, router])

  const handleDelete = async (characterId: string, characterName: string) => {
    if (!confirm(`Delete "${characterName}"? This cannot be undone.`)) return

    setDeleting(characterId)
    try {
      const { error: err } = await supabase
        .from('creator_profile')
        .delete()
        .eq('id', characterId)

      if (err) throw err

      setCharacters(characters.filter((c) => c.id !== characterId))
    } catch (err) {
      console.error('Error deleting character:', err)
      setError('Failed to delete character')
    } finally {
      setDeleting(null)
    }
  }

  // Still loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gray-400">Access denied</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <nav className="bg-gray-900 p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gold">Fictional Characters</h1>
        <Link
          href="/admin/characters/create"
          className="bg-gold text-gray-900 px-4 py-2 rounded font-semibold hover:bg-yellow-400"
        >
          + Create Character
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {error && (
          <div className="bg-red-900 text-red-100 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400">Loading characters...</div>
        ) : characters.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">No fictional characters created yet.</p>
            <Link
              href="/admin/characters/create"
              className="inline-block bg-gold text-gray-900 px-6 py-2 rounded font-semibold hover:bg-yellow-400"
            >
              Create your first character
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {characters.map((character) => (
              <div
                key={character.id}
                className="bg-gray-900 rounded-lg p-6 flex items-start justify-between hover:bg-gray-800 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    {character.profile_photo_url && (
                      <img
                        src={character.profile_photo_url}
                        alt={character.display_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gold">{character.display_name}</h3>
                      {character.age && (
                        <p className="text-gray-400 text-sm">{character.age} years old</p>
                      )}
                      {character.bio && (
                        <p className="text-gray-400 text-sm mt-1">{character.bio}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-6 mt-4 text-sm text-gray-400">
                    <span>📚 {character.source_count} source{character.source_count !== 1 ? 's' : ''}</span>
                    <span>📅 Created {new Date(character.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/admin/characters/${character.id}`}
                    className="bg-blue-900 text-blue-100 px-3 py-2 rounded text-sm hover:bg-blue-800"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(character.id, character.display_name)}
                    disabled={deleting === character.id}
                    className="bg-red-900 text-red-100 px-3 py-2 rounded text-sm hover:bg-red-800 disabled:opacity-50"
                  >
                    {deleting === character.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
