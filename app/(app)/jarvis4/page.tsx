import { createClient } from '@/lib/supabase/server'
import { listDevices } from '@/lib/devices'
import { DeviceManager } from '@/components/jarvis4/device-manager'
import { AgentPanel } from '@/components/agent/agent-panel'

export default async function Jarvis4Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const devices = await listDevices(user!.id)

  return (
    <div className="max-w-2xl space-y-10">
      <AgentPanel />
      <DeviceManager initialDevices={devices} />
    </div>
  )
}
