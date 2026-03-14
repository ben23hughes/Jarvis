import { CalendarWidget } from '@/components/dashboard/calendar-widget'
import { EmailWidget } from '@/components/dashboard/email-widget'
import { SlackWidget } from '@/components/dashboard/slack-widget'
import { LinearWidget } from '@/components/dashboard/linear-widget'
import { BriefingStream } from '@/components/dashboard/briefing-stream'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { createClient } from '@/lib/supabase/server'
import { mergeLayoutConfig } from '@/lib/layout-config'
import Link from 'next/link'
import { Target, Heart, BarChart2, Users, ArrowRight } from 'lucide-react'

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
      {/* Goals · Health · Analytics · Contacts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: '/goals', icon: Target, label: 'Goals', description: 'Track your active goals and progress', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { href: '/health', icon: Heart, label: 'Health', description: 'Log and review your health data', color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { href: '/analytics', icon: BarChart2, label: 'Analytics', description: 'Insights across all your activity', color: 'text-violet-500', bg: 'bg-violet-500/10' },
          { href: '/contacts', icon: Users, label: 'Contacts', description: 'View and manage your contacts', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        ].map(({ href, icon: Icon, label, description, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4 hover:bg-accent transition-colors group"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {layout.calendar && <CalendarWidget />}
        {layout.email && <EmailWidget />}
        {layout.slack && <SlackWidget />}
        {layout.linear && <LinearWidget />}
      </div>
    </div>
  )
}
