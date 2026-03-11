'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export interface ApiKeyField {
  name: string
  label: string
  placeholder?: string
  type?: 'text' | 'password'
}

interface ApiKeyCardProps {
  name: string
  description: string
  icon: React.ReactNode
  connected: boolean
  statusText?: string
  fields: ApiKeyField[]
  onSave: (values: Record<string, string>) => Promise<void>
  onDisconnect: () => Promise<void>
  hint?: React.ReactNode
  extraContent?: React.ReactNode
}

export function ApiKeyCard({
  name,
  description,
  icon,
  connected,
  statusText,
  fields,
  onSave,
  onDisconnect,
  hint,
  extraContent,
}: ApiKeyCardProps) {
  const [showForm, setShowForm] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleSave() {
    const allFilled = fields.every(f => values[f.name]?.trim())
    if (!allFilled) return
    setSaving(true)
    try {
      await onSave(values)
      setShowForm(false)
      setValues({})
      toast.success(`${name} connected`)
    } catch {
      toast.error(`Failed to connect ${name}`)
    }
    setSaving(false)
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await onDisconnect()
      toast.success(`Disconnected ${name}`)
    } catch {
      toast.error(`Failed to disconnect ${name}`)
    }
    setDisconnecting(false)
  }

  const canSave = fields.every(f => values[f.name]?.trim())

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              {connected && statusText && (
                <p className="text-xs text-muted-foreground">{statusText}</p>
              )}
            </div>
          </div>
          <Badge variant={connected ? 'default' : 'secondary'}>
            {connected ? 'Connected' : 'Not connected'}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {connected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        ) : showForm ? (
          <div className="space-y-3">
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {fields.map(field => (
              <div key={field.name} className="space-y-1">
                <Label className="text-xs">{field.label}</Label>
                <Input
                  placeholder={field.placeholder ?? field.label}
                  type={field.type ?? 'text'}
                  value={values[field.name] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                  autoComplete="off"
                />
              </div>
            ))}
            {extraContent}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving || !canSave}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setValues({}) }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" onClick={() => setShowForm(true)}>Connect</Button>
        )}
      </CardContent>
    </Card>
  )
}
