const ZOOM_SCOPES = [
  'meeting:read',
  'meeting:write',
  'recording:read',
  'user:read',
].join(' ')

export function getZoomAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ZOOM_CLIENT_ID!,
    redirect_uri: process.env.ZOOM_REDIRECT_URI!,
    scope: ZOOM_SCOPES,
    state,
  })
  return `https://zoom.us/oauth/authorize?${params}`
}

export async function exchangeZoomCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
  token_type: string
}> {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64')

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.ZOOM_REDIRECT_URI!,
    }),
  })

  if (!response.ok) {
    throw new Error(`Zoom token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

export async function refreshZoomToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64')

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Zoom token refresh failed: ${response.statusText}`)
  }

  return response.json()
}
