import { createClient } from '@/lib/supabase/server'
import { isAgentConnected, getAgentSession } from '@/lib/agent'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [connected, session] = await Promise.all([
    isAgentConnected(user.id),
    getAgentSession(user.id),
  ])

  return NextResponse.json({
    connected,
    cwd: session?.cwd ?? null,
    last_heartbeat: session?.last_heartbeat ?? null,
  })
}
