import { createClient } from '@/lib/supabase/server'
import { getXAuthUrl } from '@/lib/oauth/x'
import { generateState, generateCodeVerifier, generateCodeChallenge, setOAuthState } from '@/lib/oauth/state'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const state = await generateState()
  const verifier = await generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  await setOAuthState(state, verifier)

  return NextResponse.redirect(getXAuthUrl(state, challenge))
}
