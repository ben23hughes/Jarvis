'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { RefreshCw } from 'lucide-react'

function getGreeting(): string {
  const hour = new Date().toLocaleString('en-US', {
    timeZone: 'America/Denver',
    hour: 'numeric',
    hour12: false,
  })
  const h = parseInt(hour)
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayKey() {
  return 'jarvis-briefing-' + new Date().toLocaleDateString('en-US', { timeZone: 'America/Denver' })
}

interface Props {
  firstName: string
}

export function BriefingStream({ firstName }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [greeting] = useState(getGreeting)
  const abortRef = useRef<AbortController | null>(null)

  function startFetch(force = false) {
    const key = todayKey()
    if (!force) {
      const cached = sessionStorage.getItem(key)
      if (cached) {
        setText(cached)
        setDone(true)
        return
      }
    }

    sessionStorage.removeItem(key)
    setText('')
    setDone(false)
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    let accumulated = ''

    fetch('/api/dashboard/briefing', { signal: controller.signal })
      .then((res) => {
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()

        function read() {
          reader.read().then(({ done: streamDone, value }) => {
            if (streamDone) return
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              try {
                const event = JSON.parse(line.slice(6))
                if (event.type === 'text') {
                  accumulated += event.text
                  setText(accumulated)
                } else if (event.type === 'done') {
                  setDone(true)
                  setLoading(false)
                  sessionStorage.setItem(todayKey(), accumulated)
                } else if (event.type === 'error') {
                  setLoading(false)
                }
              } catch {}
            }
            read()
          })
        }
        read()
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    startFetch()
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-2">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {firstName}.
        </h1>
        <button
          onClick={() => startFetch(true)}
          className="mt-1 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Refresh briefing"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Streaming briefing */}
      <div className="relative min-h-[4rem]">
        {loading && !text && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm pt-2">
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
            Pulling your day together…
          </div>
        )}

        {text && (
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed">
            <ReactMarkdown>{text}</ReactMarkdown>
            {!done && (
              <span className="inline-block h-4 w-0.5 bg-foreground ml-0.5 align-middle animate-[blink_1s_step-end_infinite]" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
