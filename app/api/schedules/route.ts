import { createClient } from '@/lib/supabase/server'
import { createSchedule, listSchedules } from '@/lib/schedules'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const schedules = await listSchedules(user.id)
  return NextResponse.json(schedules)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await request.json()
  const schedule = await createSchedule(user.id, {
    name: body.name,
    prompt: body.prompt,
    frequency: body.frequency,
    hour: body.hour ?? 9,
    minute: body.minute ?? 0,
    day_of_week: body.day_of_week ?? null,
    channel: body.channel ?? 'sms',
    enabled: true,
  })
  return NextResponse.json(schedule, { status: 201 })
}
