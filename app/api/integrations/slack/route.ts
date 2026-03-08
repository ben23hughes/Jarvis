import { createClient } from '@/lib/supabase/server'
import { getRecentMessages } from '@/lib/integrations/slack'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getOAuthToken(user.id, 'slack')
  if (!token) return NextResponse.json({ connected: false })

  try {
    const messages = await getRecentMessages(user.id, 10)
    return NextResponse.json({ connected: true, messages })
  } catch (err) {
    console.error('Slack fetch error:', err)
    return NextResponse.json({ connected: true, messages: [], error: 'Failed to fetch messages' })
  }
}
