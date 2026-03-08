import { createClient } from '@supabase/supabase-js'
import type { Memory } from '@/types/memories'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function saveMemory(
  userId: string,
  content: string,
  category = 'general',
  source = 'ai_inferred'
): Promise<Memory> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('memories')
    .insert({ user_id: userId, content, category, source })
    .select()
    .single()

  if (error || !data) throw new Error(`Failed to save memory: ${error?.message}`)
  return data as Memory
}

export async function listMemories(userId: string, limit = 30): Promise<Memory[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to list memories: ${error.message}`)
  return (data ?? []) as Memory[]
}

export async function deleteMemory(userId: string, memoryId: string): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', memoryId)
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to delete memory: ${error.message}`)
}
