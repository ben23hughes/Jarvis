import { createClient } from '@/lib/supabase/server'
import { exchangeFacebookCode, getLongLivedToken } from '@/lib/oauth/facebook'
import { storeOAuthToken } from '@/lib/oauth/token-store'
import { validateAndClearOAuthState } from '@/lib/oauth/state'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/settings/integrations?error=facebook_denied`)
  }

  const { valid } = await validateAndClearOAuthState(state)
  if (!valid) {
    return NextResponse.redirect(`${origin}/settings/integrations?error=invalid_state`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  try {
    // Exchange code for short-lived token, then get long-lived token (~60 days)
    const short = await exchangeFacebookCode(code)
    const long = await getLongLivedToken(short.access_token)

    // Store under both 'facebook' and 'instagram' — same token, both integrations share it
    const tokenParams = {
      userId: user.id,
      accessToken: long.access_token,
      expiresIn: long.expires_in,
      scope: 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,instagram_manage_comments',
    }

    await storeOAuthToken({ ...tokenParams, provider: 'facebook' })
    await storeOAuthToken({ ...tokenParams, provider: 'instagram' })

    return NextResponse.redirect(`${origin}/settings/integrations?success=facebook`)
  } catch (err) {
    console.error('Facebook OAuth error:', err)
    return NextResponse.redirect(`${origin}/settings/integrations?error=facebook_failed`)
  }
}
