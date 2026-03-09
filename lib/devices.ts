import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface Device {
  id: string
  user_id: string
  name: string
  device_key: string
  last_seen_at: string | null
  ip_address: string | null
  version: string | null
  created_at: string
}

export interface DeviceMessage {
  id: string
  device_id: string
  user_id: string
  content: string
  source: string
  delivered: boolean
  created_at: string
}

// ── Device CRUD ────────────────────────────────────────────────────────────

export async function listDevices(userId: string): Promise<Device[]> {
  const supabase = serviceClient()
  const { data } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data as Device[]) ?? []
}

export async function createDevice(userId: string, name: string): Promise<Device> {
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('devices')
    .insert({ user_id: userId, name })
    .select('*')
    .single()
  if (error) throw new Error(`Failed to create device: ${error.message}`)
  return data as Device
}

export async function renameDevice(deviceId: string, userId: string, name: string): Promise<void> {
  const supabase = serviceClient()
  const { error } = await supabase
    .from('devices')
    .update({ name })
    .eq('id', deviceId)
    .eq('user_id', userId)
  if (error) throw new Error(`Failed to rename device: ${error.message}`)
}

export async function deleteDevice(deviceId: string, userId: string): Promise<void> {
  const supabase = serviceClient()
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', deviceId)
    .eq('user_id', userId)
  if (error) throw new Error(`Failed to delete device: ${error.message}`)
}

// ── Device key auth (for Pi API calls) ────────────────────────────────────

export async function getDeviceByKey(deviceKey: string): Promise<Device | null> {
  const supabase = serviceClient()
  const { data } = await supabase
    .from('devices')
    .select('*')
    .eq('device_key', deviceKey)
    .single()
  return (data as Device) ?? null
}

export async function touchDevice(
  deviceId: string,
  opts: { ip_address?: string; version?: string } = {}
): Promise<void> {
  const supabase = serviceClient()
  await supabase
    .from('devices')
    .update({ last_seen_at: new Date().toISOString(), ...opts })
    .eq('id', deviceId)
}

// ── Device messages ────────────────────────────────────────────────────────

export async function pushMessageToDevice(
  deviceId: string,
  userId: string,
  content: string,
  source: 'system' | 'reminder' | 'schedule' | 'user' = 'system'
): Promise<void> {
  const supabase = serviceClient()
  const { error } = await supabase
    .from('device_messages')
    .insert({ device_id: deviceId, user_id: userId, content, source })
  if (error) throw new Error(`Failed to push device message: ${error.message}`)
}

export async function getPendingMessages(deviceId: string): Promise<DeviceMessage[]> {
  const supabase = serviceClient()
  const { data } = await supabase
    .from('device_messages')
    .select('*')
    .eq('device_id', deviceId)
    .eq('delivered', false)
    .order('created_at', { ascending: true })
    .limit(10)
  return (data as DeviceMessage[]) ?? []
}

export async function markMessagesDelivered(messageIds: string[]): Promise<void> {
  if (messageIds.length === 0) return
  const supabase = serviceClient()
  await supabase
    .from('device_messages')
    .update({ delivered: true })
    .in('id', messageIds)
}

// ── Helper to push to all of a user's devices ─────────────────────────────

export async function pushToAllDevices(
  userId: string,
  content: string,
  source: 'system' | 'reminder' | 'schedule' | 'user' = 'system'
): Promise<void> {
  const devices = await listDevices(userId)
  await Promise.all(
    devices.map((d) => pushMessageToDevice(d.id, userId, content, source))
  )
}
