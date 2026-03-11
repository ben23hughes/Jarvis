import { createClient } from '@/lib/supabase/server'
import { storeOAuthToken, getOAuthToken, deleteOAuthToken } from '@/lib/oauth/token-store'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getOAuthToken(user.id, 'apple_calendar')
  return NextResponse.json({
    connected: !!token,
    apple_id: token?.provider_account_id ?? null,
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apple_id, app_specific_password } = await request.json()
  if (!apple_id || !app_specific_password) {
    return NextResponse.json({ error: 'apple_id and app_specific_password required' }, { status: 400 })
  }

  await storeOAuthToken({
    userId: user.id,
    provider: 'apple_calendar',
    accessToken: app_specific_password,
    providerAccountId: apple_id,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await deleteOAuthToken(user.id, 'apple_calendar')
  return NextResponse.json({ ok: true })
}
