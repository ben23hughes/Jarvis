import { validateCronRequest } from '@/lib/cron/auth'
import { generateDailyBriefing } from '@/lib/cron/briefing'
import { sendSmsToUser } from '@/lib/twilio'
import { getUpcomingEvents } from '@/lib/integrations/google-calendar'
import { getRecentEmails } from '@/lib/integrations/gmail'
import { getMyIssues } from '@/lib/integrations/linear'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  if (!validateCronRequest(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all users with a phone number
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone_number')
    .not('phone_number', 'is', null)

  const results = { sent: 0, failed: 0 }

  for (const profile of profiles ?? []) {
    try {
      const firstName = profile.full_name?.split(' ')[0] ?? 'there'

      // Gather data (silently skip if not connected)
      const [events, emails, issues] = await Promise.allSettled([
        getOAuthToken(profile.id, 'google_calendar').then((t) =>
          t ? getUpcomingEvents(profile.id, 1, 5) : []
        ),
        getOAuthToken(profile.id, 'gmail').then((t) =>
          t ? getRecentEmails(profile.id, 5) : []
        ),
        getOAuthToken(profile.id, 'linear').then((t) =>
          t ? getMyIssues(profile.id) : []
        ),
      ])

      const briefing = await generateDailyBriefing(
        firstName,
        events.status === 'fulfilled' ? events.value : [],
        emails.status === 'fulfilled' ? emails.value : [],
        issues.status === 'fulfilled' ? issues.value : []
      )

      await sendSmsToUser(profile.id, briefing)
      results.sent++
    } catch (err) {
      console.error(`Failed briefing for user ${profile.id}:`, err)
      results.failed++
    }
  }

  return NextResponse.json(results)
}
