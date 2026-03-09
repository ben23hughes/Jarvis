'use client'

import useSWR from 'swr'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TimeBreakdownChart } from './time-breakdown-chart'
import Link from 'next/link'
import { Users, Brain, Bell, CalendarClock } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#6366f1',
  'No priority': '#94a3b8',
}

const WEEK_COLORS = { thisWeek: '#6366f1', lastWeek: '#c4b5fd' }

export function AnalyticsDashboard() {
  const { data, isLoading } = useSWR('/api/analytics/stats', fetcher, {
    revalidateOnFocus: false,
  })

  return (
    <div className="space-y-6">
      {/* DB stat cards — always available */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? (
          [1,2,3,4].map((i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <StatCard icon={<Users className="h-5 w-5" />} label="Contacts" value={data?.contacts ?? 0} href="/contacts" />
            <StatCard icon={<Brain className="h-5 w-5" />} label="Memories saved" value={data?.memories ?? 0} />
            <StatCard icon={<Bell className="h-5 w-5" />} label="Reminders sent" value={data?.remindersSent ?? 0} />
            <StatCard icon={<CalendarClock className="h-5 w-5" />} label="Active schedules" value={data?.activeSchedules ?? 0} href="/settings" />
          </>
        )}
      </div>

      {/* Meeting load: this week vs last week */}
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !data?.calendarConnected ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <Link href="/settings/integrations" className="underline">Connect Google Calendar</Link> to see meeting trends.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Meeting hours</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">This week vs last week</p>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-0.5">
                <p><span className="font-semibold text-foreground">{data.thisWeekHours}h</span> this week ({data.thisWeekMeetings} meetings)</p>
                <p><span className="font-semibold text-foreground">{data.lastWeekHours}h</span> last week ({data.lastWeekMeetings} meetings)</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.weekDays} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="h" />
                <Tooltip formatter={(v) => [`${v}h`, '']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="thisWeek" name="This week" fill={WEEK_COLORS.thisWeek} radius={[3, 3, 0, 0]} />
                <Bar dataKey="lastWeek" name="Last week" fill={WEEK_COLORS.lastWeek} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Linear issues by priority */}
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !data?.linearConnected ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <Link href="/settings/integrations" className="underline">Connect Linear</Link> to see issue breakdown.
          </CardContent>
        </Card>
      ) : data?.issuesByPriority?.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Open issues by priority
              <span className="ml-2 text-muted-foreground font-normal">({data.totalOpenIssues} total)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.issuesByPriority}
                  dataKey="count"
                  nameKey="priority"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {data.issuesByPriority.map((entry: { priority: string }, i: number) => (
                    <Cell key={i} fill={PRIORITY_COLORS[entry.priority] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No open issues assigned to you.
          </CardContent>
        </Card>
      )}

      {/* Time breakdown (existing) */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Time breakdown (last 30 days)</h2>
        <TimeBreakdownChart />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: number; href?: string }) {
  const inner = (
    <Card className={href ? 'hover:bg-accent/50 transition-colors cursor-pointer' : ''}>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}
