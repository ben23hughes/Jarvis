import { createClient } from '@/lib/supabase/server'
import { storeOAuthToken, getOAuthToken, deleteOAuthToken } from '@/lib/oauth/token-store'
import { getCoinbasePortfolio } from '@/lib/integrations/coinbase'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getOAuthToken(user.id, 'coinbase')
  if (!token) return NextResponse.json({ connected: false })

  let account_count: number | null = null
  try {
    const accounts = await getCoinbasePortfolio(user.id)
    account_count = accounts.length
  } catch {
    // invalid key
  }

  return NextResponse.json({ connected: true, account_count })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { api_key, api_secret } = await request.json()
  if (!api_key || !api_secret) {
    return NextResponse.json({ error: 'api_key and api_secret required' }, { status: 400 })
  }

  await storeOAuthToken({
    userId: user.id,
    provider: 'coinbase',
    accessToken: api_key,
    providerMetadata: { secret: api_secret },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await deleteOAuthToken(user.id, 'coinbase')
  return NextResponse.json({ ok: true })
}
