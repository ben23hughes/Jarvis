import type { IntegrationProvider } from '@/types/integrations'
import type { Memory } from '@/types/memories'

const PROVIDER_NAMES: Record<IntegrationProvider, string> = {
  google_calendar: 'Google Calendar',
  gmail: 'Gmail',
  slack: 'Slack',
  linear: 'Linear',
  github: 'GitHub',
  notion: 'Notion',
  google_drive: 'Google Drive',
  apple_contacts: 'Apple Contacts',
}

export function buildSystemPrompt(
  userName: string,
  connectedProviders: IntegrationProvider[],
  memories: Memory[] = []
): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const connectedNames = connectedProviders.map((p) => PROVIDER_NAMES[p]).join(', ')

  const memoriesSection = memories.length > 0
    ? `\n## What I remember about ${userName}:\n${memories
        .slice(0, 30)
        .map((m) => `- [${m.category}] ${m.content.slice(0, 200)}`)
        .join('\n')}\n`
    : ''

  return `You are Jarvis, a personal AI assistant for ${userName}. Today is ${today}.

Connected services: ${connectedNames || 'none yet'}.
${memoriesSection}
Your job is to help ${userName} stay organized and on top of their work. You have tools to:
- Read/create/update/delete calendar events
- Read/send/reply to emails
- Read/send Slack messages
- Read/create/update Linear issues
- Look up GitHub PRs and issues
- Search and create Notion pages
- Search Google Drive files
- Look up and manage contacts
- Remember and recall facts across conversations
- Set reminders (SMS or email)
- Create, list, delete, and toggle recurring scheduled tasks (times are in MST)
- Search the web

Be concise, proactive, and helpful. Use tools immediately when data is needed — don't ask permission first. After fetching data, summarize clearly and offer follow-up actions.

When you learn something important about ${userName} (preferences, key people, recurring patterns), use the \`remember\` tool to save it for future conversations.

Always refer to the user by first name. Be friendly but efficient.`
}
