import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface HealthMetric {
  date: string
  steps?: number | null
  heart_rate_avg?: number | null
  resting_heart_rate?: number | null
  active_calories?: number | null
  distance_km?: number | null
  weight_kg?: number | null
  sleep_minutes?: number | null
  blood_pressure_systolic?: number | null
  blood_pressure_diastolic?: number | null
  oxygen_saturation?: number | null
  exercise_minutes?: number | null
  mindful_minutes?: number | null
}

export async function getHealthMetrics(userId: string, days = 30): Promise<HealthMetric[]> {
  const supabase = getServiceClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('health_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', since)
    .order('date', { ascending: false })

  if (error) throw new Error(`Failed to fetch health metrics: ${error.message}`)
  return (data ?? []) as HealthMetric[]
}

export async function getHealthSummary(userId: string, days = 7): Promise<{
  avg_steps: number | null
  avg_heart_rate: number | null
  avg_sleep_hours: number | null
  avg_calories: number | null
  latest_weight_kg: number | null
  days_with_data: number
  recent: HealthMetric[]
}> {
  const metrics = await getHealthMetrics(userId, days)
  if (metrics.length === 0) {
    return { avg_steps: null, avg_heart_rate: null, avg_sleep_hours: null, avg_calories: null, latest_weight_kg: null, days_with_data: 0, recent: [] }
  }

  const avg = (arr: (number | null | undefined)[]) => {
    const vals = arr.filter((v): v is number => v != null)
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }

  return {
    avg_steps: avg(metrics.map(m => m.steps)),
    avg_heart_rate: avg(metrics.map(m => m.heart_rate_avg)),
    avg_sleep_hours: (() => {
      const mins = avg(metrics.filter(m => m.sleep_minutes).map(m => m.sleep_minutes))
      return mins != null ? Math.round((mins / 60) * 10) / 10 : null
    })(),
    avg_calories: avg(metrics.map(m => m.active_calories)),
    latest_weight_kg: metrics.find(m => m.weight_kg)?.weight_kg ?? null,
    days_with_data: metrics.length,
    recent: metrics.slice(0, 7),
  }
}

export async function upsertHealthMetrics(
  userId: string,
  metrics: HealthMetric[]
): Promise<{ upserted: number }> {
  const supabase = getServiceClient()
  if (metrics.length === 0) return { upserted: 0 }

  const rows = metrics.map(m => ({ ...m, user_id: userId } as unknown as Record<string, unknown>))
  let upserted = 0

  // Batch in chunks of 200
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200)
    const { data, error } = await supabase
      .from('health_metrics')
      .upsert(chunk, { onConflict: 'user_id,date' })
      .select('id')
    if (!error) upserted += data?.length ?? 0
  }

  return { upserted }
}
