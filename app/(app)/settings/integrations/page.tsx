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
  MessageSquare, Twitter, Facebook, Instagram, Music, DollarSign, CheckSquare2,
  TrendingUp, Cloud, Newspaper, MapPin,
} from 'lucide-react'
import type { IntegrationProvider } from '@/types/integrations'
import type { ReactNode } from 'react'

interface Integration {
  provider: IntegrationProvider
  name: string
  description: string
  icon: ReactNode
  connectUrl: string
}

interface Section {
  title: string
  description?: string
  integrations?: Integration[]
  custom?: ReactNode[]
  note?: string
}

export default async function IntegrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const connected = await getConnectedProviders(user!.id)

  const sections: Section[] = [
    {
      title: 'Google',
      note: 'Google Calendar, Gmail, and Drive all share one connection — connecting any one enables all three.',
      integrations: [
        {
          provider: 'google_calendar',
          name: 'Google Calendar',
          description: 'View and create calendar events. Jarvis can check your schedule and schedule meetings.',
          icon: <Calendar className="h-5 w-5 text-blue-500" />,
          connectUrl: '/api/oauth/google/connect',
        },
        {
          provider: 'gmail',
          name: 'Gmail',
          description: 'Read, search, and send emails. Jarvis can summarize your inbox and reply on your behalf.',
          icon: <Mail className="h-5 w-5 text-red-500" />,
          connectUrl: '/api/oauth/google/connect',
        },
        {
          provider: 'google_drive',
          name: 'Google Drive',
          description: 'Search and read your Drive files and Google Docs.',
          icon: <HardDrive className="h-5 w-5 text-yellow-500" />,
          connectUrl: '/api/oauth/google/connect',
        },
      ],
    },
    {
      title: 'Work & Collaboration',
      integrations: [
        {
          provider: 'slack',
          name: 'Slack',
          description: 'Read and send Slack messages. Jarvis can surface conversations and message channels for you.',
          icon: <Hash className="h-5 w-5 text-purple-500" />,
          connectUrl: '/api/oauth/slack/connect',
        },
        {
          provider: 'microsoft_teams',
          name: 'Microsoft Teams',
          description: 'Read and send Teams messages. Jarvis can surface channel activity and post on your behalf.',
          icon: <MessageSquare className="h-5 w-5 text-purple-600" />,
          connectUrl: '/api/oauth/microsoft-teams/connect',
        },
        {
          provider: 'zoom',
          name: 'Zoom',
          description: 'View and create Zoom meetings. Jarvis can schedule calls and surface recent recordings.',
          icon: <Video className="h-5 w-5 text-blue-500" />,
          connectUrl: '/api/oauth/zoom/connect',
        },
        {
          provider: 'linear',
          name: 'Linear',
          description: 'View, create, and update Linear issues. Jarvis can help you track and manage your work.',
          icon: <CheckSquare className="h-5 w-5 text-indigo-500" />,
          connectUrl: '/api/oauth/linear/connect',
        },
        {
          provider: 'github',
          name: 'GitHub',
          description: 'View your PRs and assigned issues. Jarvis can track your code review queue.',
          icon: <Github className="h-5 w-5" />,
          connectUrl: '/api/oauth/github/connect',
        },
        {
          provider: 'notion',
          name: 'Notion',
          description: 'Search, read, and create Notion pages. Jarvis can look up your notes and docs.',
          icon: <FileText className="h-5 w-5" />,
          connectUrl: '/api/oauth/notion/connect',
        },
        {
          provider: 'todoist',
          name: 'Todoist',
          description: 'Manage your tasks — view, create, and complete tasks. Jarvis can add tasks from conversation.',
          icon: <CheckSquare2 className="h-5 w-5 text-red-500" />,
          connectUrl: '/api/oauth/todoist/connect',
        },
      ],
    },
    {
      title: 'Social & Content',
      note: 'Connecting Facebook also connects Instagram — they share the same OAuth app. Instagram requires a Business or Creator account linked to a Facebook Page.',
      integrations: [
        {
          provider: 'x',
          name: 'X (Twitter)',
          description: 'Read your timeline, mentions, search tweets, and post on your behalf.',
          icon: <Twitter className="h-5 w-5" />,
          connectUrl: '/api/oauth/x/connect',
        },
        {
          provider: 'facebook',
          name: 'Facebook',
          description: 'Manage your Facebook Pages — read posts, post content, and track engagement.',
          icon: <Facebook className="h-5 w-5 text-blue-600" />,
          connectUrl: '/api/oauth/facebook/connect',
        },
        {
          provider: 'instagram',
          name: 'Instagram',
          description: 'View your media, profile stats, and publish photos. Requires a Business or Creator account.',
          icon: <Instagram className="h-5 w-5 text-pink-500" />,
          connectUrl: '/api/oauth/facebook/connect',
        },
        {
          provider: 'reddit' as IntegrationProvider,
          name: 'Reddit',
          description: 'Browse your home feed, explore subreddits, and search posts.',
          icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
          connectUrl: '/api/oauth/reddit/connect',
        },
        {
          provider: 'spotify' as IntegrationProvider,
          name: 'Spotify',
          description: 'See what you are listening to, control playback, search music, and create playlists.',
          icon: <Music className="h-5 w-5 text-green-500" />,
          connectUrl: '/api/oauth/spotify/connect',
        },
      ],
    },
    {
      title: 'Finance',
      integrations: [
        {
          provider: 'ynab' as IntegrationProvider,
          name: 'YNAB',
          description: 'Track your budget — see spending by category, account balances, and recent transactions.',
          icon: <DollarSign className="h-5 w-5 text-green-600" />,
          connectUrl: '/api/oauth/ynab/connect',
        },
      ],
      custom: [<PlaidPanel key="plaid" />, <AlpacaPanel key="alpaca" />, <CoinbasePanel key="coinbase" />],
    },
    {
      title: 'Smart Home & Apple',
      custom: [<GoveePanel key="govee" />, <AppleCalendarPanel key="apple" />],
    },
    {
      title: 'Always On',
      description: 'These work automatically — no connection needed. Just ask Jarvis.',
      integrations: [],
      custom: [
        <div key="always-on" className="col-span-full grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: <Cloud className="h-5 w-5 text-sky-500" />, name: 'Weather', description: 'Current conditions and forecasts for any location.' },
            { icon: <Newspaper className="h-5 w-5 text-zinc-500" />, name: 'News', description: 'Top headlines and topic searches from across the web.' },
            { icon: <MapPin className="h-5 w-5 text-rose-500" />, name: 'Yelp', description: 'Find restaurants, businesses, and read reviews.' },
          ].map(({ icon, name, description }) => (
            <div key={name} className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3.5 opacity-75">
              <div className="mt-0.5">{icon}</div>
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              <span className="ml-auto text-xs text-emerald-600 font-medium shrink-0">Active</span>
            </div>
          ))}
        </div>,
      ],
    },
  ]

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">Connect your tools so Jarvis can help you stay organized.</p>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">{section.title}</h2>
            {section.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{section.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {section.integrations?.map((integration) => (
              <IntegrationCard
                key={integration.provider}
                {...integration}
                connected={connected.includes(integration.provider)}
              />
            ))}
            {section.custom?.map((node) => node)}
          </div>

          {section.note && (
            <p className="text-xs text-muted-foreground border rounded-lg px-4 py-3 bg-muted/40">
              {section.note}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
