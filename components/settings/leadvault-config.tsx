'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, ChevronDown, ChevronUp, Check, RefreshCw } from 'lucide-react'

const CANONICAL_COLUMNS = [
  { key: 'state', label: 'State', placeholder: 'e.g. state' },
  { key: 'city', label: 'City', placeholder: 'e.g. city' },
  { key: 'company', label: 'Company name', placeholder: 'e.g. company_name' },
  { key: 'email', label: 'Email', placeholder: 'e.g. email' },
  { key: 'phone', label: 'Phone', placeholder: 'e.g. phone' },
  { key: 'name', label: 'Contact name', placeholder: 'e.g. contact_name' },
  { key: 'industry', label: 'Industry', placeholder: 'e.g. industry' },
  { key: 'address', label: 'Address', placeholder: 'e.g. address' },
  { key: 'zip', label: 'Zip code', placeholder: 'e.g. zip' },
]

interface Props {
  configured: boolean
}

interface ColumnMap {
  [key: string]: string
}

export function LeadVaultConfig({ configured: initialConfigured }: Props) {
  const [configured, setConfigured] = useState(initialConfigured)
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [table, setTable] = useState('leads')
  const [columns, setColumns] = useState<ColumnMap>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [detectedCols, setDetectedCols] = useState<string[]>([])

  async function save() {
    setSaving(true)
    setError('')
    const res = await fetch('/api/leadvault/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, anon_key: key, table, columns }),
    })
    setSaving(false)
    if (res.ok) {
      setConfigured(true)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Save failed')
    }
  }

  async function detectColumns() {
    if (!url || !key || !table) {
      setError('Enter URL, key, and table name first')
      return
    }
    // Temporarily save config so the server can use it
    await fetch('/api/leadvault/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, anon_key: key, table, columns }),
    })
    setDetecting(true)
    setError('')
    const res = await fetch('/api/leadvault/sample')
    setDetecting(false)
    if (res.ok) {
      const data = await res.json()
      setDetectedCols(data.columns ?? [])
    } else {
      const data = await res.json()
      setError(data.error ?? 'Could not connect to LeadVault database')
    }
  }

  function setCol(canonical: string, value: string) {
    setColumns((prev) => ({ ...prev, [canonical]: value }))
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-3 w-full text-left"
        >
          <Database className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 text-base font-semibold">LeadVault</span>
          <span className="text-xs text-muted-foreground mr-2">
            {configured ? 'Connected' : 'Not configured'}
          </span>
          {configured && <span className="h-2 w-2 rounded-full bg-green-500 mr-1" />}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
      </CardHeader>

      {open && (
        <CardContent className="space-y-5 pt-0">
          <p className="text-sm text-muted-foreground">
            Connect your LeadVault Supabase database so Jarvis can count, search, and export leads for you.
          </p>

          {/* Connection */}
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Connection</p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Supabase Project URL</label>
              <input
                type="url"
                placeholder="https://xxxxxxxxxxxx.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">API Key (anon or service role)</label>
              <input
                type="password"
                placeholder="eyJ..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Use the <strong>service role key</strong> for full read access, or the anon key if you have RLS set up.
                This is stored securely on your account.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Leads table name</label>
              <input
                type="text"
                placeholder="leads"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
              />
            </div>

            <button
              onClick={detectColumns}
              disabled={detecting}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${detecting ? 'animate-spin' : ''}`} />
              {detecting ? 'Connecting…' : 'Detect columns from database'}
            </button>

            {detectedCols.length > 0 && (
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Columns found in your table:</p>
                <div className="flex flex-wrap gap-1.5">
                  {detectedCols.map((col) => (
                    <code key={col} className="text-xs bg-background border rounded px-1.5 py-0.5">{col}</code>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column mapping */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Column mapping</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tell Jarvis which column in your table maps to each concept. Leave blank to use the default name.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CANONICAL_COLUMNS.map(({ key: canonical, label, placeholder }) => (
                <div key={canonical} className="flex items-center gap-2">
                  <label className="text-sm w-28 shrink-0 text-muted-foreground">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={columns[canonical] ?? ''}
                    onChange={(e) => setCol(canonical, e.target.value)}
                    list={`cols-${canonical}`}
                    className="flex-1 rounded border bg-background px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {detectedCols.length > 0 && (
                    <datalist id={`cols-${canonical}`}>
                      {detectedCols.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving || !url || !key || !table}
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saved ? <Check className="h-4 w-4" /> : null}
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save connection'}
            </button>
            {configured && !saving && !saved && (
              <span className="text-xs text-muted-foreground">Currently connected — update credentials above to change.</span>
            )}
          </div>

          {/* Example queries */}
          <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground text-sm">Once connected, you can say things like:</p>
            <p>• "How many leads do we have in Utah?"</p>
            <p>• "Email me all construction companies in Texas as a CSV"</p>
            <p>• "Show me 10 leads in Denver"</p>
            <p>• "Export all leads in the 84101 zip code to me"</p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
