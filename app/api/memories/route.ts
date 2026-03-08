import { createClient } from '@/lib/supabase/server'
import { listMemories, saveMemory } from '@/lib/memories'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memories = await listMemories(user.id)
  return NextResponse.json({ memories })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, category } = await request.json()
  if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const memory = await saveMemory(user.id, content, category ?? 'general', 'user')
  return NextResponse.json({ memory }, { status: 201 })
}
