'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/chat'
import { ToolCallCard } from './tool-call-card'
import { Volume2, Loader2, Square } from 'lucide-react'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  async function speak() {
    if (speaking) {
      audioRef.current?.pause()
      audioRef.current = null
      setSpeaking(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content }),
      })
      if (!res.ok) return

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      setSpeaking(true)
      audio.play()
      audio.onended = () => {
        setSpeaking(false)
        URL.revokeObjectURL(url)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[80%] space-y-2', isUser ? 'items-end' : 'items-start')}>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-1">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
        {message.content && (
          <div className="group relative">
            <div
              className={cn(
                'rounded-2xl px-4 py-2.5 text-sm',
                isUser
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>

            {/* Speak button — only on Jarvis messages */}
            {!isUser && (
              <button
                onClick={speak}
                disabled={loading}
                className={cn(
                  'absolute -bottom-3 right-2 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm transition-opacity',
                  'opacity-0 group-hover:opacity-100',
                  speaking && 'opacity-100 text-primary',
                  loading && 'opacity-100'
                )}
                title={speaking ? 'Stop' : 'Read aloud'}
              >
                {loading
                  ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  : speaking
                    ? <Square className="h-3 w-3 fill-current text-primary" />
                    : <Volume2 className="h-3 w-3 text-muted-foreground" />
                }
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
