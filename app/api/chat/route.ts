import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getConnectedProviders } from '@/lib/oauth/token-store'
import { getToolsForConnectedProviders } from '@/lib/ai/tools'
import { executeTool } from '@/lib/ai/tool-executor'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { listMemories } from '@/lib/memories'
import { listGoals } from '@/lib/goals'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages } = await request.json()
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? 'there'
  const [connectedProviders, memories, goals] = await Promise.all([
    getConnectedProviders(user.id),
    listMemories(user.id, 30),
    listGoals(user.id, undefined, 'active'),
  ])
  const tools = getToolsForConnectedProviders(connectedProviders)
  const systemPrompt = buildSystemPrompt(userName, connectedProviders, memories, goals)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Multi-turn tool loop
        const anthropicMessages: Anthropic.MessageParam[] = messages.map(
          (m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })
        )

        let continueLoop = true

        while (continueLoop) {
          const response = await anthropic.messages.create({
            model: 'claude-opus-4-6',
            max_tokens: 4096,
            system: systemPrompt,
            tools: tools.length > 0 ? tools : undefined,
            messages: anthropicMessages,
          })

          // Stream text content
          for (const block of response.content) {
            if (block.type === 'text') {
              const chunk = `data: ${JSON.stringify({ type: 'text', text: block.text })}\n\n`
              controller.enqueue(encoder.encode(chunk))
            }
          }

          if (response.stop_reason === 'tool_use') {
            const toolUseBlocks = response.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
            )

            // Signal tool calls to client
            for (const toolUse of toolUseBlocks) {
              const chunk = `data: ${JSON.stringify({
                type: 'tool_call',
                id: toolUse.id,
                name: toolUse.name,
                input: toolUse.input,
              })}\n\n`
              controller.enqueue(encoder.encode(chunk))
            }

            // Execute all tool calls
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
                } catch (err) {
                  return {
                    type: 'tool_result' as const,
                    tool_use_id: toolUse.id,
                    content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
                    is_error: true,
                  }
                }
              })
            )

            // Add assistant response and tool results to the message history
            anthropicMessages.push({ role: 'assistant', content: response.content })
            anthropicMessages.push({ role: 'user', content: toolResults })

            // Signal tool results to client
            for (const result of toolResults) {
              const chunk = `data: ${JSON.stringify({
                type: 'tool_result',
                tool_use_id: result.tool_use_id,
                content: result.content,
              })}\n\n`
              controller.enqueue(encoder.encode(chunk))
            }
          } else {
            // Done
            continueLoop = false
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          }
        }
      } catch (err) {
        console.error('Chat error:', err)
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'An error occurred' })}\n\n`
          )
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
