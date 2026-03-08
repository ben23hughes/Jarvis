import { createClient } from '@supabase/supabase-js'

export type ScheduleFrequency = 'hourly' | 'daily' | 'weekdays' | 'weekly'
export type ScheduleChannel = 'sms' | 'email'

export interface UserSchedule {
  id: string
  user_id: string
  name: string
  prompt: string
  frequency: ScheduleFrequency
  hour: number
  minute: number
  day_of_week: number | null
  channel: ScheduleChannel
  enabled: boolean
  last_run_at: string | null
  next_run_at: string
  created_at: string
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Calculate the next UTC datetime a schedule should fire, starting from `from`.
 */
export function calcNextRun(
  frequency: ScheduleFrequency,
  hour: number,
  minute: number,
  dayOfWeek: number | null,
  from: Date = new Date()
): Date {
  const next = new Date(from)
  next.setSeconds(0, 0)

  if (frequency === 'hourly') {
    next.setMinutes(minute)
    if (next <= from) next.setHours(next.getHours() + 1)
    return next
  }

  // Set desired time
  next.setHours(hour, minute, 0, 0)
  // If that time has already passed today, start from tomorrow
  if (next <= from) next.setDate(next.getDate() + 1)

  if (frequency === 'daily') return next

  if (frequency === 'weekdays') {
    while (next.getUTCDay() === 0 || next.getUTCDay() === 6) {
      next.setDate(next.getDate() + 1)
    }
    return next
  }

  if (frequency === 'weekly' && dayOfWeek !== null) {
    while (next.getUTCDay() !== dayOfWeek) {
      next.setDate(next.getDate() + 1)
    }
    return next
  }

  return next
}

export async function createSchedule(
  userId: string,
  data: Omit<UserSchedule, 'id' | 'user_id' | 'last_run_at' | 'next_run_at' | 'created_at'>
) {
  const supabase = serviceClient()
  const next_run_at = calcNextRun(data.frequency, data.hour, data.minute, data.day_of_week)
  const { data: row, error } = await supabase
    .from('user_schedules')
    .insert({ ...data, user_id: userId, next_run_at: next_run_at.toISOString() })
    .select()
    .single()
  if (error) throw error
  return row as UserSchedule
}

export async function listSchedules(userId: string): Promise<UserSchedule[]> {
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('user_schedules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as UserSchedule[]
}

export async function updateSchedule(
  id: string,
  userId: string,
  data: Partial<Omit<UserSchedule, 'id' | 'user_id' | 'created_at'>>
) {
  const supabase = serviceClient()
  // Recalculate next_run if schedule params changed
  const patch: Record<string, unknown> = { ...data }
  if (data.frequency || data.hour !== undefined || data.minute !== undefined || data.day_of_week !== undefined) {
    const { data: existing } = await supabase
      .from('user_schedules')
      .select('frequency,hour,minute,day_of_week')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (existing) {
      const freq = (data.frequency ?? existing.frequency) as ScheduleFrequency
      const h = data.hour ?? existing.hour
      const m = data.minute ?? existing.minute
      const dow = data.day_of_week !== undefined ? data.day_of_week : existing.day_of_week
      patch.next_run_at = calcNextRun(freq, h, m, dow).toISOString()
    }
  }
  const { error } = await supabase
    .from('user_schedules')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function deleteSchedule(id: string, userId: string) {
  const supabase = serviceClient()
  const { error } = await supabase
    .from('user_schedules')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function getDueSchedules(): Promise<UserSchedule[]> {
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('user_schedules')
    .select('*')
    .eq('enabled', true)
    .lte('next_run_at', new Date().toISOString())
  if (error) throw error
  return (data ?? []) as UserSchedule[]
}

export async function markScheduleRan(schedule: UserSchedule) {
  const supabase = serviceClient()
  const next = calcNextRun(
    schedule.frequency,
    schedule.hour,
    schedule.minute,
    schedule.day_of_week
  )
  await supabase
    .from('user_schedules')
    .update({ last_run_at: new Date().toISOString(), next_run_at: next.toISOString() })
    .eq('id', schedule.id)
}
