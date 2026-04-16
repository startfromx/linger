'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { checkAdminAccess } from '@/lib/admin-auth'

interface WaitlistEntry {
  id: string
  waitlist_email: string
  credits_balance: number
  created_at: string
}

export default function AdminWaitlistPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      // Load waitlist entries
      try {
        const { data, error: err } = await supabase
          .from('male_profile')
          .select('*')

        if (err) throw err

        // Filter for entries with waitlist_email and sort by id (reverse order)
        const waitlistData = (data || [])
          .filter((entry: any) => entry.waitlist_email && entry.waitlist_email.trim() !== '')
          .map((entry: any) => ({
            id: entry.id,
            waitlist_email: entry.waitlist_email,
            credits_balance: entry.credits_balance || 0,
            created_at: entry.created_at || new Date().toISOString(),
          }))
          .reverse()

        setEntries(waitlistData)
      } catch (err) {
        console.error('Error loading waitlist:', err)
        setError('Failed to load waitlist entries')
      } finally {
        setLoading(false)
      }
    }

    checkAndLoad()
  }, [user, authLoading, router])

  const handleExport = () => {
    if (entries.length === 0) {
      alert('No entries to export')
      return
    }

    const csv = [
      ['Email', 'Credits Left', 'Joined Date'],
      ...entries.map(e => [
        e.waitlist_email,
        e.credits_balance,
        new Date(e.created_at).toLocaleString()
      ])
    ]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
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
        <h1 className="text-2xl font-bold text-gold">Waitlist</h1>
        <button
          onClick={handleExport}
          disabled={entries.length === 0}
          className="bg-gold text-gray-900 px-4 py-2 rounded font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📥 Export CSV
        </button>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {error && (
          <div className="bg-red-900 text-red-100 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400">Loading waitlist...</div>
        ) : entries.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <p className="text-gray-400">No one on the waitlist yet.</p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-6 py-4 text-left text-gold font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-gold font-semibold">Credits Left</th>
                    <th className="px-6 py-4 text-left text-gold font-semibold">Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-gray-800 ${idx % 2 === 0 ? 'bg-gray-850' : 'bg-gray-900'} hover:bg-gray-800 transition`}
                    >
                      <td className="px-6 py-4 text-gray-300">{entry.waitlist_email}</td>
                      <td className="px-6 py-4 text-gray-300">{entry.credits_balance}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 text-gray-400 text-sm">
              Total: {entries.length} visitor{entries.length !== 1 ? 's' : ''} on waitlist
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
