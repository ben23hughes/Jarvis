'use client'

import useSWR from 'swr'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe']

export function TimeBreakdownChart() {
  const { data, isLoading } = useSWR(
    '/api/integrations/google-calendar?days=30&max=50',
    fetcher,
    { revalidateOnFocus: false }
  )

  if (isLoading) return <Skeleton className="h-64 w-full" />

  if (!data?.connected) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <Link href="/settings/integrations" className="underline">Connect Google Calendar</Link> to see time analytics.
        </CardContent>
      </Card>
    )
  }

  // Group events by title keyword / first word
  const events = data.events ?? []
  const tally: Record<string, number> = {}

  for (const event of events) {
    const keyword = event.title.split(' ')[0] || 'Other'
    const duration =
      (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60)
    tally[keyword] = (tally[keyword] ?? 0) + duration
  }

  const chartData = Object.entries(tally)
    .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10)

  const totalHours = chartData.reduce((sum, d) => sum + d.hours, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">Total meeting time (30d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-xs text-muted-foreground">Events this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{(totalHours / 30).toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">Avg per day</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{chartData[0]?.name ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Top event type</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Time by event type (hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v}h`, 'Hours']} />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
