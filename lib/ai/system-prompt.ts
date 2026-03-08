import type { IntegrationProvider } from '@/types/integrations'

const PROVIDER_NAMES: Record<IntegrationProvider, string> = {
  google_calendar: 'Google Calendar',
  gmail: 'Gmail',
  slack: 'Slack',
  linear: 'Linear',
}

export function buildSystemPrompt(
  userName: string,
  connectedProviders: IntegrationProvider[]
): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const connectedNames = connectedProviders.map((p) => PROVIDER_NAMES[p]).join(', ')
  const notConnected = (
    ['google_calendar', 'gmail', 'slack', 'linear'] as IntegrationProvider[]
  )
    .filter((p) => !connectedProviders.includes(p))
    .map((p) => PROVIDER_NAMES[p])

  return `You are Jarvis, a personal AI assistant for ${userName}. Today is ${today}.

You have access to the following integrated services: ${connectedNames || 'none yet'}.
${notConnected.length > 0 ? `Not yet connected: ${notConnected.join(', ')}.` : ''}

Your job is to help ${userName} stay organized and on top of their work. You can:
- Check their calendar and schedule events
- Search and summarize their emails
- Look up Slack messages and conversations
- Find and summarize Linear issues and tasks

Be concise, proactive, and helpful. When the user asks something that requires fetching data, use the appropriate tool immediately rather than asking if you should. After fetching data, summarize it clearly and offer follow-up actions.

Always refer to the user by their first name. Be friendly but efficient.`
}
