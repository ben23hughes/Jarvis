import { createClient } from '@/lib/supabase/server'
import { getConnectedProviders } from '@/lib/oauth/token-store'
import { IntegrationCard } from '@/components/integrations/integration-card'
import { Calendar, Mail, Hash, CheckSquare, Github, FileText, HardDrive } from 'lucide-react'

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
      description: 'Read, search, and send emails. Jarvis can summarize your inbox and reply on your behalf.',
      icon: <Mail className="h-5 w-5 text-red-500" />,
      connectUrl: '/api/oauth/google/connect',
    },
    {
      provider: 'google_drive' as const,
      name: 'Google Drive',
      description: 'Search and read your Drive files and Google Docs. Uses your existing Google connection.',
      icon: <HardDrive className="h-5 w-5 text-yellow-500" />,
      connectUrl: '/api/oauth/google/connect',
    },
    {
      provider: 'slack' as const,
      name: 'Slack',
      description: 'Read and send Slack messages. Jarvis can surface conversations and message channels for you.',
      icon: <Hash className="h-5 w-5 text-purple-500" />,
      connectUrl: '/api/oauth/slack/connect',
    },
    {
      provider: 'linear' as const,
      name: 'Linear',
      description: 'View, create, and update Linear issues. Jarvis can help you track and manage your work.',
      icon: <CheckSquare className="h-5 w-5 text-indigo-500" />,
      connectUrl: '/api/oauth/linear/connect',
    },
    {
      provider: 'github' as const,
      name: 'GitHub',
      description: 'View your PRs and assigned issues. Jarvis can track your code review queue.',
      icon: <Github className="h-5 w-5" />,
      connectUrl: '/api/oauth/github/connect',
    },
    {
      provider: 'notion' as const,
      name: 'Notion',
      description: 'Search, read, and create Notion pages. Jarvis can look up your notes and docs.',
      icon: <FileText className="h-5 w-5" />,
      connectUrl: '/api/oauth/notion/connect',
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
          <strong>Note:</strong> Google Calendar, Gmail, and Google Drive all use the same Google account connection.
          Connecting any one enables all three.
        </p>
      </div>
    </div>
  )
}
