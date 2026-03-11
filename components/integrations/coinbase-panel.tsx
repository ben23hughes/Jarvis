'use client'

import { useState, useEffect } from 'react'
import { Bitcoin } from 'lucide-react'
import { ApiKeyCard } from './api-key-card'

export function CoinbasePanel() {
  const [connected, setConnected] = useState(false)
  const [accountCount, setAccountCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const d = await fetch('/api/coinbase/credentials').then(r => r.json())
    setConnected(d.connected)
    setAccountCount(d.account_count ?? null)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  if (loading) return null

  return (
    <ApiKeyCard
      name="Coinbase"
      description="See your crypto wallet balances, recent transactions, and live spot prices for any coin."
      icon={<Bitcoin className="h-5 w-5 text-orange-500" />}
      connected={connected}
      statusText={accountCount !== null && accountCount > 0
        ? `${accountCount} wallet${accountCount !== 1 ? 's' : ''} with balance`
        : undefined}
      fields={[
        { name: 'api_key', label: 'API Key', placeholder: 'API Key' },
        { name: 'api_secret', label: 'API Secret', type: 'password' },
      ]}
      hint={<>Create keys at <strong>Coinbase → Settings → API → New API Key</strong>. Enable read permissions.</>}
      onSave={async (values) => {
        const res = await fetch('/api/coinbase/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: values.api_key, api_secret: values.api_secret }),
        })
        if (!res.ok) throw new Error('Failed')
        await refresh()
      }}
      onDisconnect={async () => {
        await fetch('/api/coinbase/credentials', { method: 'DELETE' })
        setConnected(false)
        setAccountCount(null)
      }}
    />
  )
}
