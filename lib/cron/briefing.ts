import Anthropic from '@anthropic-ai/sdk'
import type { CalendarEvent } from '@/types/dashboard'
import type { Email } from '@/types/dashboard'
import type { LinearIssue } from '@/types/dashboard'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateDailyBriefing(
  userName: string,
  events: CalendarEvent[],
  emails: Email[],
  issues: LinearIssue[]
): Promise<string> {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const eventsText = events.length
    ? events.map((e) => `- ${e.title} at ${new Date(e.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`).join('\n')
    : 'No events today'

  const emailsText = emails.length
    ? emails.slice(0, 3).map((e) => `- ${e.subject} (from ${e.from.split('<')[0].trim()})`).join('\n')
    : 'No unread emails'

  const issuesText = issues.length
    ? issues.slice(0, 3).map((i) => `- [${i.identifier}] ${i.title} (${i.state})`).join('\n')
    : 'No active issues'

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Write a concise, friendly morning briefing SMS for ${userName} on ${today}. Keep it under 200 words. Use this data:

CALENDAR:
${eventsText}

TOP EMAILS:
${emailsText}

LINEAR ISSUES:
${issuesText}

Format it as a natural, brief morning summary. Start with "Good morning, ${userName}!"`,
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : 'Good morning! Have a great day.'
}
