import { createClient } from '@/lib/supabase/server'
import { listNotifications, markAllRead, markRead, deleteNotification } from '@/lib/notifications'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await listNotifications(user.id, 30)
  return NextResponse.json(notifications)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (id) {
    await markRead(user.id, id)
  } else {
    await markAllRead(user.id)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  await deleteNotification(user.id, id)
  return NextResponse.json({ ok: true })
}
