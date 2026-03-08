import { createClient } from '@/lib/supabase/server'
import { exchangeGoogleCode } from '@/lib/oauth/google'
import { storeOAuthToken } from '@/lib/oauth/token-store'
import { validateAndClearOAuthState } from '@/lib/oauth/state'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/settings/integrations?error=google_denied`)
  }

  const { valid, verifier } = await validateAndClearOAuthState(state)
  if (!valid || !verifier) {
    return NextResponse.redirect(`${origin}/settings/integrations?error=invalid_state`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  try {
    const tokens = await exchangeGoogleCode(code, verifier)

    // Store for both Google Calendar and Gmail (same access token)
    await storeOAuthToken({
      userId: user.id,
      provider: 'google_calendar',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
    })

    await storeOAuthToken({
      userId: user.id,
      provider: 'gmail',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
    })

    await storeOAuthToken({
      userId: user.id,
      provider: 'google_drive',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
    })

    return NextResponse.redirect(`${origin}/settings/integrations?success=google`)
  } catch (err) {
    console.error('Google OAuth error:', err)
    return NextResponse.redirect(`${origin}/settings/integrations?error=google_failed`)
  }
}
