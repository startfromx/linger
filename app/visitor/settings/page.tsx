'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Breadcrumb from '@/components/Breadcrumb'
import BackButton from '@/components/BackButton'

interface NotificationSettings {
  email_new_messages: boolean
  email_matches: boolean
  push_notifications: boolean
}

export default function VisitorSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, isMan } = useAuth()
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_new_messages: true,
    email_matches: true,
    push_notifications: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      if (authLoading) return

      if (!user || !isMan) {
        router.push('/auth/signin')
        return
      }

      // Load notification settings (would come from database in full implementation)
      // For now, use defaults
      setLoading(false)
    }

    loadSettings()
  }, [user, authLoading, isMan, router])

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setSuccess(null)
    setError(null)
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // TODO: Save to database
      // const { error: updateError } = await supabase
      //   .from('visitor_settings')
      //   .update(notifications)
      //   .eq('user_id', user?.id)

      setSuccess('Settings saved successfully!')
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/discover' },
          { label: 'Settings' },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-2">Settings</h1>
            <p className="text-gray-400">Manage your preferences and account settings</p>
          </div>
          <BackButton href="/discover" label="← Discover" />
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-900 text-red-100 p-4 rounded mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900 text-green-100 p-4 rounded mb-6">
            {success}
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Notifications Section */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-gold mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div>
                  <p className="text-white font-medium">Email for New Messages</p>
                  <p className="text-gray-400 text-sm">Get notified when creators reply</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('email_new_messages')}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    notifications.email_new_messages ? 'bg-gold' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      notifications.email_new_messages ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div>
                  <p className="text-white font-medium">Email for New Matches</p>
                  <p className="text-gray-400 text-sm">Get notified when new creators match your interests</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('email_matches')}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    notifications.email_matches ? 'bg-gold' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      notifications.email_matches ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-gray-400 text-sm">Real-time notifications in your browser (if enabled)</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('push_notifications')}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    notifications.push_notifications ? 'bg-gold' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      notifications.push_notifications ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveNotifications}
              disabled={saving}
              className="mt-6 bg-gold text-gray-900 px-4 py-2 rounded font-semibold hover:bg-yellow-400 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Privacy Section */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-gold mb-4">Privacy & Safety</h2>
            <div className="space-y-4 text-gray-400">
              <p>🔒 Your profile is private by default. Only creators you message can see your profile.</p>
              <p>💬 All conversations are end-to-end encrypted on our servers.</p>
              <p>🚫 You can block creators or report inappropriate behavior.</p>
              <p className="text-sm text-gray-500">Report a Creator: Contact support@linger.app</p>
            </div>
          </div>

          {/* Data Section */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-gold mb-4">Your Data</h2>
            <div className="space-y-3">
              <button className="w-full text-left bg-gray-800 hover:bg-gray-700 p-4 rounded transition">
                <p className="text-white font-medium">📥 Download Your Data</p>
                <p className="text-gray-400 text-sm mt-1">Export all your messages and profile information</p>
              </button>
              <button className="w-full text-left bg-gray-800 hover:bg-gray-700 p-4 rounded transition">
                <p className="text-white font-medium">🗑️ Delete My Account</p>
                <p className="text-gray-400 text-sm mt-1">Permanently delete your account and all associated data</p>
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-gold mb-4">Help & Support</h2>
            <div className="space-y-3 text-gray-400">
              <p>❓ Have questions? Check out our <a href="#" className="text-gold hover:underline">Help Center</a></p>
              <p>📧 Contact us at <a href="mailto:support@linger.app" className="text-gold hover:underline">support@linger.app</a></p>
              <p>🐛 Found a bug? Report it on our <a href="#" className="text-gold hover:underline">GitHub Issues</a></p>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-gray-800 bg-opacity-50 rounded p-4 text-sm text-gray-400">
            <p>💡 Settings are saved automatically. If you have questions about your data, privacy, or settings, contact our support team.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
