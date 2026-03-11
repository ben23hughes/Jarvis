'use client'

import { useState, useEffect } from 'react'
import { Lightbulb } from 'lucide-react'
import { ApiKeyCard } from './api-key-card'

export function GoveePanel() {
  const [connected, setConnected] = useState(false)
  const [deviceCount, setDeviceCount] = useState(0)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const d = await fetch('/api/govee/credentials').then(r => r.json())
    setConnected(d.connected)
    setDeviceCount(d.device_count ?? 0)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  if (loading) return null

  return (
    <ApiKeyCard
      name="Govee Smart Lights"
      description="Control your Govee lights — turn on/off, set brightness and color. Jarvis can set the mood on command."
      icon={<Lightbulb className="h-5 w-5 text-yellow-400" />}
      connected={connected}
      statusText={deviceCount > 0 ? `${deviceCount} device${deviceCount !== 1 ? 's' : ''} found` : undefined}
      fields={[{ name: 'api_key', label: 'API Key', type: 'password' }]}
      hint={<>Get your key from the Govee Home app: <strong>Profile → About → Apply for API Key</strong>.</>}
      onSave={async (values) => {
        const res = await fetch('/api/govee/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: values.api_key }),
        })
        if (!res.ok) throw new Error('Failed')
        await refresh()
      }}
      onDisconnect={async () => {
        await fetch('/api/govee/credentials', { method: 'DELETE' })
        setConnected(false)
        setDeviceCount(0)
      }}
    />
  )
}
