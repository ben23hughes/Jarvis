import Anthropic from '@anthropic-ai/sdk'
import type { CalendarEvent } from '@/types/dashboard'
import type { Contact } from '@/types/contacts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateMeetingPrepBrief(
  userName: string,
  event: CalendarEvent,
  contacts: Contact[]
): Promise<string> {
  const startTime = new Date(event.start).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const attendeeContext = contacts.length
    ? contacts
        .map((c) => `${c.first_name} ${c.last_name ?? ''} (${c.title ?? ''} at ${c.company ?? 'Unknown'})${c.notes ? ` — ${c.notes}` : ''}`)
        .join('\n')
    : 'No contact info available for attendees'

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Write a brief meeting prep SMS for ${userName}. Keep it under 150 words.

Meeting: "${event.title}" starts in 15 minutes at ${startTime}
${event.description ? `Description: ${event.description}` : ''}
${event.location ? `Location: ${event.location}` : ''}

Attendee context:
${attendeeContext}

Start with "⏰ Meeting in 15 min:"`,
      },
    ],
  })

  return response.content[0].type === 'text'
    ? response.content[0].text
    : `⏰ Meeting in 15 min: ${event.title} at ${startTime}`
}
