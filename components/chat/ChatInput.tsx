'use client'

import { useState, useRef } from 'react'

interface Props {
  onSend: (message: string) => void
  disabled: boolean
}

const QUICK_EMOJIS = ['😂', '❤️', '🔥', '✨', '😍', '😎', '👍', '🎉', '😢', '🤔', '😳', '🙌']

export default function ChatInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
      setShowEmojis(false)
    }
  }

  const addEmoji = (emoji: string) => {
    setInput(input + emoji)
    inputRef.current?.focus()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 border-t border-gray-800 p-4"
    >
      {/* Emoji Picker */}
      {showEmojis && (
        <div className="bg-gray-800 rounded p-3 mb-3 flex flex-wrap gap-2">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="text-2xl hover:scale-125 transition cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message..."
          disabled={disabled}
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:border-gold focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setShowEmojis(!showEmojis)}
          disabled={disabled}
          className="bg-gray-800 text-gold px-4 py-2 rounded hover:bg-gray-700 transition disabled:opacity-50"
          title="Add emoji"
        >
          😊
        </button>
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="bg-gold text-dark-bg px-6 py-2 rounded font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {disabled ? '...' : 'Send'}
        </button>
      </div>
    </form>
  )
}
