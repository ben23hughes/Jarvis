import { getDeviceByKey, touchDevice, getPendingMessages, markMessagesDelivered } from '@/lib/devices'
import { NextResponse } from 'next/server'

function extractDeviceKey(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const key = extractDeviceKey(request)
  if (!key) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const device = await getDeviceByKey(key)
  if (!device) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (device.id !== id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Update last seen
  await touchDevice(device.id, {
    ip_address: request.headers.get('x-forwarded-for') ?? undefined,
  })

  const messages = await getPendingMessages(device.id)

  if (messages.length > 0) {
    await markMessagesDelivered(messages.map((m) => m.id))
  }

  return NextResponse.json({ messages })
}
