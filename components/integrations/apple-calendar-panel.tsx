'use client'

import { useState, useEffect } from 'react'
import { Apple } from 'lucide-react'
import { ApiKeyCard } from './api-key-card'

export function AppleCalendarPanel() {
  const [connected, setConnected] = useState(false)
  const [appleId, setAppleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const d = await fetch('/api/apple-calendar/credentials').then(r => r.json())
    setConnected(d.connected)
    setAppleId(d.apple_id ?? null)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  if (loading) return null

  return (
    <ApiKeyCard
      name="Apple Calendar"
      description="Read and create events in your iCloud calendars via CalDAV. Uses an app-specific password."
      icon={<Apple className="h-5 w-5" />}
      connected={connected}
      statusText={appleId ?? undefined}
      fields={[
        { name: 'apple_id', label: 'Apple ID (email)', placeholder: 'you@icloud.com' },
        { name: 'app_password', label: 'App-Specific Password', placeholder: 'xxxx-xxxx-xxxx-xxxx', type: 'password' },
      ]}
      hint={
        <>
          Generate one at <strong>appleid.apple.com → Sign-In and Security → App-Specific Passwords</strong>.
        </>
      }
      onSave={async (values) => {
        const res = await fetch('/api/apple-calendar/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apple_id: values.apple_id, app_specific_password: values.app_password }),
        })
        if (!res.ok) throw new Error('Failed')
        await refresh()
      }}
      onDisconnect={async () => {
        await fetch('/api/apple-calendar/credentials', { method: 'DELETE' })
        setConnected(false)
        setAppleId(null)
      }}
    />
  )
}
