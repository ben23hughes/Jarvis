'use client'

import useSWR from 'swr'
import { Calendar, CheckSquare, Bell, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  href?: string
  muted?: boolean
}

function StatCard({ icon, label, value, href, muted }: StatCardProps) {
  const content = (
    <Card className={href ? 'hover:bg-accent/50 transition-colors cursor-pointer' : ''}>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className={`text-2xl font-bold ${muted ? 'text-muted-foreground' : ''}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export function QuickStats() {
  const { data, isLoading } = useSWR('/api/dashboard/stats', fetcher, {
    refreshInterval: 120000,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={<Calendar className="h-5 w-5" />}
        label="Meetings today"
        value={data?.calendarConnected ? (data.meetingsToday ?? 0) : '—'}
        muted={!data?.calendarConnected}
        href={data?.calendarConnected ? undefined : '/settings/integrations'}
      />
      <StatCard
        icon={<CheckSquare className="h-5 w-5" />}
        label="Open issues"
        value={data?.linearConnected ? (data.openIssues ?? 0) : '—'}
        muted={!data?.linearConnected}
        href={data?.linearConnected ? undefined : '/settings/integrations'}
      />
      <StatCard
        icon={<Bell className="h-5 w-5" />}
        label="Pending reminders"
        value={data?.pendingReminders ?? 0}
      />
      <StatCard
        icon={<Users className="h-5 w-5" />}
        label="Contacts"
        value={data?.contacts ?? 0}
        href="/contacts"
      />
    </div>
  )
}
