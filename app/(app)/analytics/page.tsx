import { TimeBreakdownChart } from '@/components/analytics/time-breakdown-chart'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">How you&apos;re spending your time</p>
      </div>
      <TimeBreakdownChart />
    </div>
  )
}
