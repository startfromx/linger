'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  href?: string
  label?: string
  onClick?: () => void
  className?: string
}

/**
 * Back Button Component
 *
 * Navigates back to previous page or specified href
 *
 * Usage:
 * <BackButton href="/dashboard" label="Back to Dashboard" />
 * <BackButton label="Go Back" /> // Uses router.back()
 */
export default function BackButton({
  href,
  label = '← Back',
  onClick,
  className = '',
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  if (href) {
    return (
      <Link
        href={href}
        className={`text-gray-400 hover:text-white transition flex items-center gap-1 ${className}`}
      >
        {label}
      </Link>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`text-gray-400 hover:text-white transition flex items-center gap-1 ${className}`}
    >
      {label}
    </button>
  )
}
