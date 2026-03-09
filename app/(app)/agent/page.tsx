import { createClient } from '@/lib/supabase/server'
import { getOrCreateAgentKey, getAgentSession, isAgentConnected } from '@/lib/agent'
import { AgentPage } from '@/components/agent/agent-page'

export const dynamic = 'force-dynamic'

export default async function AgentPageRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [key, session, connected] = await Promise.all([
    getOrCreateAgentKey(user!.id),
    getAgentSession(user!.id),
    isAgentConnected(user!.id),
  ])

  return (
    <AgentPage
      apiKey={key}
      connected={connected}
      cwd={session?.cwd ?? null}
      lastHeartbeat={session?.last_heartbeat ?? null}
    />
  )
}
