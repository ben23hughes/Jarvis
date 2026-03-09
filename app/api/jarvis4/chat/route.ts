import { getDeviceByKey, touchDevice } from '@/lib/devices'
import { getConnectedProviders } from '@/lib/oauth/token-store'
import { listMemories } from '@/lib/memories'
import { listGoals } from '@/lib/goals'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { getToolsForConnectedProviders } from '@/lib/ai/tools'
import { executeTool } from '@/lib/ai/tool-executor'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { formatToolContent } from '@/lib/ai/tool-result'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function extractDeviceKey(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}

async function getUserProfile(userId: string) {
  const supabase = serviceClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, email, phone_number')
    .eq('id', userId)
    .single()
  return data
}

export async function POST(request: Request) {
  const key = extractDeviceKey(request)
  if (!key) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const device = await getDeviceByKey(key)
  if (!device) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message } = await request.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  await touchDevice(device.id, {
    ip_address: request.headers.get('x-forwarded-for') ?? undefined,
  })

  const userId = device.user_id

  const [connectedProviders, memories, goals, profile] = await Promise.all([
    getConnectedProviders(userId),
    listMemories(userId, 20),
    listGoals(userId),
    getUserProfile(userId),
  ])

  const userName = profile?.full_name?.split(' ')[0] ?? 'there'
  const systemPrompt = buildSystemPrompt(userName, connectedProviders, memories, goals)
  const tools = getToolsForConnectedProviders(connectedProviders)

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: message },
  ]

  let response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: systemPrompt + '\n\nYou are responding to a voice request from the user\'s Jarvis Pi device. Keep responses concise and conversational — they will be read aloud via text-to-speech.',
    tools,
    messages,
  })

  while (response.stop_reason === 'tool_use') {
    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const tool of toolUses) {
      const result = await executeTool(tool.name, tool.input as Record<string, unknown>, userId)
      toolResults.push({ type: 'tool_result', tool_use_id: tool.id, content: formatToolContent(result) })
    }
    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })
    response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      tools,
      messages,
    })
  }

  const text = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  return NextResponse.json({ response: text?.text ?? 'Sorry, I had trouble responding.' })
}
