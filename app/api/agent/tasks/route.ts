import { getUserIdFromKey, getPendingTasks } from '@/lib/agent'
import { NextResponse } from 'next/server'

// Agent polls this endpoint to get pending tasks
export async function GET(request: Request) {
  const auth = request.headers.get('authorization') ?? ''
  const apiKey = auth.replace('Bearer ', '').trim()
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401 })

  const userId = await getUserIdFromKey(apiKey)
  if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

  const tasks = await getPendingTasks(userId)
  return NextResponse.json({ tasks })
}
