import { validateCronRequest } from '@/lib/cron/auth'
import { getDueReminders, markReminderSent } from '@/lib/reminders'
import { getDueSchedules, markScheduleRan } from '@/lib/schedules'
import { sendSmsToUser } from '@/lib/twilio'
import { sendEmail } from '@/lib/integrations/gmail'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { getConnectedProviders } from '@/lib/oauth/token-store'
import { listMemories } from '@/lib/memories'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { getToolsForConnectedProviders } from '@/lib/ai/tools'
import { executeTool } from '@/lib/ai/tool-executor'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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

async function runScheduledPrompt(userId: string, prompt: string): Promise<string> {
  const [connectedProviders, memories] = await Promise.all([
    getConnectedProviders(userId),
    listMemories(userId, 20),
  ])
  const profile = await getUserProfile(userId)
  const userName = profile?.full_name?.split(' ')[0] ?? 'there'
  const systemPrompt = buildSystemPrompt(userName, connectedProviders, memories)
  const tools = getToolsForConnectedProviders(connectedProviders)

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: prompt },
  ]

  // Tool use loop
  let response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    messages,
  })

  while (response.stop_reason === 'tool_use') {
    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const tool of toolUses) {
      const result = await executeTool(tool.name, tool.input as Record<string, unknown>, userId)
      toolResults.push({ type: 'tool_result', tool_use_id: tool.id, content: JSON.stringify(result) })
    }
    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })
    response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    })
  }

  const text = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  return text?.text ?? '(no response)'
}

async function deliver(userId: string, message: string, channel: 'sms' | 'email') {
  if (channel === 'sms') {
    await sendSmsToUser(userId, message)
  } else {
    const gmailToken = await getOAuthToken(userId, 'gmail')
    if (!gmailToken) return
    const profile = await getUserProfile(userId)
    if (profile?.email) {
      await sendEmail(userId, profile.email, 'Jarvis Scheduled Update', message)
    }
  }
}

export async function GET(request: Request) {
  if (!validateCronRequest(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const [reminders, schedules] = await Promise.all([
    getDueReminders(),
    getDueSchedules(),
  ])

  const results = { reminders_sent: 0, schedules_ran: 0, failed: 0 }

  // Fire reminders
  for (const reminder of reminders) {
    try {
      await deliver(reminder.user_id, `⏰ Reminder: ${reminder.message}`, reminder.channel as 'sms' | 'email')
      await markReminderSent(reminder.id)
      results.reminders_sent++
    } catch (err) {
      console.error(`Reminder ${reminder.id} failed:`, err)
      results.failed++
    }
  }

  // Run user schedules
  for (const schedule of schedules) {
    try {
      const response = await runScheduledPrompt(schedule.user_id, schedule.prompt)
      await deliver(schedule.user_id, response, schedule.channel)
      await markScheduleRan(schedule)
      results.schedules_ran++
    } catch (err) {
      console.error(`Schedule ${schedule.id} failed:`, err)
      results.failed++
    }
  }

  return NextResponse.json({ ...results, total: reminders.length + schedules.length })
}
