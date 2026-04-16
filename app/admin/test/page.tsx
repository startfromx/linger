'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { checkAdminAccess } from '@/lib/admin-auth'

export default function AdminTestPage() {
  const { user, loading: authLoading } = useAuth()
  const [adminStatus, setAdminStatus] = useState<boolean | null>(null)

  useEffect(() => {
    const check = async () => {
      console.log('[TEST] User:', user?.email, 'Loading:', authLoading)

      if (!authLoading && user?.email) {
        const isAdmin = await checkAdminAccess(user.email)
        console.log('[TEST] Admin status:', isAdmin)
        setAdminStatus(isAdmin)
      }
    }

    check()
  }, [user, authLoading])

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', color: '#fff' }}>
      <h1 style={{ color: '#ffd700' }}>Admin Auth Test</h1>

      <div style={{ background: '#222', padding: '20px', marginBottom: '20px', border: '1px solid #444', borderRadius: '4px' }}>
        <p style={{ color: '#0f0', marginBottom: '10px' }}>
          <strong>Auth Loading:</strong> {authLoading ? 'YES' : 'NO'}
        </p>
        <p style={{ color: '#0f0', marginBottom: '10px' }}>
          <strong>User Email:</strong> {user?.email || 'NOT SET'}
        </p>
        <p style={{ color: '#0f0', marginBottom: '10px' }}>
          <strong>User ID:</strong> {user?.id || 'NOT SET'}
        </p>
        <p style={{ color: '#0f0', marginBottom: '10px' }}>
          <strong>Admin Status:</strong> {adminStatus === null ? 'CHECKING...' : adminStatus ? '✅ YES' : '❌ NO'}
        </p>
      </div>

      <div style={{ fontSize: '12px', color: '#888' }}>
        <p>Check browser console (F12) for detailed logs</p>
      </div>
    </div>
  )
}
