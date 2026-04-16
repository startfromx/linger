/**
 * Admin authentication utilities
 * Controls access to admin features
 */

import { supabase } from './supabase'

// List of admin emails (can be moved to database later)
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [])
  .filter(e => e.length > 0)

// Debug: Log admin emails on load
if (typeof window === 'undefined') {
  console.log('[Admin Auth] Configured admin emails:', ADMIN_EMAILS)
}

/**
 * Check if a user email is an admin
 */
export async function isAdminEmail(email?: string): Promise<boolean> {
  if (!email) return false
  const normalizedEmail = email.toLowerCase().trim()
  const isAdmin = ADMIN_EMAILS.includes(normalizedEmail)
  console.log('[Admin Auth] Checking email:', normalizedEmail, 'Is admin:', isAdmin, 'Allowed:', ADMIN_EMAILS)
  return isAdmin
}

/**
 * Check if a user ID is an admin
 * Queries the auth user to get their email
 */
export async function isAdminUser(userId?: string): Promise<boolean> {
  if (!userId) return false

  try {
    // Get current user's email from auth
    const { data, error } = await supabase.auth.admin.getUserById(userId)

    if (error || !data.user?.email) {
      return false
    }

    return isAdminEmail(data.user.email)
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Get admin status for current user
 * Used in client components
 */
export async function checkAdminAccess(userEmail?: string): Promise<boolean> {
  return isAdminEmail(userEmail)
}
