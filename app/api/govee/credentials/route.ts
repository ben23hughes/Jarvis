import { createClient } from '@/lib/supabase/server'
import { storeOAuthToken, getOAuthToken, deleteOAuthToken } from '@/lib/oauth/token-store'
import { listGoveeDevices } from '@/lib/integrations/govee'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getOAuthToken(user.id, 'govee')
  if (!token) {
    return NextResponse.json({ connected: false, has_key: false })
  }

  // Try to get device count
  let device_count = 0
  try {
    const devices = await listGoveeDevices(user.id)
    device_count = devices.length
  } catch {
    // API key might be invalid
  }

  return NextResponse.json({ connected: true, has_key: true, device_count })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { api_key } = await request.json()
  if (!api_key) {
    return NextResponse.json({ error: 'api_key required' }, { status: 400 })
  }

  await storeOAuthToken({
    userId: user.id,
    provider: 'govee',
    accessToken: api_key,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await deleteOAuthToken(user.id, 'govee')
  return NextResponse.json({ ok: true })
}
