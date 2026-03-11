import { createClient } from '@/lib/supabase/server'
import { storeOAuthToken, getOAuthToken, deleteOAuthToken } from '@/lib/oauth/token-store'
import { getAlpacaAccount } from '@/lib/integrations/alpaca'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getOAuthToken(user.id, 'alpaca')
  if (!token) return NextResponse.json({ connected: false })

  let account_value: string | null = null
  let paper = false
  try {
    paper = (token.provider_metadata as { paper?: boolean })?.paper ?? false
    const account = await getAlpacaAccount(user.id)
    account_value = parseFloat(account.portfolio_value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })
  } catch {
    // invalid key
  }

  return NextResponse.json({ connected: true, account_value, paper })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key_id, secret_key, paper } = await request.json()
  if (!key_id || !secret_key) {
    return NextResponse.json({ error: 'key_id and secret_key required' }, { status: 400 })
  }

  await storeOAuthToken({
    userId: user.id,
    provider: 'alpaca',
    accessToken: key_id,
    providerMetadata: { secret: secret_key, paper: paper ?? false },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await deleteOAuthToken(user.id, 'alpaca')
  return NextResponse.json({ ok: true })
}
