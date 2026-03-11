import { createClient } from '@/lib/supabase/server'
import { upsertHealthMetrics } from '@/lib/health'
import type { HealthMetric } from '@/lib/health'
import { NextResponse } from 'next/server'

// Maps Apple Health type identifiers to our metric fields
const TYPE_MAP: Record<string, keyof HealthMetric> = {
  HKQuantityTypeIdentifierStepCount: 'steps',
  HKQuantityTypeIdentifierHeartRate: 'heart_rate_avg',
  HKQuantityTypeIdentifierRestingHeartRate: 'resting_heart_rate',
  HKQuantityTypeIdentifierActiveEnergyBurned: 'active_calories',
  HKQuantityTypeIdentifierDistanceWalkingRunning: 'distance_km',
  HKQuantityTypeIdentifierBodyMass: 'weight_kg',
  HKQuantityTypeIdentifierBloodPressureSystolic: 'blood_pressure_systolic',
  HKQuantityTypeIdentifierBloodPressureDiastolic: 'blood_pressure_diastolic',
  HKQuantityTypeIdentifierOxygenSaturation: 'oxygen_saturation',
  HKQuantityTypeIdentifierAppleExerciseTime: 'exercise_minutes',
  HKCategoryTypeIdentifierMindfulSession: 'mindful_minutes',
  HKCategoryTypeIdentifierSleepAnalysis: 'sleep_minutes',
}

// Types where we sum values per day (vs average)
const SUM_TYPES = new Set([
  'steps', 'active_calories', 'distance_km', 'exercise_minutes', 'mindful_minutes', 'sleep_minutes',
])

function attr(tag: string, name: string): string {
  const m = tag.match(new RegExp(` ${name}="([^"]*)"`, 'i'))
  return m ? m[1] : ''
}

function parseDate(dateStr: string): string {
  // "2024-01-15 08:30:00 -0700" → "2024-01-15"
  return dateStr.split(' ')[0]
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const text = await request.text()
  if (!text) return NextResponse.json({ error: 'No file content' }, { status: 400 })

  // Accumulate raw values per day per metric
  const dailyRaw: Record<string, Record<string, number[]>> = {}

  const recordRe = /<Record[^>]+>/g
  let m: RegExpExecArray | null

  while ((m = recordRe.exec(text)) !== null) {
    const tag = m[0]
    const type = attr(tag, 'type')
    const field = TYPE_MAP[type]
    if (!field) continue

    const rawValue = attr(tag, 'value')
    const startDate = attr(tag, 'startDate') || attr(tag, 'creationDate')
    if (!startDate) continue

    const date = parseDate(startDate)
    let value = parseFloat(rawValue)
    if (isNaN(value)) value = 1 // For category types (sleep, mindful) with no numeric value

    // Convert units
    const unit = attr(tag, 'unit')
    if (field === 'distance_km' && unit === 'mi') value *= 1.60934
    if (field === 'weight_kg' && unit === 'lb') value *= 0.453592
    if (field === 'oxygen_saturation' && value > 1) value = value / 100

    // Sleep: only count InBed or Asleep values (value 0=InBed, 1=Asleep, 2=Awake in older format; newer uses strings)
    if (field === 'sleep_minutes') {
      const sleepVal = attr(tag, 'value')
      if (sleepVal === 'HKCategoryValueSleepAnalysisAwake' || sleepVal === '2') continue
      // Convert duration to minutes
      const start = new Date(startDate)
      const endDate = attr(tag, 'endDate')
      if (endDate) {
        const end = new Date(endDate)
        value = (end.getTime() - start.getTime()) / 60000
      }
    }

    if (!dailyRaw[date]) dailyRaw[date] = {}
    if (!dailyRaw[date][field]) dailyRaw[date][field] = []
    dailyRaw[date][field].push(value)
  }

  // Aggregate to daily metrics
  const metrics: HealthMetric[] = Object.entries(dailyRaw).map(([date, fields]) => {
    const metric: Record<string, unknown> = { date }
    for (const [field, values] of Object.entries(fields)) {
      if (values.length === 0) continue
      if (SUM_TYPES.has(field)) {
        metric[field] = Math.round(values.reduce((a, b) => a + b, 0))
      } else {
        const avg = values.reduce((a, b) => a + b, 0) / values.length
        metric[field] = Math.round(avg * 10) / 10
      }
    }
    return metric as unknown as HealthMetric
  })

  const result = await upsertHealthMetrics(user.id, metrics)
  return NextResponse.json({ ok: true, days_imported: result.upserted, days_parsed: metrics.length })
}
