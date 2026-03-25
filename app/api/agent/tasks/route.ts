import { getUserIdFromKey, getPendingTasks } from '@/lib/agent'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Long-poll: holds the connection open up to 20s waiting for a task.
// Returns immediately if tasks are already pending.
export async function GET(request: Request) {
  const auth = request.headers.get('authorization') ?? ''
  const apiKey = auth.replace('Bearer ', '').trim()
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const userId = await getUserIdFromKey(apiKey)
  if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

  // Return immediately if tasks are already queued
  const immediate = await getPendingTasks(userId)
  if (immediate.length > 0) return NextResponse.json({ tasks: immediate })

  // Long-poll: subscribe via Realtime and resolve as soon as a task is inserted
  return new Promise<Response>((resolve) => {
    const supabase = getServiceClient()

    const done = (tasks: unknown[]) => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
      resolve(NextResponse.json({ tasks }))
    }

    // Timeout — return empty so agent loops back and reconnects
    const timer = setTimeout(() => done([]), 20_000)

    const channel = supabase
      .channel(`pending_${userId}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_tasks', filter: `user_id=eq.${userId}` },
        async () => {
          const tasks = await getPendingTasks(userId)
          if (tasks.length > 0) done(tasks)
        }
      )
      .subscribe()
  })
}
