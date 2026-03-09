'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Trash2, ToggleLeft, ToggleRight, Plus, Sparkles,
  CalendarDays, Mail, MessageSquare, CheckSquare,
  GitPullRequest, BarChart2, Globe, Pencil,
} from 'lucide-react'
import type { UserSchedule, ScheduleFrequency, ScheduleChannel } from '@/lib/schedules'

// ── Presets ──────────────────────────────────────────────────────────────────

interface Preset {
  id: string
  name: string
  description: string
  prompt: string
  icon: React.ReactNode
  category: string
  defaultFrequency: ScheduleFrequency
  defaultHour: number
  defaultMinute: number
  defaultDayOfWeek?: number
  defaultChannel: ScheduleChannel
}

const PRESETS: Preset[] = [
  // Work
  {
    id: 'standup',
    name: 'Daily standup prep',
    description: 'Your Linear issues + meetings for the day, ready before standup.',
    prompt: 'Pull my open Linear issues and today\'s calendar events. Give me a short standup-ready summary: what I worked on, what I\'m working on today, and any blockers.',
    icon: <CheckSquare className="h-5 w-5" />,
    category: 'Work',
    defaultFrequency: 'weekdays',
    defaultHour: 8,
    defaultMinute: 30,
    defaultChannel: 'sms',
  },
  {
    id: 'weekly-review',
    name: 'Weekly review',
    description: 'A full wrap-up of the week — issues closed, emails, highlights.',
    prompt: 'Give me a weekly review. Summarize my Linear issues (completed and still open), any important emails from this week, and key calendar events. End with 2-3 things to focus on next week.',
    icon: <BarChart2 className="h-5 w-5" />,
    category: 'Work',
    defaultFrequency: 'weekly',
    defaultHour: 16,
    defaultMinute: 0,
    defaultDayOfWeek: 5, // Friday
    defaultChannel: 'email',
  },
  {
    id: 'pr-queue',
    name: 'PR review queue',
    description: 'Open pull requests that need your attention.',
    prompt: 'List all open GitHub pull requests assigned to me or requesting my review. Include the repo, title, and how long they\'ve been open. Flag anything urgent.',
    icon: <GitPullRequest className="h-5 w-5" />,
    category: 'Work',
    defaultFrequency: 'weekdays',
    defaultHour: 9,
    defaultMinute: 0,
    defaultChannel: 'sms',
  },
  {
    id: 'linear-triage',
    name: 'Linear triage',
    description: 'Flags unassigned or overdue issues in your team\'s backlog.',
    prompt: 'Check my Linear issues. Flag anything that is overdue, unestimated, or hasn\'t been updated in over a week. Keep it brief — just the ones that need attention.',
    icon: <CheckSquare className="h-5 w-5" />,
    category: 'Work',
    defaultFrequency: 'weekly',
    defaultHour: 9,
    defaultMinute: 0,
    defaultDayOfWeek: 1, // Monday
    defaultChannel: 'sms',
  },
  // Communication
  {
    id: 'inbox-digest',
    name: 'Inbox digest',
    description: 'A quick summary of emails that need a reply.',
    prompt: 'Check my Gmail inbox. Summarize any emails from the last 24 hours that need a reply or action from me. Skip newsletters and automated emails.',
    icon: <Mail className="h-5 w-5" />,
    category: 'Communication',
    defaultFrequency: 'weekdays',
    defaultHour: 8,
    defaultMinute: 0,
    defaultChannel: 'sms',
  },
  {
    id: 'slack-digest',
    name: 'Slack digest',
    description: 'Surface important Slack messages you may have missed.',
    prompt: 'Scan my recent Slack messages. Summarize any threads that mention me directly or seem urgent. Skip general chatter.',
    icon: <MessageSquare className="h-5 w-5" />,
    category: 'Communication',
    defaultFrequency: 'weekdays',
    defaultHour: 9,
    defaultMinute: 0,
    defaultChannel: 'sms',
  },
  // Calendar
  {
    id: 'week-ahead',
    name: 'Week ahead preview',
    description: 'Sunday evening look at what\'s coming up next week.',
    prompt: 'Look at my calendar for the coming week. Give me a heads up on key meetings, busy days, and anything I should prepare for. Keep it brief.',
    icon: <CalendarDays className="h-5 w-5" />,
    category: 'Calendar',
    defaultFrequency: 'weekly',
    defaultHour: 18,
    defaultMinute: 0,
    defaultDayOfWeek: 0, // Sunday
    defaultChannel: 'sms',
  },
  {
    id: 'busy-days',
    name: 'Light vs heavy day check',
    description: 'Know whether today is packed or open before you plan.',
    prompt: 'How does my day look today? Count my meetings, calculate total hours in meetings, and tell me how much focus time I have. Give me one sentence on how to approach today.',
    icon: <CalendarDays className="h-5 w-5" />,
    category: 'Calendar',
    defaultFrequency: 'weekdays',
    defaultHour: 7,
    defaultMinute: 30,
    defaultChannel: 'sms',
  },
  // Research
  {
    id: 'news-digest',
    name: 'Industry news digest',
    description: 'A daily brief on topics you care about.',
    prompt: 'Search the web for the latest news on AI, software engineering, and startups from the last 24 hours. Give me 3-5 highlights worth knowing about.',
    icon: <Globe className="h-5 w-5" />,
    category: 'Research',
    defaultFrequency: 'weekdays',
    defaultHour: 7,
    defaultMinute: 0,
    defaultChannel: 'email',
  },
]

const CATEGORIES = ['Work', 'Communication', 'Calendar', 'Research']

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FREQ_LABELS: Record<ScheduleFrequency, string> = {
  hourly: 'Hourly', daily: 'Daily', weekdays: 'Weekdays (M–F)', weekly: 'Weekly',
}

