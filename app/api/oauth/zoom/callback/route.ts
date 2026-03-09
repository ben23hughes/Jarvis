import { createClient } from '@/lib/supabase/server'
import { exchangeZoomCode } from '@/lib/oauth/zoom'
import { storeOAuthToken } from '@/lib/oauth/token-store'
import { validateAndClearOAuthState } from '@/lib/oauth/state'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/settings/integrations?error=zoom_denied`)
  }

  const { valid } = await validateAndClearOAuthState(state)
  if (!valid) {
    return NextResponse.redirect(`${origin}/settings/integrations?error=invalid_state`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  try {
    const data = await exchangeZoomCode(code)

    await storeOAuthToken({
      userId: user.id,
      provider: 'zoom',
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    })

    return NextResponse.redirect(`${origin}/settings/integrations?success=zoom`)
  } catch (err) {
    console.error('Zoom OAuth error:', err)
    return NextResponse.redirect(`${origin}/settings/integrations?error=zoom_failed`)
  }
}
