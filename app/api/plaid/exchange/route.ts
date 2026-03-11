import { createClient } from '@/lib/supabase/server'
import { getOAuthToken, storeOAuthToken } from '@/lib/oauth/token-store'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { publicToken, institutionName } = await request.json()

  const res = await fetch(`https://${process.env.PLAID_ENV ?? 'sandbox'}.plaid.com/item/public_token/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      public_token: publicToken,
    }),
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data.error_message ?? 'Exchange failed' }, { status: 500 })

  // Append to existing items
  const existing = await getOAuthToken(user.id, 'plaid')
  const items = (existing?.provider_metadata?.items as Array<{ access_token: string; institution_name: string }>) ?? []
  items.push({ access_token: data.access_token, institution_name: institutionName ?? 'Bank' })

  await storeOAuthToken({
    userId: user.id,
    provider: 'plaid',
    accessToken: 'plaid', // placeholder - real tokens are in metadata
    providerMetadata: { items },
  })

  return NextResponse.json({ ok: true })
}
