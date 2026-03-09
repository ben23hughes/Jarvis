import { createClient } from '@/lib/supabase/server'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { getUpcomingEvents } from '@/lib/integrations/google-calendar'
import { getMyIssues } from '@/lib/integrations/linear'
import { createClient as serviceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
function endOfToday() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
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

  const todayStart = startOfToday()
  const todayEnd = endOfToday()

  const [eventsResult, issuesResult, remindersResult, contactsResult] = await Promise.all([
    calToken
      ? getUpcomingEvents(user.id, 1, 20).catch(() => [])
      : Promise.resolve(null),
    linearToken
      ? getMyIssues(user.id).catch(() => [])
      : Promise.resolve(null),
    db.from('reminders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending'),
    db.from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  // Filter calendar events to today only
  const meetingsToday = eventsResult
    ? (eventsResult as Array<{ start: string }>).filter((e) => {
        const t = new Date(e.start).getTime()
        return t >= todayStart.getTime() && t <= todayEnd.getTime()
      }).length
    : null

  return NextResponse.json({
    meetingsToday,
    calendarConnected: !!calToken,
    openIssues: issuesResult ? (issuesResult as unknown[]).length : null,
    linearConnected: !!linearToken,
    pendingReminders: remindersResult.count ?? 0,
    contacts: contactsResult.count ?? 0,
  })
}
