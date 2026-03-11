import { createClient } from '@/lib/supabase/server'
import { getConnectedProviders } from '@/lib/oauth/token-store'
import { IntegrationCard } from '@/components/integrations/integration-card'
import { AppleCalendarPanel } from '@/components/integrations/apple-calendar-panel'
import { PlaidPanel } from '@/components/integrations/plaid-panel'
import { GoveePanel } from '@/components/integrations/govee-panel'
import { AlpacaPanel } from '@/components/integrations/alpaca-panel'
import { CoinbasePanel } from '@/components/integrations/coinbase-panel'
import {
  Calendar, Mail, Hash, CheckSquare, Github, FileText, HardDrive, Video,
  MessageSquare, Twitter, Facebook, Instagram, Music, DollarSign, CheckSquare2, TrendingUp,
} from 'lucide-react'

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
    {
      provider: 'zoom' as const,
      name: 'Zoom',
      description: 'View and create Zoom meetings. Jarvis can schedule calls and surface recent recordings.',
      icon: <Video className="h-5 w-5 text-blue-500" />,
      connectUrl: '/api/oauth/zoom/connect',
    },
    {
      provider: 'microsoft_teams' as const,
      name: 'Microsoft Teams',
      description: 'Read and send Teams messages. Jarvis can surface channel activity and post on your behalf.',
      icon: <MessageSquare className="h-5 w-5 text-purple-600" />,
      connectUrl: '/api/oauth/microsoft-teams/connect',
    },
    {
      provider: 'x' as const,
      name: 'X (Twitter)',
      description: 'Read your timeline, mentions, search tweets, and post on your behalf.',
      icon: <Twitter className="h-5 w-5" />,
      connectUrl: '/api/oauth/x/connect',
    },
    {
      provider: 'facebook' as const,
      name: 'Facebook',
      description: 'Manage your Facebook Pages — read posts, post content, and track engagement.',
      icon: <Facebook className="h-5 w-5 text-blue-600" />,
      connectUrl: '/api/oauth/facebook/connect',
    },
    {
      provider: 'instagram' as const,
      name: 'Instagram',
      description: 'View your media, profile stats, and publish photos. Requires a Business or Creator account linked to a Facebook Page.',
      icon: <Instagram className="h-5 w-5 text-pink-500" />,
      connectUrl: '/api/oauth/facebook/connect',
    },
    {
      provider: 'spotify' as const,
      name: 'Spotify',
      description: 'See what you are listening to, control playback, search music, and create playlists.',
      icon: <Music className="h-5 w-5 text-green-500" />,
      connectUrl: '/api/oauth/spotify/connect',
    },
    {
      provider: 'ynab' as const,
      name: 'YNAB',
      description: 'Track your budget — see spending by category, account balances, and recent transactions.',
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      connectUrl: '/api/oauth/ynab/connect',
    },
    {
      provider: 'todoist' as const,
      name: 'Todoist',
      description: 'Manage your tasks — view, create, and complete tasks. Jarvis can add tasks from conversation.',
      icon: <CheckSquare2 className="h-5 w-5 text-red-500" />,
      connectUrl: '/api/oauth/todoist/connect',
    },
    {
      provider: 'reddit' as const,
      name: 'Reddit',
      description: 'Browse your home feed, explore subreddits, and search posts.',
      icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
      connectUrl: '/api/oauth/reddit/connect',
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
        <AppleCalendarPanel />
        <PlaidPanel />
        <AlpacaPanel />
        <CoinbasePanel />
        <GoveePanel />
      </div>

      <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>
          <strong>Weather, News &amp; Yelp:</strong> These work automatically once OPENWEATHERMAP_API_KEY, NEWS_API_KEY, and YELP_API_KEY are set in your environment. Just ask Jarvis!
        </p>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> Google Calendar, Gmail, and Google Drive all use the same Google account connection.
          Connecting any one enables all three.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>
          <strong>Facebook & Instagram:</strong> Connecting Facebook also connects Instagram — they share the same OAuth app.
          Instagram requires a Business or Creator account linked to a Facebook Page.
          X (Twitter) read access is limited on the free API tier.
        </p>
      </div>
    </div>
  )
}
