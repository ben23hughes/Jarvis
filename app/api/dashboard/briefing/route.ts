import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getConnectedProviders } from '@/lib/oauth/token-store'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { getUpcomingEvents } from '@/lib/integrations/google-calendar'
import { getRecentEmails } from '@/lib/integrations/gmail'
import { getMyIssues } from '@/lib/integrations/linear'
import { listMemories } from '@/lib/memories'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const [connectedProviders, memories] = await Promise.all([
    getConnectedProviders(user.id),
    listMemories(user.id, 10),
  ])

  // Pre-fetch data in parallel — no tool round trips during generation
  const [calToken, gmailToken, linearToken] = await Promise.all([
    getOAuthToken(user.id, 'google_calendar'),
    getOAuthToken(user.id, 'gmail'),
    getOAuthToken(user.id, 'linear'),
  ])

  const [events, emails, issues] = await Promise.all([
    calToken ? getUpcomingEvents(user.id, 1, 5).catch(() => []) : Promise.resolve([]),
    gmailToken ? getRecentEmails(user.id, 5).catch(() => []) : Promise.resolve([]),
    linearToken ? getMyIssues(user.id).catch(() => []) : Promise.resolve([]),
  ])

  // Build a compact data summary to pass directly in the prompt
  const dataSections: string[] = []

  if (events.length > 0) {
    const eventList = events
      .slice(0, 4)
      .map((e: { title: string; start: string }) => {
        const time = new Date(e.start).toLocaleTimeString('en-US', {
          timeZone: 'America/Denver',
          hour: 'numeric',
          minute: '2-digit',
        })
        return `- ${time}: ${e.title}`
      })
      .join('\n')
    dataSections.push(`Today's calendar:\n${eventList}`)
  }

  if (emails.length > 0) {
    const emailList = (emails as Array<{ from: string; subject: string }>)
      .slice(0, 3)
      .map((e) => `- ${e.from}: ${e.subject}`)
      .join('\n')
    dataSections.push(`Recent emails:\n${emailList}`)
  }

  if ((issues as unknown[]).length > 0) {
    const issueList = (issues as Array<{ title: string; priority?: string }>)
      .slice(0, 3)
      .map((i) => `- ${i.title}`)
      .join('\n')
    dataSections.push(`Open issues:\n${issueList}`)
  }

  if (memories.length > 0) {
    const memList = memories.slice(0, 3).map((m) => `- ${m.content}`).join('\n')
    dataSections.push(`Things to keep in mind:\n${memList}`)
  }

  const connectedList = connectedProviders.join(', ') || 'none'
  const dataContext = dataSections.length > 0
    ? dataSections.join('\n\n')
    : 'No integrations connected yet.'

  const prompt = `Here is ${firstName}'s data for today:

${dataContext}

Connected: ${connectedList}

Write a short briefing for ${firstName}. 3-5 sentences max. Mention the most important 1-2 things from today (meetings, urgent emails, or key issues). End with one brief note on anything worth keeping in mind. Be direct and warm, like a smart assistant. No headers, no bullet points — just flowing sentences.`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Stream directly — no tool calls needed since data is pre-fetched
        const response = await anthropic.messages.create({
          model: 'claude-opus-4-6',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        })

        for await (const event of response) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`
              )
            )
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        )
      } catch (err) {
        console.error('Briefing error:', err)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error' })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
