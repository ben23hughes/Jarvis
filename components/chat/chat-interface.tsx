'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './message-bubble'
import type { ChatMessage } from '@/types/chat'

interface ChatInterfaceProps {
  userName: string
}

export function ChatInterface({ userName }: ChatInterfaceProps) {
  const fullGreeting = `Hi ${userName}, how can I help today?`
  const [greetingText, setGreetingText] = useState('')
  const [greetingDone, setGreetingDone] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const toggleListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => prev ? `${prev} ${transcript}` : transcript)
      setIsListening(false)
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isListening])

  // Typewriter effect for greeting
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i++
      setGreetingText(fullGreeting.slice(0, i))
      if (i >= fullGreeting.length) {
        clearInterval(interval)
        setGreetingDone(true)
      }
    }, 35)
    return () => clearInterval(interval)
  }, [fullGreeting])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, greetingText])

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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
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
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + data.text,
                }
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
                  toolCalls: [
                    ...(last.toolCalls ?? []),
                    { id: data.id, name: data.name, input: data.input },
                  ],
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
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4 py-4">
          {/* Typewriter greeting */}
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-2.5 text-sm">
              <p className="whitespace-pre-wrap">
                {greetingText}
                {!greetingDone && (
                  <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-foreground align-middle" />
                )}
              </p>
            </div>
          </div>

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="animate-pulse">Jarvis is thinking...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening...' : 'Message Jarvis... (Enter to send, Shift+Enter for new line)'}
          className="min-h-[52px] flex-1 resize-none rounded-md border bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          rows={1}
          disabled={isLoading}
        />
        <Button
          type="button"
          size="icon"
          variant={isListening ? 'destructive' : 'outline'}
          onClick={toggleListening}
          disabled={isLoading}
          title={isListening ? 'Stop listening' : 'Voice input'}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
