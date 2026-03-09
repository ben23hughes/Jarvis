'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, RefreshCw, X, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

// Parse response safely — handles non-JSON error bodies (e.g. 413 Request Entity Too Large)
async function parseResponse(res: Response): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const text = await res.text()
  try {
    return { ok: res.ok, data: JSON.parse(text) }
  } catch {
    throw new Error(res.ok ? 'Unexpected server response' : `Server error (${res.status}): ${text.slice(0, 120)}`)
  }
}

// Strip binary fields (photos, sounds) from vCard text in the browser before upload.
// Apple Contacts exports embed base64 photos that can be 50MB+ — we don't need them.
function stripVCardBinaryFields(text: string): string {
  const lines = text.split(/\r?\n/)
  const result: string[] = []
  let skipping = false
  for (const line of lines) {
    const isContinuation = line.startsWith(' ') || line.startsWith('\t')
    if (skipping && isContinuation) continue
    skipping = false
    if (/^(PHOTO|SOUND|LOGO|KEY|X-ABCROP)[;:]/i.test(line)) { skipping = true; continue }
    result.push(line)
  }
  return result.join('\n')
}

type Tab = 'vcf' | 'google' | 'icloud'

export function ImportSyncPanel({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('vcf')
  const [loading, setLoading] = useState(false)

  // vCard
  const vcfRef = useRef<HTMLInputElement>(null)

  // iCloud
  const [appleId, setAppleId] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [savedAppleId, setSavedAppleId] = useState<string | null>(null)

  useEffect(() => {
    if (open && tab === 'icloud') loadCardDavStatus()
  }, [open, tab])

  async function loadCardDavStatus() {
    const res = await fetch('/api/contacts/carddav-credentials')
    const data = await res.json()
    if (data.connected) setSavedAppleId(data.apple_id)
  }

  // ── vCard ──────────────────────────────────────────────────────────────────

  async function handleVcf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      // Read and strip photos client-side so we never hit the body size limit
      const raw = await file.text()
      const stripped = stripVCardBinaryFields(raw)
      const res = await fetch('/api/contacts/import-vcf', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: stripped,
      })
      const { ok, data } = await parseResponse(res)
      if (!ok) throw new Error((data.error as string) ?? 'Import failed')
      toast.success(`Imported ${data.upserted} contacts${data.skipped ? ` (${data.skipped} skipped)` : ''}`)
      onImported()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
      if (vcfRef.current) vcfRef.current.value = ''
    }
  }

  // ── CSV ────────────────────────────────────────────────────────────────────

  const csvRef = useRef<HTMLInputElement>(null)

  async function handleCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/contacts/import', { method: 'POST', body: formData })
      const { ok, data } = await parseResponse(res)
      if (!ok) throw new Error((data.error as string) ?? 'Import failed')
      toast.success(`Imported ${data.imported} contacts${data.skipped ? ` (${data.skipped} skipped)` : ''}`)
      onImported()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
      if (csvRef.current) csvRef.current.value = ''
    }
  }

  // ── Google ─────────────────────────────────────────────────────────────────

  async function handleGoogleSync() {
    setLoading(true)
    try {
      const res = await fetch('/api/contacts/sync-google', { method: 'POST' })
      const { ok, data } = await parseResponse(res)
      if (!ok) throw new Error((data.error as string) ?? 'Sync failed')
      toast.success(`Synced ${data.upserted} contacts${data.skipped ? ` (${data.skipped} skipped)` : ''}`)
      onImported()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  // ── iCloud ─────────────────────────────────────────────────────────────────

  async function handleSaveCardDav(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/contacts/carddav-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apple_id: appleId, app_specific_password: appPassword }),
      })
      if (!res.ok) throw new Error('Failed to save credentials')
      setSavedAppleId(appleId)
      setAppPassword('')
      toast.success('iCloud credentials saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  async function handleCardDavSync() {
    setLoading(true)
    try {
      const res = await fetch('/api/contacts/sync-carddav', { method: 'POST' })
      const { ok, data } = await parseResponse(res)
      if (!ok) throw new Error((data.error as string) ?? 'Sync failed')
      toast.success(`Synced ${data.upserted} contacts${data.skipped ? ` (${data.skipped} skipped)` : ''}`)
      onImported()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveCardDav() {
    await fetch('/api/contacts/carddav-credentials', { method: 'DELETE' })
    setSavedAppleId(null)
    setAppleId('')
    toast.success('iCloud credentials removed')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string }[] = [
    { id: 'vcf', label: 'vCard / CSV' },
    { id: 'google', label: 'Google Contacts' },
    { id: 'icloud', label: 'iCloud' },
  ]

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        <Upload className="mr-2 h-4 w-4" />
        Import / Sync
        <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute left-0 top-10 z-20 w-96 rounded-lg border bg-background shadow-lg">
          {/* Tab bar */}
          <div className="flex border-b">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  tab === t.id
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* vCard / CSV tab */}
            {tab === 'vcf' && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Import vCard (.vcf)</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Export from Apple Contacts: select all → File → Export → Export vCard
                  </p>
                  <input ref={vcfRef} type="file" accept=".vcf,.vcard" className="hidden" onChange={handleVcf} />
                  <Button size="sm" variant="outline" onClick={() => vcfRef.current?.click()} disabled={loading} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose vCard file
                  </Button>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-1">Import CSV</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Columns: first_name, last_name, email, phone, company, title
                  </p>
                  <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsv} />
                  <Button size="sm" variant="outline" onClick={() => csvRef.current?.click()} disabled={loading} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose CSV file
                  </Button>
                </div>
              </div>
            )}

            {/* Google Contacts tab */}
            {tab === 'google' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Syncs contacts from your Google account. Requires Google to be connected in{' '}
                  <a href="/settings/integrations" className="underline">Settings → Integrations</a>.
                </p>
                <p className="text-xs text-muted-foreground">
                  Note: if you connected Google before this feature was added, reconnect to grant the contacts permission.
                </p>
                <Button size="sm" onClick={handleGoogleSync} disabled={loading} className="w-full">
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Syncing...' : 'Sync Google Contacts'}
                </Button>
              </div>
            )}

            {/* iCloud tab */}
            {tab === 'icloud' && (
              <div className="space-y-3">
                {savedAppleId ? (
                  <>
                    <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                      <div>
                        <p className="text-xs font-medium">Connected</p>
                        <p className="text-xs text-muted-foreground">{savedAppleId}</p>
                      </div>
                      <button
                        onClick={handleRemoveCardDav}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <Button size="sm" onClick={handleCardDavSync} disabled={loading} className="w-full">
                      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      {loading ? 'Syncing...' : 'Sync iCloud Contacts'}
                    </Button>
                  </>
                ) : (
                  <form onSubmit={handleSaveCardDav} className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Requires an{' '}
                      <a
                        href="https://appleid.apple.com/account/manage"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        app-specific password
                      </a>{' '}
                      — generate one at appleid.apple.com under Sign-In and Security.
                    </p>
                    <div className="space-y-2">
                      <Label className="text-xs">Apple ID (email)</Label>
                      <Input
                        type="email"
                        placeholder="you@icloud.com"
                        value={appleId}
                        onChange={(e) => setAppleId(e.target.value)}
                        required
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">App-Specific Password</Label>
                      <Input
                        type="password"
                        placeholder="xxxx-xxxx-xxxx-xxxx"
                        value={appPassword}
                        onChange={(e) => setAppPassword(e.target.value)}
                        required
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                    <Button type="submit" size="sm" disabled={loading} className="w-full">
                      {loading ? 'Saving...' : 'Save & Connect'}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
