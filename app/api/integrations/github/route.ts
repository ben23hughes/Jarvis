import { createClient } from '@/lib/supabase/server'
import { getMyPullRequests, getAssignedIssues } from '@/lib/integrations/github'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getOAuthToken(user.id, 'github')
  if (!token) return NextResponse.json({ connected: false })

  try {
    const [prs, issues] = await Promise.all([
      getMyPullRequests(user.id),
      getAssignedIssues(user.id),
    ])
    return NextResponse.json({ connected: true, prs, issues })
  } catch (err) {
    console.error('GitHub fetch error:', err)
    return NextResponse.json({ connected: true, prs: [], issues: [], error: 'Failed to fetch' })
  }
}
