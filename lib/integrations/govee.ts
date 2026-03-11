import { getOAuthToken } from '@/lib/oauth/token-store'

async function goveeFetch(userId: string, path: string, options?: RequestInit) {
  const token = await getOAuthToken(userId, 'govee')
  if (!token) throw new Error('Govee not connected. Add your Govee API key in Settings → Integrations.')
  const res = await fetch(`https://developer-api.govee.com/v1${path}`, {
    ...options,
    headers: {
      'Govee-API-Key': token.access_token,
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) ?? {}),
    },
  })
  if (!res.ok) throw new Error(`Govee API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function listGoveeDevices(userId: string) {
  const data = await goveeFetch(userId, '/devices')
  return data.data?.devices ?? []
}

export async function controlGoveeDevice(
  userId: string,
  device: string,
  model: string,
  cmd: {
    name: 'turn' | 'brightness' | 'color' | 'colorTem'
    value: string | number | { r: number; g: number; b: number }
  }
) {
  const data = await goveeFetch(userId, '/devices/control', {
    method: 'PUT',
    body: JSON.stringify({ device, model, cmd }),
  })
  return data
}

export async function turnGoveeLight(userId: string, device: string, model: string, on: boolean) {
  return controlGoveeDevice(userId, device, model, { name: 'turn', value: on ? 'on' : 'off' })
}

export async function setGoveeBrightness(userId: string, device: string, model: string, brightness: number) {
  return controlGoveeDevice(userId, device, model, {
    name: 'brightness',
    value: Math.min(100, Math.max(0, brightness)),
  })
}

export async function setGoveeColor(
  userId: string,
  device: string,
  model: string,
  r: number,
  g: number,
  b: number
) {
  return controlGoveeDevice(userId, device, model, { name: 'color', value: { r, g, b } })
}
