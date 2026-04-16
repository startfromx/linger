interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Props {
  message: Message
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  // Format time as HH:MM AM/PM in user's local timezone
  const formatTime = (dateString: string) => {
    try {
      // Parse the ISO string - assume it's in UTC
      const utcDate = new Date(dateString)

      // Verify date is valid
      if (isNaN(utcDate.getTime())) {
        return 'Invalid'
      }

      // Get user's timezone offset from system
      // getTimezoneOffset() returns minutes; negative for east of UTC (UTC+8 = -480)
      // To convert UTC to local time, we need to SUBTRACT the offset
      const userOffset = new Date().getTimezoneOffset() // in minutes
      const localDate = new Date(utcDate.getTime() - userOffset * 60 * 1000)

      // Format as HH:MM AM/PM
      const hours = localDate.getHours()
      const minutes = localDate.getMinutes()
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      const displayMinutes = minutes.toString().padStart(2, '0')

      return `${displayHours}:${displayMinutes} ${ampm}`
    } catch (e) {
      return 'Invalid'
    }
  }

  const time = formatTime(message.created_at)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-gold text-dark-bg'
            : 'bg-gray-900 border border-gray-800 text-gray-300'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      </div>
      <span className="text-xs text-gray-500">{time}</span>
    </div>
  )
}
