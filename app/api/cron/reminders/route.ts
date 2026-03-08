import { validateCronRequest } from '@/lib/cron/auth'
import { getDueReminders, markReminderSent } from '@/lib/reminders'
import { sendSmsToUser } from '@/lib/twilio'
import { sendEmail } from '@/lib/integrations/gmail'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  if (!validateCronRequest(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const reminders = await getDueReminders()
  const results = { sent: 0, failed: 0 }

  for (const reminder of reminders) {
    try {
      if (reminder.channel === 'sms') {
        await sendSmsToUser(reminder.user_id, `⏰ Reminder: ${reminder.message}`)
      } else {
        // Fallback to email
        const gmailToken = await getOAuthToken(reminder.user_id, 'gmail')
        if (gmailToken) {
          // Get user email from profiles
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', reminder.user_id)
            .single()

          if (profile?.email) {
            await sendEmail(reminder.user_id, profile.email, 'Jarvis Reminder', reminder.message)
          }
        }
      }
      await markReminderSent(reminder.id)
      results.sent++
    } catch (err) {
      console.error(`Failed to send reminder ${reminder.id}:`, err)
      results.failed++
    }
  }

  return NextResponse.json({ ...results, total: reminders.length })
}
