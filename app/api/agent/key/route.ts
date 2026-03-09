import { createClient } from '@/lib/supabase/server'
import { getOrCreateAgentKey, regenerateAgentKey } from '@/lib/agent'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = await getOrCreateAgentKey(user.id)
  return NextResponse.json({ key })
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = await regenerateAgentKey(user.id)
  return NextResponse.json({ key })
}