function frequencySummary(s: UserSchedule) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const time = `${pad(s.hour)}:${pad(s.minute)} MST`
  if (s.frequency === 'hourly') return `Every hour at :${pad(s.minute)}`
  if (s.frequency === 'weekly' && s.day_of_week !== null) return `Every ${DAYS[s.day_of_week]} at ${time}`
  return `${FREQ_LABELS[s.frequency]} at ${time}`
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props { initialSchedules: UserSchedule[] }

type FormState = {
  name: string; prompt: string; frequency: ScheduleFrequency
  hour: number; minute: number; dayOfWeek: number; channel: ScheduleChannel
}

const DEFAULT_FORM: FormState = {
  name: '', prompt: '', frequency: 'daily', hour: 9, minute: 0, dayOfWeek: 1, channel: 'sms',
}

export function SchedulesManager({ initialSchedules }: Props) {
  const [schedules, setSchedules] = useState(initialSchedules)
  const [mode, setMode] = useState<'browse' | 'form'>('browse')
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

  function openPreset(preset: Preset) {
    setForm({
      name: preset.name,
      prompt: preset.prompt,
      frequency: preset.defaultFrequency,
      hour: preset.defaultHour,
      minute: preset.defaultMinute,
      dayOfWeek: preset.defaultDayOfWeek ?? 1,
      channel: preset.defaultChannel,
    })
    setMode('form')
  }

  function openCustom() {
    setForm(DEFAULT_FORM)
    setMode('form')
  }

  async function handleSave() {
    if (!form.name.trim() || !form.prompt.trim()) return
    setSaving(true)
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, prompt: form.prompt, frequency: form.frequency,
        hour: form.hour, minute: form.minute,
        day_of_week: form.frequency === 'weekly' ? form.dayOfWeek : null,
        channel: form.channel,
      }),
    })
    if (res.ok) {
      const created = await res.json()
      setSchedules((prev) => [created, ...prev])
      setMode('browse')
      setForm(DEFAULT_FORM)
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Scheduled Tasks</h2>
        <p className="text-sm text-muted-foreground">
          Jarvis runs these automatically and delivers the result via SMS or email.
        </p>
      </div>

      {/* ── Active schedules ── */}
      {schedules.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active</p>
          {schedules.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-xs text-muted-foreground">{frequencySummary(s)} · {s.channel.toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant={s.enabled ? 'default' : 'secondary'} className="text-xs mr-1">
                  {s.enabled ? 'On' : 'Paused'}
                </Badge>
                <button onClick={() => handleToggle(s)} className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                  {s.enabled ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add form ── */}
      {mode === 'form' && (
        <div className="rounded-lg border p-5 space-y-4">
          <p className="text-sm font-medium">Configure schedule</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Monday standup prep" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>What should Jarvis do?</Label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                value={form.prompt}
                onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
                placeholder="Describe what Jarvis should do each time this runs…"
              />
            </div>
            <div className="space-y-1">
              <Label>Frequency</Label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.frequency}
                onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value as ScheduleFrequency }))}>
                {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Deliver via</Label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.channel}
                onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value as ScheduleChannel }))}>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </div>
            {form.frequency !== 'hourly' && (
              <div className="space-y-1">
                <Label>Time (MST)</Label>
                <div className="flex gap-1 items-center">
                  <Input type="number" min={0} max={23} className="w-16" value={form.hour}
                    onChange={(e) => setForm((p) => ({ ...p, hour: Number(e.target.value) }))} />
                  <span className="text-sm">:</span>
                  <Input type="number" min={0} max={59} step={5} className="w-16" value={form.minute}
                    onChange={(e) => setForm((p) => ({ ...p, minute: Number(e.target.value) }))} />
                </div>
              </div>
            )}
            {form.frequency === 'weekly' && (
              <div className="space-y-1">
                <Label>Day</Label>
                <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.dayOfWeek}
                  onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: Number(e.target.value) }))}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={() => setMode('browse')}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save schedule'}</Button>
          </div>
        </div>
      )}

      {/* ── Preset grid ── */}
      {mode === 'browse' && (
        <div className="space-y-5">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{cat}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {PRESETS.filter((p) => p.category === cat).map((preset) => {
                  const alreadyAdded = schedules.some((s) => s.name === preset.name)
                  return (
                    <button
                      key={preset.id}
                      onClick={() => !alreadyAdded && openPreset(preset)}
                      disabled={alreadyAdded}
                      className={`text-left rounded-lg border p-4 transition-colors space-y-1.5 ${
                        alreadyAdded
                          ? 'opacity-50 cursor-default bg-muted/30'
                          : 'hover:bg-accent/50 hover:border-accent-foreground/20 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span className="text-muted-foreground">{preset.icon}</span>
                          {preset.name}
                        </div>
                        {alreadyAdded
                          ? <Badge variant="secondary" className="text-xs">Added</Badge>
                          : <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{preset.description}</p>
                      <p className="text-xs text-muted-foreground/60">
                        {FREQ_LABELS[preset.defaultFrequency]}
                        {preset.defaultDayOfWeek !== undefined ? ` · ${DAYS[preset.defaultDayOfWeek]}s` : ''}
                        {` · ${preset.defaultHour}:${String(preset.defaultMinute).padStart(2,'0')} MST`}
                        {` · ${preset.defaultChannel.toUpperCase()}`}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Custom */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Custom</p>
            <button
              onClick={openCustom}
              className="w-full text-left rounded-lg border border-dashed p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                Build your own
                <Plus className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Write any prompt — Jarvis can use any connected integration on any schedule.
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
