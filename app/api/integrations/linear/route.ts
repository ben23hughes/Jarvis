import { createClient } from '@/lib/supabase/server'
import { getMyIssues } from '@/lib/integrations/linear'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getOAuthToken(user.id, 'linear')
  if (!token) return NextResponse.json({ connected: false })

  try {
    const issues = await getMyIssues(user.id)
    return NextResponse.json({ connected: true, issues })
  } catch (err) {
    console.error('Linear fetch error:', err)
    return NextResponse.json({ connected: true, issues: [], error: 'Failed to fetch issues' })
  }
}
