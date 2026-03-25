import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type NotificationType = 'reminder' | 'schedule' | 'briefing' | 'alert'
export type NotificationChannel = 'sms' | 'email' | 'push' | 'in_app'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  channel: NotificationChannel
  read: boolean
  created_at: string
}

export async function logNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  channel: NotificationChannel = 'in_app'
): Promise<void> {
  const supabase = getServiceClient()
  await supabase.from('notifications').insert({ user_id: userId, type, title, body, channel })
}

export async function listNotifications(userId: string, limit = 30): Promise<Notification[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`Failed to list notifications: ${error.message}`)
  return (data ?? []) as Notification[]
}

export async function markAllRead(userId: string): Promise<void> {
  const supabase = getServiceClient()
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
}

export async function markRead(userId: string, id: string): Promise<void> {
  const supabase = getServiceClient()
  await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', userId)
}

export async function deleteNotification(userId: string, id: string): Promise<void> {
  const supabase = getServiceClient()
  await supabase.from('notifications').delete().eq('id', id).eq('user_id', userId)
}
