import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`https://${process.env.PLAID_ENV ?? 'sandbox'}.plaid.com/link/token/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      user: { client_user_id: user.id },
      client_name: 'Jarvis',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    }),
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data.error_message ?? 'Plaid error' }, { status: 500 })
  return NextResponse.json({ link_token: data.link_token })
}
