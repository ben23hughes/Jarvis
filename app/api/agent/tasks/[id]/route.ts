import { getUserIdFromKey, completeAgentTask, failAgentTask } from '@/lib/agent'
import { NextResponse } from 'next/server'

// Agent posts results here
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = request.headers.get('authorization') ?? ''
  const apiKey = auth.replace('Bearer ', '').trim()
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const userId = await getUserIdFromKey(apiKey)
  if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  if (body.status === 'completed') {
    await completeAgentTask(id, body.result)
  } else if (body.status === 'failed') {
    await failAgentTask(id, body.error ?? 'Unknown error')
  }

  return NextResponse.json({ ok: true })
}
