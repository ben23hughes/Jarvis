import { createClient } from '@/lib/supabase/server'
import { getDeviceByKey } from '@/lib/devices'
import { NextResponse } from 'next/server'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech'

export async function POST(request: Request) {
  // Accept either a session cookie (web) or a device Bearer key (Pi)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const device = await getDeviceByKey(authHeader.slice(7))
    if (!device) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { text } = await request.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 })

  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb'

  if (!apiKey) return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 503 })

  const res = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `ElevenLabs error: ${err}` }, { status: 502 })
  }

  return new NextResponse(res.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  })
}
