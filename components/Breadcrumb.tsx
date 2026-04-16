'use client'

import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Breadcrumb Navigation Component
 *
 * Displays navigation path: Home > Section > Page > Current
 * Only the current (last) item is not a link
 *
 * Usage:
 * <Breadcrumb items={[
 *   { label: 'Home', href: '/' },
 *   { label: 'Conversations', href: '/creator/conversations' },
 *   { label: 'Chat with John' }
 * ]} />
 */
export default function Breadcrumb({
  items,
  className = '',
}: BreadcrumbProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav
      className={`bg-gray-900 border-b border-gray-800 px-6 py-3 ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {/* Breadcrumb Item */}
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-400 hover:text-gold transition"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gold font-semibold">{item.label}</span>
            )}

            {/* Separator (not on last item) */}
            {index < items.length - 1 && (
              <span className="text-gray-600">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
