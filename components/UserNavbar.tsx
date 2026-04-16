'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface NavItem {
  label: string
  href: string
  icon?: string
}

export default function UserNavbar() {
  const { user, loading, signOut, isAdmin } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  if (loading) {
    return (
      <div className="bg-gray-950 border-b border-gray-800 px-6 py-4">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  // Determine user type from user.role
  const isCreator = user?.role === 'creator'
  const isVisitor = user?.role === 'man' && !isAdmin

  // Build context-aware menu items
  // Check ADMIN first so admins always see admin menu
  let menuItems: NavItem[] = []

  if (isAdmin && user) {
    menuItems = [
      { label: 'Characters', href: '/admin/characters', icon: '✨' },
      { label: 'Create Character', href: '/admin/characters/create', icon: '➕' },
      { label: 'Waitlist', href: '/admin/waitlist', icon: '📋' },
    ]
  } else if (isVisitor && user) {
    menuItems = [
      { label: 'Discover', href: '/discover', icon: '🔍' },
      { label: 'Chat History', href: '/visitor/chats', icon: '💬' },
      { label: 'Profile', href: '/visitor/profile', icon: '👤' },
      { label: 'Settings', href: '/visitor/settings', icon: '⚙️' },
    ]
  } else if (isCreator && user) {
    menuItems = [
      { label: 'Dashboard', href: '/creator/dashboard', icon: '📊' },
      { label: 'Conversations', href: '/creator/conversations', icon: '💬' },
      { label: 'Analytics', href: '/creator/analytics', icon: '📈' },
      { label: 'Profile', href: '/creator/profile', icon: '👤' },
      { label: 'Settings', href: '/creator/settings', icon: '⚙️' },
    ]
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="bg-gray-950 border-b border-gray-800 px-6 py-4">
      <div className="flex justify-between items-center">
        {/* Left: Logo + User Info */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <span className="text-xl font-bold text-gold">🔗 Linger</span>
          </Link>

          {/* Context Menu */}
          {user && menuItems.length > 0 && (
            <div className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    isActive(item.href)
                      ? 'bg-gold text-gray-900'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              {/* User Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-800 transition"
              >
                <span className="text-sm text-gray-300">
                  {user.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                  {isAdmin ? '🔐 Admin' : isCreator ? '👤 Creator' : '👨 Visitor'}
                </span>
                <span className={`text-gray-400 transition ${menuOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-2 space-y-1">
                    {/* Mobile Menu Items */}
                    {user && menuItems.length > 0 && (
                      <>
                        <div className="md:hidden">
                          {menuItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMenuOpen(false)}
                              className={`block px-4 py-2 rounded text-sm ${
                                isActive(item.href)
                                  ? 'bg-gold text-gray-900'
                                  : 'text-gray-300 hover:bg-gray-800'
                              }`}
                            >
                              {item.icon} {item.label}
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-gray-700 my-2"></div>
                      </>
                    )}

                    {/* Profile & Settings */}
                    <Link
                      href={isCreator ? '/creator/profile' : '/visitor/profile'}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 rounded text-sm text-gray-300 hover:bg-gray-800"
                    >
                      👤 My Profile
                    </Link>

                    <Link
                      href={isCreator ? '/creator/settings' : '/visitor/settings'}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 rounded text-sm text-gray-300 hover:bg-gray-800"
                    >
                      ⚙️ Settings
                    </Link>

                    <div className="border-t border-gray-700 my-2"></div>

                    {/* Sign Out */}
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        signOut()
                      }}
                      className="w-full text-left px-4 py-2 rounded text-sm text-red-400 hover:bg-gray-800"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="bg-gold text-gray-900 px-4 py-2 rounded font-semibold hover:bg-yellow-400 text-sm transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
