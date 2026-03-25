import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Key management ─────────────────────────────────────────────────────────────

export async function getOrCreateAgentKey(userId: string): Promise<string> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('agent_sessions')
    .select('api_key')
    .eq('user_id', userId)
    .single()

  if (data?.api_key) return data.api_key

  const key = `jv_${randomBytes(24).toString('hex')}`
  await supabase.from('agent_sessions').upsert({ user_id: userId, api_key: key }, { onConflict: 'user_id' })
  return key
}

export async function regenerateAgentKey(userId: string): Promise<string> {
  const supabase = getServiceClient()
  const key = `jv_${randomBytes(24).toString('hex')}`
  await supabase.from('agent_sessions').upsert({ user_id: userId, api_key: key }, { onConflict: 'user_id' })
  return key
}

export async function getUserIdFromKey(apiKey: string): Promise<string | null> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('agent_sessions')
    .select('user_id')
    .eq('api_key', apiKey)
    .single()
  return data?.user_id ?? null
}

// ── Session / heartbeat ────────────────────────────────────────────────────────

export async function recordHeartbeat(userId: string, cwd?: string): Promise<void> {
  const supabase = getServiceClient()
  await supabase
    .from('agent_sessions')
    .update({ last_heartbeat: new Date().toISOString(), cwd: cwd ?? null })
    .eq('user_id', userId)
}

export async function isAgentConnected(userId: string): Promise<boolean> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('agent_sessions')
    .select('last_heartbeat')
    .eq('user_id', userId)
    .single()

  if (!data?.last_heartbeat) return false
  const age = Date.now() - new Date(data.last_heartbeat).getTime()
  return age < 10_000 // connected if heartbeat within 10s
}

export async function getAgentSession(userId: string) {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('agent_sessions')
    .select('last_heartbeat, cwd')
    .eq('user_id', userId)
    .single()
  return data
}

// ── Task relay ─────────────────────────────────────────────────────────────────

export async function createAgentTask(
  userId: string,
  tool: string,
  input: Record<string, unknown>
): Promise<{ id: string }> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('agent_tasks')
    .insert({ user_id: userId, tool, input })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Failed to create agent task: ${error?.message}`)
  return data
}

export async function getAgentTask(taskId: string) {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('agent_tasks')
    .select('status, result, error')
    .eq('id', taskId)
    .single()
  return data
}

export async function getPendingTasks(userId: string) {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('agent_tasks')
    .select('id, tool, input')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10)

  // Mark as running immediately
  if (data && data.length > 0) {
    await supabase
      .from('agent_tasks')
      .update({ status: 'running' })
      .in('id', data.map((t) => t.id))
  }

  return data ?? []
}

export async function completeAgentTask(
  taskId: string,
  result: unknown
): Promise<void> {
  const supabase = getServiceClient()
  await supabase
    .from('agent_tasks')
    .update({ status: 'completed', result: result as never })
    .eq('id', taskId)
}

export async function failAgentTask(taskId: string, error: string): Promise<void> {
  const supabase = getServiceClient()
  await supabase
    .from('agent_tasks')
    .update({ status: 'failed', error })
    .eq('id', taskId)
}

// ── Dispatch from chat (blocks until result or timeout) ───────────────────────

export async function dispatchAgentTask(
  userId: string,
  tool: string,
  input: Record<string, unknown>
): Promise<unknown> {
  if (!await isAgentConnected(userId)) {
    throw new Error(
      'Local agent not connected. Run the Jarvis agent in your project: node agent/index.mjs'
    )
  }

  const task = await createAgentTask(userId, tool, input)

  // Quick check — agent may have already completed the task
  const quick = await getAgentTask(task.id)
  if (quick?.status === 'completed') return quick.result
  if (quick?.status === 'failed') throw new Error(quick.error ?? 'Agent task failed')

  // Use Supabase Realtime to react instantly instead of polling the DB
  return new Promise((resolve, reject) => {
    const supabase = getServiceClient()

    const cleanup = (fn: () => void) => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
      fn()
    }

    const timer = setTimeout(
      () => cleanup(() => reject(new Error('Agent task timed out (25s). Is the agent still running?'))),
      25_000
    )

    const channel = supabase
      .channel(`task_${task.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'agent_tasks', filter: `id=eq.${task.id}` },
        async () => {
          const t = await getAgentTask(task.id)
          if (!t) return
          if (t.status === 'completed') cleanup(() => resolve(t.result))
          else if (t.status === 'failed') cleanup(() => reject(new Error(t.error ?? 'Agent task failed')))
        }
      )
      .subscribe()
  })
}
