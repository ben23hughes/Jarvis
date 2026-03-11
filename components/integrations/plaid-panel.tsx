'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Banknote, CheckCircle2, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

declare global {
  interface Window {
    Plaid: {
      create: (config: {
        token: string
        onSuccess: (publicToken: string, metadata: { institution?: { name: string } }) => void
        onExit: (err: unknown) => void
      }) => { open: () => void }
    }
  }
}

export function PlaidPanel() {
  const [institutions, setInstitutions] = useState<string[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    const existing = document.getElementById('plaid-link-script')
    if (existing) { setScriptLoaded(true); return }
    const script = document.createElement('script')
    script.id = 'plaid-link-script'
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'
    script.onload = () => setScriptLoaded(true)
    document.head.appendChild(script)
  }, [])

  const fetchStatus = useCallback(async () => {
    const data = await fetch('/api/plaid/status').then(r => r.json())
    setConnected(data.connected)
    setInstitutions(data.institutions ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  async function handleConnect() {
    if (!scriptLoaded) { toast.error('Plaid is still loading, please try again.'); return }
    setLinking(true)
    try {
      const res = await fetch('/api/plaid/link-token', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to create link token'); setLinking(false); return }

      const handler = window.Plaid.create({
        token: data.link_token,
        onSuccess: async (publicToken, metadata) => {
          const institutionName = metadata.institution?.name ?? 'Bank'
          const exchangeRes = await fetch('/api/plaid/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicToken, institutionName }),
          })
          if (exchangeRes.ok) {
            toast.success(`${institutionName} connected!`)
            await fetchStatus()
          } else {
            toast.error('Failed to connect bank account')
          }
          setLinking(false)
        },
        onExit: (err) => {
          if (err) console.error('Plaid exit error:', err)
          setLinking(false)
        },
      })
      handler.open()
    } catch (err) {
      console.error('Plaid link error:', err)
      toast.error('Failed to open bank connection')
      setLinking(false)
    }
  }

  if (loading) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
              <Banknote className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base">Plaid (Banking)</CardTitle>
              {connected && institutions.length > 0 && (
                <p className="text-xs text-muted-foreground">{institutions.join(', ')}</p>
              )}
            </div>
          </div>
          <Badge variant={connected ? 'default' : 'secondary'}>
            {connected ? `${institutions.length} bank${institutions.length !== 1 ? 's' : ''}` : 'Not connected'}
          </Badge>
        </div>
        <CardDescription>
          Connect your bank accounts to let Jarvis view balances and transactions. Powered by Plaid.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button size="sm" onClick={handleConnect} disabled={linking}>
          {linking
            ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Connecting…</>
            : <><Plus className="h-3 w-3 mr-1" />{connected ? 'Add another bank' : 'Connect a bank'}</>}
        </Button>
        {connected && institutions.length > 0 && (
          <ul className="space-y-1 border-t pt-2">
            {institutions.map((name) => (
              <li key={name} className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {name}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
