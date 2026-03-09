import { CalendarWidget } from '@/components/dashboard/calendar-widget'
import { EmailWidget } from '@/components/dashboard/email-widget'
import { SlackWidget } from '@/components/dashboard/slack-widget'
import { LinearWidget } from '@/components/dashboard/linear-widget'
import { BriefingStream } from '@/components/dashboard/briefing-stream'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { createClient } from '@/lib/supabase/server'
import { mergeLayoutConfig } from '@/lib/layout-config'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, layout_config')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const layout = mergeLayoutConfig(profile?.layout_config ?? null).dashboard

  return (
    <div className="space-y-6">
      <BriefingStream firstName={firstName} />
      {layout.quick_stats && <QuickStats />}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {layout.calendar && <CalendarWidget />}
        {layout.email && <EmailWidget />}
        {layout.slack && <SlackWidget />}
        {layout.linear && <LinearWidget />}
      </div>
    </div>
  )
}
