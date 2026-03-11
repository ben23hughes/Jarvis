import { createClient } from '@/lib/supabase/server'
import { getHealthMetrics } from '@/lib/health'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') ?? '90')

  const metrics = await getHealthMetrics(user.id, days)
  return NextResponse.json({ metrics })
}
