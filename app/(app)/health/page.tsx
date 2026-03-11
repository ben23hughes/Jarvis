'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Heart, Footprints, Moon, Flame, Scale, Activity } from 'lucide-react'
import { toast } from 'sonner'

interface DailyMetric {
  date: string
  steps?: number | null
  heart_rate_avg?: number | null
  resting_heart_rate?: number | null
  active_calories?: number | null
  distance_km?: number | null
  weight_kg?: number | null
  sleep_minutes?: number | null
  exercise_minutes?: number | null
  oxygen_saturation?: number | null
}

function fmt(val: number | null | undefined, unit: string, decimals = 0): string {
  if (val == null) return '—'
  return `${val.toFixed(decimals)} ${unit}`
}

function sleepStr(mins: number | null | undefined): string {
  if (mins == null) return '—'
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return `${h}h ${m}m`
}

export default function HealthPage() {
  const [metrics, setMetrics] = useState<DailyMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/health/metrics').then(r => r.json()).then(d => {
      setMetrics(d.metrics ?? [])
      setLoading(false)
    })
  }, [])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    toast.loading('Importing health data…', { id: 'health-import' })

    try {
      const text = await file.text()
      const res = await fetch('/api/health/import', { method: 'POST', body: text })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Imported ${data.days_imported} days of health data`, { id: 'health-import' })
      // Reload
      const updated = await fetch('/api/health/metrics').then(r => r.json())
      setMetrics(updated.metrics ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed', { id: 'health-import' })
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // Calculate averages from last 7 days
  const recent = metrics.slice(0, 7)
  const avg = (arr: (number | null | undefined)[]) => {
    const vals = arr.filter((v): v is number => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }

  const summaryCards = [
    { icon: Footprints, label: 'Avg Steps', value: fmt(avg(recent.map(m => m.steps)), 'steps', 0), color: 'text-blue-500' },
    { icon: Heart, label: 'Avg Heart Rate', value: fmt(avg(recent.map(m => m.heart_rate_avg)), 'bpm', 0), color: 'text-red-500' },
    { icon: Moon, label: 'Avg Sleep', value: sleepStr(avg(recent.map(m => m.sleep_minutes))), color: 'text-indigo-500' },
    { icon: Flame, label: 'Avg Calories', value: fmt(avg(recent.map(m => m.active_calories)), 'cal', 0), color: 'text-orange-500' },
    { icon: Scale, label: 'Latest Weight', value: metrics.find(m => m.weight_kg)?.weight_kg != null ? `${metrics.find(m => m.weight_kg)!.weight_kg!.toFixed(1)} kg` : '—', color: 'text-green-500' },
    { icon: Activity, label: 'Avg Exercise', value: fmt(avg(recent.map(m => m.exercise_minutes)), 'min', 0), color: 'text-purple-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Health</h1>
          <p className="text-muted-foreground">
            Imported from Apple Health. Jarvis uses this data to give you personalized health insights.
          </p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".xml" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload className="h-4 w-4 mr-2" />
            {importing ? 'Importing…' : 'Import export.xml'}
          </Button>
        </div>
      </div>

      {/* Import instructions */}
      {metrics.length === 0 && !loading && (
        <Card className="p-6 space-y-3">
          <p className="font-medium">How to import your Apple Health data</p>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="font-medium text-foreground shrink-0">1.</span> Open the <strong>Health</strong> app on your iPhone</li>
            <li className="flex gap-2"><span className="font-medium text-foreground shrink-0">2.</span> Tap your profile picture → <strong>Export All Health Data</strong></li>
            <li className="flex gap-2"><span className="font-medium text-foreground shrink-0">3.</span> Unzip the file and open the <strong>export.xml</strong> file on this device</li>
            <li className="flex gap-2"><span className="font-medium text-foreground shrink-0">4.</span> Click <strong>Import export.xml</strong> above and select the file</li>
          </ol>
        </Card>
      )}

      {/* Summary cards */}
      {metrics.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {summaryCards.map(({ icon: Icon, label, value, color }) => (
              <Card key={label} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <p className="text-xl font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">7-day avg</p>
              </Card>
            ))}
          </div>

          {/* Daily log */}
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Recent days</h2>
            <div className="space-y-2">
              {metrics.slice(0, 30).map((m) => (
                <Card key={m.date} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground md:grid-cols-6">
                    <span><Footprints className="h-3 w-3 inline mr-1 text-blue-500" />{m.steps?.toLocaleString() ?? '—'}</span>
                    <span><Heart className="h-3 w-3 inline mr-1 text-red-500" />{m.heart_rate_avg ? `${m.heart_rate_avg} bpm` : '—'}</span>
                    <span><Moon className="h-3 w-3 inline mr-1 text-indigo-500" />{sleepStr(m.sleep_minutes)}</span>
                    <span><Flame className="h-3 w-3 inline mr-1 text-orange-500" />{m.active_calories ? `${Math.round(m.active_calories)} cal` : '—'}</span>
                    <span><Scale className="h-3 w-3 inline mr-1 text-green-500" />{m.weight_kg ? `${m.weight_kg.toFixed(1)} kg` : '—'}</span>
                    <span><Activity className="h-3 w-3 inline mr-1 text-purple-500" />{m.exercise_minutes ? `${m.exercise_minutes} min` : '—'}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
