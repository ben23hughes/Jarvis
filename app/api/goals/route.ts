import { createClient } from '@/lib/supabase/server'
import { listGoals, createGoal } from '@/lib/goals'
import { NextResponse } from 'next/server'
import type { GoalCategory } from '@/lib/goals'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') as GoalCategory | null
  const status = searchParams.get('status') as 'active' | 'completed' | 'paused' | null

  const goals = await listGoals(user.id, category ?? undefined, status ?? undefined)
  return NextResponse.json({ goals })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.title || !body.category) {
    return NextResponse.json({ error: 'title and category are required' }, { status: 400 })
  }

  const goal = await createGoal(user.id, body)
  return NextResponse.json({ goal }, { status: 201 })
}
