'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './message-bubble'
import type { ChatMessage } from '@/types/chat'

interface ChatInterfaceProps {
  userName: string
}

function createGreeting(name: string): ChatMessage {
  return {
    id: 'greeting',
    role: 'assistant',
    content: `Hey ${name}! 👋 How can I help you today?`,
    createdAt: new Date(),
  }
}

export function ChatInterface({ userName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([createGreeting(userName)])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }, [input])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      toolCalls: [],
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])

    // Only send non-greeting messages to the API
    const apiMessages = [...messages, userMessage]
      .filter((m) => m.id !== 'greeting')
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6))

          if (data.type === 'text') {
            setMessages((prev) => {
              const updated = [...prev]
              const last = updated[updated.length - 1]
              if (last.role === 'assistant') {
                updated[updated.length - 1] = { ...last, content: last.content + data.text }
              }
              return updated
            })
          } else if (data.type === 'tool_call') {
            setMessages((prev) => {
              const updated = [...prev]
              const last = updated[updated.length - 1]
              if (last.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  toolCalls: [...(last.toolCalls ?? []), { id: data.id, name: data.name, input: data.input }],
                }
              }
              return updated
            })
          } else if (data.type === 'tool_result') {
            setMessages((prev) => {
              const updated = [...prev]
              const last = updated[updated.length - 1]
              if (last.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  toolCalls: (last.toolCalls ?? []).map((tc) =>
                    tc.id === data.tool_use_id ? { ...tc, result: data.content } : tc
                  ),
                }
              }
              return updated
            })
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last.role === 'assistant') {
          updated[updated.length - 1] = {
            ...last,
            content: 'Sorry, something went wrong. Please try again.',
          }
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header — feels like a contact/text thread */}
      <div className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          J
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Jarvis</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Your AI assistant</p>
        </div>
      </div>

      {/* Message thread */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 py-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isLoading && messages[messages.length - 1]?.content === '' && messages[messages.length - 1]?.toolCalls?.length === 0 && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-2.5">
                <span className="flex gap-1 text-sm text-muted-foreground">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input bar — iMessage style */}
      <div className="border-t bg-card px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Jarvis…"
            className="max-h-[120px] flex-1 resize-none rounded-2xl border bg-background px-4 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
