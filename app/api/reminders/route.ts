import { createClient } from '@/lib/supabase/server'
import { listReminders, createReminder } from '@/lib/reminders'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreateSchema = z.object({
  message: z.string().min(1),
  remind_at: z.string(),
  channel: z.enum(['sms', 'email']).default('email'),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reminders = await listReminders(user.id)
  return NextResponse.json({ reminders })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const reminder = await createReminder(user.id, parsed.data.message, parsed.data.remind_at, parsed.data.channel)
  return NextResponse.json({ reminder }, { status: 201 })
}
