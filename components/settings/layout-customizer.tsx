'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LayoutConfig, DashboardLayout, AnalyticsLayout } from '@/lib/layout-config'
import {
  BarChart2, Bell, Calendar, CheckSquare, Mail,
  Hash, LayoutDashboard, TrendingUp, Clock, Users, ChevronDown,
} from 'lucide-react'

const DASHBOARD_ITEMS: { key: keyof DashboardLayout; label: string; description: string; icon: React.ReactNode }[] = [
  { key: 'quick_stats', label: 'Quick stats', description: 'Meetings today, open issues, reminders, contacts', icon: <BarChart2 className="h-4 w-4" /> },
  { key: 'calendar', label: 'Calendar', description: 'Upcoming events', icon: <Calendar className="h-4 w-4" /> },
  { key: 'email', label: 'Email', description: 'Recent Gmail messages', icon: <Mail className="h-4 w-4" /> },
  { key: 'slack', label: 'Slack', description: 'Recent channel activity', icon: <Hash className="h-4 w-4" /> },
  { key: 'linear', label: 'Linear', description: 'Open issues assigned to you', icon: <CheckSquare className="h-4 w-4" /> },
]

const ANALYTICS_ITEMS: { key: keyof AnalyticsLayout; label: string; description: string; icon: React.ReactNode }[] = [
  { key: 'db_stats', label: 'Jarvis stats', description: 'Contacts, memories, reminders, schedules', icon: <Bell className="h-4 w-4" /> },
  { key: 'meeting_load', label: 'Meeting load', description: 'This week vs last week hours', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'linear_breakdown', label: 'Issue breakdown', description: 'Open Linear issues by priority', icon: <CheckSquare className="h-4 w-4" /> },
  { key: 'time_breakdown', label: 'Time breakdown', description: '30-day event type chart', icon: <Clock className="h-4 w-4" /> },
]

interface Props {
  initialConfig: LayoutConfig
}

export function LayoutCustomizer({ initialConfig }: Props) {
  const [config, setConfig] = useState(initialConfig)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [open, setOpen] = useState<'dashboard' | 'analytics' | null>(null)

  async function toggle(page: 'dashboard' | 'analytics', key: string) {
    const updated: LayoutConfig = {
      ...config,
      [page]: { ...config[page], [key]: !config[page][key as keyof typeof config[typeof page]] },
    }
    setConfig(updated)
    setSaving(true)
    setSaved(false)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout_config: updated }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Customize layout</CardTitle>
          <span className="text-xs text-muted-foreground">
            {saving ? 'Saving…' : saved ? 'Saved ✓' : ''}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Choose what appears on your Dashboard and Analytics pages.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <Accordion
          title="Dashboard"
          icon={<LayoutDashboard className="h-4 w-4" />}
          open={open === 'dashboard'}
          onToggleOpen={() => setOpen(open === 'dashboard' ? null : 'dashboard')}
          items={DASHBOARD_ITEMS}
          values={config.dashboard}
          onToggle={(key) => toggle('dashboard', key)}
        />
        <Accordion
          title="Analytics"
          icon={<BarChart2 className="h-4 w-4" />}
          open={open === 'analytics'}
          onToggleOpen={() => setOpen(open === 'analytics' ? null : 'analytics')}
          items={ANALYTICS_ITEMS}
          values={config.analytics}
          onToggle={(key) => toggle('analytics', key)}
        />
      </CardContent>
    </Card>
  )
}

function Accordion<T extends Record<string, boolean>>({
  title, icon, open, onToggleOpen, items, values, onToggle,
}: {
  title: string
  icon: React.ReactNode
  open: boolean
  onToggleOpen: () => void
  items: { key: keyof T; label: string; description: string; icon: React.ReactNode }[]
  values: T
  onToggle: (key: string) => void
}) {
  const enabledCount = Object.values(values).filter(Boolean).length

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        onClick={onToggleOpen}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/40 transition-colors"
      >
        <span className="text-muted-foreground shrink-0">{icon}</span>
        <span className="flex-1 text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground mr-2">{enabledCount}/{items.length} shown</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t divide-y">
          {items.map(({ key, label, description, icon: itemIcon }) => {
            const enabled = values[key]
            return (
              <button
                key={String(key)}
                onClick={() => onToggle(String(key))}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
              >
                <span className="text-muted-foreground shrink-0">{itemIcon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${!enabled ? 'text-muted-foreground' : ''}`}>{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <div className={`h-5 w-9 rounded-full transition-colors shrink-0 relative ${enabled ? 'bg-primary' : 'bg-muted'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
