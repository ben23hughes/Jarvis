import { createClient } from '@/lib/supabase/server'
import { getRecentEmails } from '@/lib/integrations/gmail'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getOAuthToken(user.id, 'gmail')
  if (!token) return NextResponse.json({ connected: false })

  try {
    const emails = await getRecentEmails(user.id, 5)
    return NextResponse.json({ connected: true, emails })
  } catch (err) {
    console.error('Gmail fetch error:', err)
    return NextResponse.json({ connected: true, emails: [], error: 'Failed to fetch emails' })
  }
}
