import { createClient } from '@/lib/supabase/server'
import { updateSchedule, deleteSchedule } from '@/lib/schedules'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await params
  const body = await request.json()
  await updateSchedule(id, user.id, body)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await params
  await deleteSchedule(id, user.id)
  return NextResponse.json({ ok: true })
}
