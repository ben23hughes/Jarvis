import { createClient } from '@/lib/supabase/server'
import { getYnabAuthUrl } from '@/lib/oauth/ynab'
import { generateState, setOAuthState } from '@/lib/oauth/state'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const state = await generateState()
  await setOAuthState(state)

  return NextResponse.redirect(getYnabAuthUrl(state))
}
