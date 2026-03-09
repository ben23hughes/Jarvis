import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'
import { createClient } from '@/lib/supabase/server'
import { mergeLayoutConfig } from '@/lib/layout-config'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('layout_config')
    .eq('id', user!.id)
    .single()

  const layout = mergeLayoutConfig(profile?.layout_config ?? null).analytics

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">How your week is shaping up</p>
      </div>
      <AnalyticsDashboard layout={layout} />
    </div>
  )
}
