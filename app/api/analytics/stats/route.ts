import { createClient } from '@/lib/supabase/server'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { getEventsInRange } from '@/lib/integrations/google-calendar'
import { getMyIssues } from '@/lib/integrations/linear'
import { createClient as serviceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function weekBounds(weeksAgo: number) {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7) - weeksAgo * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

function eventHours(events: Array<{ start: string; end: string }>) {
  return events.reduce((sum, e) => {
    const h = (new Date(e.end).getTime() - new Date(e.start).getTime()) / 3600000
    return sum + Math.min(h, 8) // cap single events at 8h
  }, 0)
}

function dayLabel(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Denver' })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [calToken, linearToken] = await Promise.all([
    getOAuthToken(user.id, 'google_calendar'),
    getOAuthToken(user.id, 'linear'),
  ])

  const thisWeek = weekBounds(0)
  const lastWeek = weekBounds(1)

  const [
    thisWeekEvents,
    lastWeekEvents,
    issues,
    contactsRes,
    memoriesRes,
    remindersSentRes,
    schedulesRes,
  ] = await Promise.all([
    calToken ? getEventsInRange(user.id, thisWeek.start, thisWeek.end).catch(() => []) : Promise.resolve([]),
    calToken ? getEventsInRange(user.id, lastWeek.start, lastWeek.end).catch(() => []) : Promise.resolve([]),
    linearToken ? getMyIssues(user.id).catch(() => []) : Promise.resolve(null),
    db.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    db.from('memories').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    db.from('reminders').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'sent'),
    db.from('user_schedules').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('enabled', true),
  ])

  // Build per-day meeting hours for this week (Mon–Sun)
  const weekDays: { day: string; thisWeek: number; lastWeek: number }[] = []
  for (let i = 0; i < 7; i++) {
    const thisDay = new Date(thisWeek.start)
    thisDay.setDate(thisWeek.start.getDate() + i)
    const nextDay = new Date(thisDay)
    nextDay.setDate(thisDay.getDate() + 1)

    const lastDay = new Date(lastWeek.start)
    lastDay.setDate(lastWeek.start.getDate() + i)
    const nextLastDay = new Date(lastDay)
    nextLastDay.setDate(lastDay.getDate() + 1)

    const thisDayEvents = (thisWeekEvents as Array<{ start: string; end: string }>).filter(
      (e) => new Date(e.start) >= thisDay && new Date(e.start) < nextDay
    )
    const lastDayEvents = (lastWeekEvents as Array<{ start: string; end: string }>).filter(
      (e) => new Date(e.start) >= lastDay && new Date(e.start) < nextLastDay
    )

    weekDays.push({
      day: dayLabel(thisDay),
      thisWeek: Math.round(eventHours(thisDayEvents) * 10) / 10,
      lastWeek: Math.round(eventHours(lastDayEvents) * 10) / 10,
    })
  }

  // Linear issues by priority
  const PRIORITY_LABELS: Record<number, string> = { 0: 'No priority', 1: 'Urgent', 2: 'High', 3: 'Medium', 4: 'Low' }
  const issuesByPriority = issues
    ? [0, 1, 2, 3, 4].map((p) => ({
        priority: PRIORITY_LABELS[p],
        count: (issues as Array<{ priority: number }>).filter((i) => i.priority === p).length,
      })).filter((p) => p.count > 0)
    : null

  return NextResponse.json({
    // DB stats
    contacts: contactsRes.count ?? 0,
    memories: memoriesRes.count ?? 0,
    remindersSent: remindersSentRes.count ?? 0,
    activeSchedules: schedulesRes.count ?? 0,
    // Calendar
    calendarConnected: !!calToken,
    weekDays,
    thisWeekHours: Math.round(eventHours(thisWeekEvents as Array<{ start: string; end: string }>) * 10) / 10,
    lastWeekHours: Math.round(eventHours(lastWeekEvents as Array<{ start: string; end: string }>) * 10) / 10,
    thisWeekMeetings: (thisWeekEvents as unknown[]).length,
    lastWeekMeetings: (lastWeekEvents as unknown[]).length,
    // Linear
    linearConnected: !!linearToken,
    issuesByPriority,
    totalOpenIssues: issues ? (issues as unknown[]).length : null,
  })
}
