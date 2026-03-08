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

const USER_TZ = 'America/Denver' // MST/MDT

/**
 * Returns how many minutes the given timezone is behind UTC right now.
 * e.g. MST = -420 (UTC-7), MDT = -360 (UTC-6)
 */
function tzOffsetMinutes(tz: string): number {
  const now = new Date()
  const utcMs = now.getTime()
  const localStr = now.toLocaleString('en-US', { timeZone: tz })
  const localMs = new Date(localStr).getTime()
  return Math.round((utcMs - localMs) / 60000)
}

/**
 * Calculate the next UTC datetime a schedule should fire.
 * hour/minute are in USER_TZ (MST/MDT).
 */
export function calcNextRun(
  frequency: ScheduleFrequency,
  localHour: number,
  localMinute: number,
  dayOfWeek: number | null,
  from: Date = new Date()
): Date {
  const offsetMin = tzOffsetMinutes(USER_TZ)
  // Convert local hour:minute to UTC
  const utcTotalMin = ((localHour * 60 + localMinute) + offsetMin + 1440) % 1440
  const utcHour = Math.floor(utcTotalMin / 60)
  const utcMinute = utcTotalMin % 60

  if (frequency === 'hourly') {
    const next = new Date(from)
    next.setUTCSeconds(0, 0)
    next.setUTCMinutes(localMinute) // minute stays the same in any tz
    if (next <= from) next.setUTCHours(next.getUTCHours() + 1)
    return next
  }

  const next = new Date(from)
  next.setUTCHours(utcHour, utcMinute, 0, 0)
  if (next <= from) next.setUTCDate(next.getUTCDate() + 1)

  if (frequency === 'daily') return next

  if (frequency === 'weekdays') {
    // Check day in user's timezone
    while (true) {
      const localDay = new Date(next.toLocaleString('en-US', { timeZone: USER_TZ })).getDay()
      if (localDay !== 0 && localDay !== 6) break
      next.setUTCDate(next.getUTCDate() + 1)
    }
    return next
  }

  if (frequency === 'weekly' && dayOfWeek !== null) {
    while (true) {
      const localDay = new Date(next.toLocaleString('en-US', { timeZone: USER_TZ })).getDay()
      if (localDay === dayOfWeek) break
      next.setUTCDate(next.getUTCDate() + 1)
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
