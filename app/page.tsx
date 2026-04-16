'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const router = useRouter()
  const { user, loading, isCreator, isMan } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user && isCreator) {
        router.push('/creator/dashboard')
      } else if (user && isMan) {
        router.push('/discover')
      } else {
        router.push('/auth/signin')
      }
    }
  }, [user, loading, isCreator, isMan, router])

  return (
    <main className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gold mb-4">Linger</h1>
        <p className="text-gray-400">Building foundation...</p>
      </div>
    </main>
  )
}
