'use client'

import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import { ApiKeyCard } from './api-key-card'
import { Label } from '@/components/ui/label'

export function AlpacaPanel() {
  const [connected, setConnected] = useState(false)
  const [accountValue, setAccountValue] = useState<string | null>(null)
  const [paper, setPaper] = useState(false)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const d = await fetch('/api/alpaca/credentials').then(r => r.json())
    setConnected(d.connected)
    setAccountValue(d.account_value ?? null)
    setPaper(d.paper ?? false)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  if (loading) return null

  return (
    <ApiKeyCard
      name="Alpaca Markets"
      description="Track your stock portfolio — positions, account value, and order history. Paper or live trading."
      icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
      connected={connected}
      statusText={accountValue ? `${accountValue}${paper ? ' (Paper)' : ' (Live)'}` : undefined}
      fields={[
        { name: 'key_id', label: 'API Key ID', placeholder: 'PK...' },
        { name: 'secret_key', label: 'Secret Key', type: 'password' },
      ]}
      hint={<>Get your keys at <strong>alpaca.markets → Account → API Keys</strong>.</>}
      extraContent={
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={paper}
            onChange={e => setPaper(e.target.checked)}
            className="rounded"
          />
          <Label className="text-xs font-normal cursor-pointer">Paper trading account (not live money)</Label>
        </label>
      }
      onSave={async (values) => {
        const res = await fetch('/api/alpaca/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key_id: values.key_id, secret_key: values.secret_key, paper }),
        })
        if (!res.ok) throw new Error('Failed')
        await refresh()
      }}
      onDisconnect={async () => {
        await fetch('/api/alpaca/credentials', { method: 'DELETE' })
        setConnected(false)
        setAccountValue(null)
      }}
    />
  )
}
