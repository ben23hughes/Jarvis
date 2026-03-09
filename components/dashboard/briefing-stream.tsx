'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

function getGreeting(): string {
  const hour = parseInt(
    new Date().toLocaleString('en-US', { timeZone: 'America/Denver', hour: 'numeric', hour12: false })
  )
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayKey() {
  return 'jarvis-briefing-' + new Date().toLocaleDateString('en-US', { timeZone: 'America/Denver' })
}

export function BriefingStream({ firstName }: { firstName: string }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [greeting] = useState(getGreeting)
  const abortRef = useRef<AbortController | null>(null)

  function startFetch(force = false) {
    const key = todayKey()
    if (!force) {
      const cached = sessionStorage.getItem(key)
      if (cached) { setText(cached); setDone(true); return }
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
            for (const line of decoder.decode(value).split('\n')) {
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
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {firstName}.
        </h1>
        <button
          onClick={() => startFetch(true)}
          disabled={loading}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="min-h-[1.5rem]">
        {loading && !text && (
          <span className="text-muted-foreground text-sm animate-pulse">Checking in on your day…</span>
        )}
        {text && (
          <p className="text-muted-foreground leading-relaxed">
            {text}
            {!done && (
              <span className="inline-block h-4 w-0.5 bg-muted-foreground ml-0.5 align-middle animate-[blink_1s_step-end_infinite]" />
            )}
          </p>
        )}
      </div>
    </div>
  )
}
