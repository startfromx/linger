'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'

interface User {
  id: string
  email?: string
  role?: 'creator' | 'man'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  isCreator: boolean
  isMan: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const setupAuth = async () => {
      try {
        // Just listen for auth changes - don't call getSession
        const { data: subscription } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            try {
              if (!mounted) return

              if (session?.user) {
                // User is logged in - determine role
                let role: 'creator' | 'man' = 'man'

                try {
                  // Wrap in timeout to prevent hanging
                  const rolePromise = supabase
                    .from('creator_profile')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .maybeSingle()

                  const timeoutPromise = new Promise((resolve) =>
                    setTimeout(() => resolve(null), 1000)
                  )

                  const result = await Promise.race([rolePromise, timeoutPromise])

                  if (result && typeof result === 'object' && 'data' in result) {
                    role = (result as any).data ? 'creator' : 'man'
                  }

                } catch (err) {
                  // Ignore any role check errors
                  console.log('[Auth] Role check failed, defaulting to man')
                }

                if (mounted) {
                  setUser({
                    id: session.user.id,
                    email: session.user.email,
                    role,
                  })
                  setLoading(false)
                }
              } else {
                // No user
                if (mounted) {
                  setUser(null)
                  setLoading(false)
                }
              }
            } catch (err) {
              console.error('[Auth] Listener error:', err)
              if (mounted) {
                setLoading(false)
              }
            }
          }
        )

        // Cleanup
        return () => {
          subscription?.subscription.unsubscribe()
        }
      } catch (err) {
        console.error('[Auth] Setup error:', err)
        if (mounted) {
          setLoading(false)
        }
        return undefined
      }
    }

    const cleanup = setupAuth()
    cleanup?.then((cleanupFn) => {
      return () => {
        mounted = false
        cleanupFn?.()
      }
    })

    // Fallback: force loading to false after 3 seconds
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 3000)

    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  }, [])

  const signOut = async () => {
    try {
      setUser(null)
      await supabase.auth.signOut().catch(() => {})
      router.push('/auth/signin')
    } catch (error) {
      console.error('SignOut error:', error)
      setUser(null)
      router.push('/auth/signin')
    }
  }

  // Check if user is admin (case-insensitive, hardcoded fallback)
  const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  const hardcodedAdminEmail = 'lum@startfromx.com'

  // Check both env var AND hardcoded email as fallback
  const isAdmin = user?.email
    ? adminEmailsEnv.includes(user.email.toLowerCase()) || user.email.toLowerCase() === hardcodedAdminEmail.toLowerCase()
    : false

  // AGGRESSIVE debug logging
  useEffect(() => {
    if (user) {
      console.log('=== [AUTH DEBUG] ===')
      console.log('User Email:', user.email)
      console.log('Email Lowercase:', user.email?.toLowerCase())
      console.log('Admin Emails (Env):', adminEmailsEnv)
      console.log('Hardcoded Admin:', hardcodedAdminEmail)
      console.log('Match Env?', adminEmailsEnv.includes(user.email?.toLowerCase() || ''))
      console.log('Match Hardcoded?', user.email?.toLowerCase() === hardcodedAdminEmail.toLowerCase())
      console.log('Final isAdmin:', isAdmin)
      console.log('NEXT_PUBLIC_ADMIN_EMAILS env:', process.env.NEXT_PUBLIC_ADMIN_EMAILS)
      console.log('=================')
    }
  }, [user, isAdmin, adminEmailsEnv])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        isCreator: user?.role === 'creator',
        isMan: user?.role === 'man',
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
