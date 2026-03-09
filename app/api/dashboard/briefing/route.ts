import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getConnectedProviders } from '@/lib/oauth/token-store'
import { getToolsForConnectedProviders } from '@/lib/ai/tools'
import { executeTool } from '@/lib/ai/tool-executor'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { listMemories } from '@/lib/memories'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getBriefingPrompt(name: string): string {
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/Denver',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return `Generate my daily briefing. Today is ${now} MST.

Use your tools to fetch real data right now, then write my briefing. Structure it like this:

**Today, ${now.split(',')[0]}**
Start with 1-2 sentences on what kind of day it looks like overall.

**On the calendar**
My meetings and events for today.

**Inbox**
Any emails that need attention today.

**Work**
My open Linear issues and any PRs needing review.

**This week**
Key meetings or deadlines coming up in the next 7 days worth flagging.

**Goals & reminders**
Any goals, priorities, or things I've asked you to keep track of.

Be conversational, like a smart assistant briefing ${name} at the start of their day. Keep it tight — no fluff. Use markdown for structure. If a section has nothing relevant, skip it.`
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? 'there'

  const [connectedProviders, memories] = await Promise.all([
    getConnectedProviders(user.id),
    listMemories(user.id, 30),
  ])

  const tools = getToolsForConnectedProviders(connectedProviders)
  const systemPrompt = buildSystemPrompt(firstName, connectedProviders, memories)
  const briefingPrompt = getBriefingPrompt(firstName)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicMessages: Anthropic.MessageParam[] = [
          { role: 'user', content: briefingPrompt },
        ]

        let continueLoop = true
        while (continueLoop) {
          const response = await anthropic.messages.create({
            model: 'claude-opus-4-6',
            max_tokens: 2048,
            system: systemPrompt,
            tools: tools.length > 0 ? tools : undefined,
            messages: anthropicMessages,
          })

          for (const block of response.content) {
            if (block.type === 'text') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', text: block.text })}\n\n`)
              )
            }
          }

          if (response.stop_reason === 'tool_use') {
            const toolUseBlocks = response.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
            )

            const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
              toolUseBlocks.map(async (toolUse) => {
                try {
                  const result = await executeTool(
                    toolUse.name,
                    toolUse.input as Record<string, unknown>,
                    user.id
                  )
                  return {
                    type: 'tool_result' as const,
                    tool_use_id: toolUse.id,
                    content: JSON.stringify(result),
                  }
                } catch {
                  return {
                    type: 'tool_result' as const,
                    tool_use_id: toolUse.id,
                    content: 'No data available',
                  }
                }
              })
            )

            anthropicMessages.push({ role: 'assistant', content: response.content })
            anthropicMessages.push({ role: 'user', content: toolResults })
          } else {
            continueLoop = false
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
            )
          }
        }
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
