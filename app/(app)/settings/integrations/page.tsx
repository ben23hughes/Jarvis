import { createClient } from '@/lib/supabase/server'
import { getConnectedProviders } from '@/lib/oauth/token-store'
import { IntegrationCard } from '@/components/integrations/integration-card'
import { Calendar, Mail, Hash, CheckSquare } from 'lucide-react'

export default async function IntegrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const connected = await getConnectedProviders(user!.id)

  const integrations = [
    {
      provider: 'google_calendar' as const,
      name: 'Google Calendar',
      description: 'View and create calendar events. Jarvis can check your schedule and schedule meetings.',
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      connectUrl: '/api/oauth/google/connect',
    },
    {
      provider: 'gmail' as const,
      name: 'Gmail',
      description: 'Read and search your emails. Jarvis can summarize your inbox and find important messages.',
      icon: <Mail className="h-5 w-5 text-red-500" />,
      connectUrl: '/api/oauth/google/connect',
    },
    {
      provider: 'slack' as const,
      name: 'Slack',
      description: 'Read messages from your Slack workspace. Jarvis can surface important conversations.',
      icon: <Hash className="h-5 w-5 text-purple-500" />,
      connectUrl: '/api/oauth/slack/connect',
    },
    {
      provider: 'linear' as const,
      name: 'Linear',
      description: 'View and search your Linear issues. Jarvis can help you track your work.',
      icon: <CheckSquare className="h-5 w-5 text-indigo-500" />,
      connectUrl: '/api/oauth/linear/connect',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your tools so Jarvis can help you stay organized.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.provider}
            {...integration}
            connected={connected.includes(integration.provider)}
          />
        ))}
      </div>

      <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> Google Calendar and Gmail use the same Google account connection.
          Connecting either one will enable both.
        </p>
      </div>
    </div>
  )
}
