import { createClient } from '@/lib/supabase/server'
import { exchangeSpotifyCode } from '@/lib/oauth/spotify'
import { storeOAuthToken } from '@/lib/oauth/token-store'
import { validateAndClearOAuthState } from '@/lib/oauth/state'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/settings/integrations?error=spotify_denied`)
  }

  const { valid, verifier } = await validateAndClearOAuthState(state)
  if (!valid || !verifier) {
    return NextResponse.redirect(`${origin}/settings/integrations?error=invalid_state`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  try {
    const data = await exchangeSpotifyCode(code, verifier)

    await storeOAuthToken({
      userId: user.id,
      provider: 'spotify',
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    })

    return NextResponse.redirect(`${origin}/settings/integrations?success=spotify`)
  } catch (err) {
    console.error('Spotify OAuth error:', err)
    return NextResponse.redirect(`${origin}/settings/integrations?error=spotify_failed`)
  }
}
