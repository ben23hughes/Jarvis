import { createClient } from '@/lib/supabase/server'
import { deleteMemory } from '@/lib/memories'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await deleteMemory(user.id, id)
  return NextResponse.json({ success: true })
}
