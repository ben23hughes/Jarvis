import { createClient } from '@/lib/supabase/server'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getOAuthToken(user.id, 'plaid')
  const items = (token?.provider_metadata?.items as Array<{ institution_name: string }>) ?? []
  return NextResponse.json({ connected: items.length > 0, institutions: items.map(i => i.institution_name) })
}
