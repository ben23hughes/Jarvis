import { CalendarWidget } from '@/components/dashboard/calendar-widget'
import { EmailWidget } from '@/components/dashboard/email-widget'
import { SlackWidget } from '@/components/dashboard/slack-widget'
import { LinearWidget } from '@/components/dashboard/linear-widget'
import { BriefingStream } from '@/components/dashboard/briefing-stream'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6">
      <BriefingStream firstName={firstName} />
      <QuickStats />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CalendarWidget />
        <EmailWidget />
        <SlackWidget />
        <LinearWidget />
      </div>
    </div>
  )
}
