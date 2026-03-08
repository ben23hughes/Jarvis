import { validateCronRequest } from '@/lib/cron/auth'
import { generateMeetingPrepBrief } from '@/lib/cron/meeting-prep'
import { sendSmsToUser } from '@/lib/twilio'
import { getUpcomingEvents } from '@/lib/integrations/google-calendar'
import { listContacts } from '@/lib/contacts'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Contact } from '@/types/contacts'

export async function GET(request: Request) {
  if (!validateCronRequest(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get users with calendar connected and a phone number
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number')
    .not('phone_number', 'is', null)

  const results = { sent: 0, skipped: 0, failed: 0 }

  for (const profile of profiles ?? []) {
    try {
      const calToken = await getOAuthToken(profile.id, 'google_calendar')
      if (!calToken) { results.skipped++; continue }

      // Find events starting in 10-20 minutes
      const now = Date.now()
      const windowStart = now + 10 * 60 * 1000
      const windowEnd = now + 20 * 60 * 1000

      const allEvents = await getUpcomingEvents(profile.id, 1, 20)
      const upcomingEvents = allEvents.filter((e) => {
        const start = new Date(e.start).getTime()
        return start >= windowStart && start <= windowEnd
      })

      for (const event of upcomingEvents) {
        // Check if we already sent prep for this event
        const { data: existing } = await supabase
          .from('meeting_prep_sent')
          .select('id')
          .eq('user_id', profile.id)
          .eq('event_id', event.id)
          .single()

        if (existing) continue

        // Find contacts matching attendees
        const contacts: Contact[] = []
        if (event.attendees?.length) {
          const allContacts = await listContacts(profile.id)
          for (const email of event.attendees) {
            const match = allContacts.find((c) => c.email === email)
            if (match) contacts.push(match)
          }
        }

        const firstName = profile.full_name?.split(' ')[0] ?? 'there'
        const brief = await generateMeetingPrepBrief(firstName, event, contacts)
        await sendSmsToUser(profile.id, brief)

        // Mark as sent
        await supabase
          .from('meeting_prep_sent')
          .insert({ user_id: profile.id, event_id: event.id })

        results.sent++
      }
    } catch (err) {
      console.error(`Meeting prep failed for ${profile.id}:`, err)
      results.failed++
    }
  }

  return NextResponse.json(results)
}
