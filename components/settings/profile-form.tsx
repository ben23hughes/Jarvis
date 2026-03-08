'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface ProfileFormProps {
  initialName: string
  initialPhone: string
}

export function ProfileForm({ initialName, initialPhone }: ProfileFormProps) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, phone_number: phone }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Full name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">
          Phone number (for SMS reminders & briefings)
        </label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 000 0000"
          type="tel"
        />
      </div>
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  )
}
