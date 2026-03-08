'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import type { UserSchedule, ScheduleFrequency, ScheduleChannel } from '@/lib/schedules'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FREQ_LABELS: Record<ScheduleFrequency, string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekdays: 'Weekdays (M–F)',
  weekly: 'Weekly',
}

function frequencySummary(s: UserSchedule) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const time = `${pad(s.hour)}:${pad(s.minute)} UTC`
  if (s.frequency === 'hourly') return `Every hour at :${pad(s.minute)}`
  if (s.frequency === 'weekly' && s.day_of_week !== null)
    return `Every ${DAYS[s.day_of_week]} at ${time}`
  return `${FREQ_LABELS[s.frequency]} at ${time}`
}

interface Props {
  initialSchedules: UserSchedule[]
}

export function SchedulesManager({ initialSchedules }: Props) {
  const [schedules, setSchedules] = useState(initialSchedules)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [frequency, setFrequency] = useState<ScheduleFrequency>('daily')
  const [hour, setHour] = useState(9)
  const [minute, setMinute] = useState(0)
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [channel, setChannel] = useState<ScheduleChannel>('sms')

  async function handleCreate() {
    if (!name.trim() || !prompt.trim()) return
    setSaving(true)
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, prompt, frequency, hour, minute,
        day_of_week: frequency === 'weekly' ? dayOfWeek : null,
        channel,
      }),
    })
    if (res.ok) {
      const s = await res.json()
      setSchedules((prev) => [s, ...prev])
      setAdding(false)
      setName(''); setPrompt('')
    }
    setSaving(false)
  }

  async function handleToggle(s: UserSchedule) {
    await fetch(`/api/schedules/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !s.enabled }),
    })
    setSchedules((prev) => prev.map((x) => x.id === s.id ? { ...x, enabled: !x.enabled } : x))
  }

  async function handleDelete(id: string) {
    await fetch(`/api/schedules/${id}`, { method: 'DELETE' })
    setSchedules((prev) => prev.filter((x) => x.id !== id))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Scheduled Tasks</CardTitle>
        <Button size="sm" onClick={() => setAdding((v) => !v)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          New
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Recurring tasks Jarvis runs automatically and sends you via SMS or email.
        </p>

        {adding && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input placeholder="e.g. Monday standup prep" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Deliver via</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as ScheduleChannel)}
                >
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>What should Jarvis do?</Label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                placeholder="e.g. Summarize my open Linear issues and any unread emails from today"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Frequency</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
                >
                  {Object.entries(FREQ_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {frequency !== 'hourly' && (
                <div className="space-y-1">
                  <Label>Time (UTC)</Label>
                  <div className="flex gap-1 items-center">
                    <Input
                      type="number" min={0} max={23}
                      className="w-16"
                      value={hour}
                      onChange={(e) => setHour(Number(e.target.value))}
                    />
                    <span className="text-sm">:</span>
                    <Input
                      type="number" min={0} max={59} step={5}
                      className="w-16"
                      value={minute}
                      onChange={(e) => setMinute(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {frequency === 'hourly' && (
                <div className="space-y-1">
                  <Label>At minute</Label>
                  <Input
                    type="number" min={0} max={59}
                    className="w-24"
                    value={minute}
                    onChange={(e) => setMinute(Number(e.target.value))}
                  />
                </div>
              )}

              {frequency === 'weekly' && (
                <div className="space-y-1">
                  <Label>Day</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  >
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}

        {schedules.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground text-center py-4">No scheduled tasks yet.</p>
        )}

        <div className="space-y-2">
          {schedules.map((s) => (
            <div key={s.id} className="flex items-start justify-between rounded-lg border p-3 gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{s.name}</span>
                  <Badge variant={s.enabled ? 'default' : 'secondary'} className="text-xs">
                    {s.enabled ? 'Active' : 'Paused'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{s.channel.toUpperCase()}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{frequencySummary(s)}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">{s.prompt}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggle(s)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  title={s.enabled ? 'Pause' : 'Resume'}
                >
                  {s.enabled
                    ? <ToggleRight className="h-4 w-4 text-primary" />
                    : <ToggleLeft className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
