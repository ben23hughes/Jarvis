import { createClient } from '@/lib/supabase/server'
import { exchangeLinearCode } from '@/lib/oauth/linear'
import { storeOAuthToken } from '@/lib/oauth/token-store'
import { validateAndClearOAuthState } from '@/lib/oauth/state'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/settings/integrations?error=linear_denied`)
  }

  const { valid } = await validateAndClearOAuthState(state)
  if (!valid) {
    return NextResponse.redirect(`${origin}/settings/integrations?error=invalid_state`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  try {
    const data = await exchangeLinearCode(code)

    await storeOAuthToken({
      userId: user.id,
      provider: 'linear',
      accessToken: data.access_token,
      scope: data.scope,
    })

    return NextResponse.redirect(`${origin}/settings/integrations?success=linear`)
  } catch (err) {
    console.error('Linear OAuth error:', err)
    return NextResponse.redirect(`${origin}/settings/integrations?error=linear_failed`)
  }
}
