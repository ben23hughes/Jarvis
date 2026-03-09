import { getUserIdFromKey, recordHeartbeat } from '@/lib/agent'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const auth = request.headers.get('authorization') ?? ''
  const apiKey = auth.replace('Bearer ', '').trim()
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const userId = await getUserIdFromKey(apiKey)
  if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  await recordHeartbeat(userId, body.cwd)

  return NextResponse.json({ ok: true })
}
