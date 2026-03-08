import { createClient } from '@/lib/supabase/server'
import { exchangeNotionCode } from '@/lib/oauth/notion'
import { storeOAuthToken } from '@/lib/oauth/token-store'
import { validateAndClearOAuthState } from '@/lib/oauth/state'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/settings/integrations?error=notion_denied`)
  }

  const { valid } = await validateAndClearOAuthState(state)
  if (!valid) return NextResponse.redirect(`${origin}/settings/integrations?error=invalid_state`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  try {
    const data = await exchangeNotionCode(code)
    await storeOAuthToken({
      userId: user.id,
      provider: 'notion',
      accessToken: data.access_token,
      providerAccountId: data.workspace_id,
      providerMetadata: { workspace_name: data.workspace_name, bot_id: data.bot_id },
    })
    return NextResponse.redirect(`${origin}/settings/integrations?success=notion`)
  } catch (err) {
    console.error('Notion OAuth error:', err)
    return NextResponse.redirect(`${origin}/settings/integrations?error=notion_failed`)
  }
}
