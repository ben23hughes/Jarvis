import { createClient } from '@/lib/supabase/server'
import { getUpcomingEvents } from '@/lib/integrations/google-calendar'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getOAuthToken(user.id, 'google_calendar')
  if (!token) return NextResponse.json({ connected: false })

  try {
    const events = await getUpcomingEvents(user.id, 7, 5)
    return NextResponse.json({ connected: true, events })
  } catch (err) {
    console.error('Calendar fetch error:', err)
    return NextResponse.json({ connected: true, events: [], error: 'Failed to fetch events' })
  }
}
