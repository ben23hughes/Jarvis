import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">How your week is shaping up</p>
      </div>
      <AnalyticsDashboard />
    </div>
  )
}
