import { createClient } from '@supabase/supabase-js'
import type { Reminder } from '@/types/reminders'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function createReminder(
  userId: string,
  message: string,
  remindAt: string,
  channel: 'sms' | 'email' = 'email'
): Promise<Reminder> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('reminders')
    .insert({ user_id: userId, message, remind_at: remindAt, channel })
    .select()
    .single()

  if (error || !data) throw new Error(`Failed to create reminder: ${error?.message}`)
  return data as Reminder
}

export async function listReminders(userId: string): Promise<Reminder[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('remind_at', { ascending: true })

  if (error) throw new Error(`Failed to list reminders: ${error.message}`)
  return (data ?? []) as Reminder[]
}

export async function cancelReminder(userId: string, reminderId: string): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('reminders')
    .update({ status: 'cancelled' })
    .eq('id', reminderId)
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to cancel reminder: ${error.message}`)
}

export async function getDueReminders(): Promise<(Reminder & { user_id: string })[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('status', 'pending')
    .lte('remind_at', new Date().toISOString())

  if (error) throw new Error(`Failed to get due reminders: ${error.message}`)
  return (data ?? []) as (Reminder & { user_id: string })[]
}

export async function markReminderSent(reminderId: string): Promise<void> {
  const supabase = getServiceClient()
  await supabase
    .from('reminders')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', reminderId)
}
