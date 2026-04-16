import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import UserNavbar from '@/components/UserNavbar'

export const metadata: Metadata = {
  title: 'Linger',
  description: 'Intimate AI conversation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-dark-bg text-white">
        <AuthProvider>
          <UserNavbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
