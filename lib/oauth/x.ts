const X_SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access']

export function getXAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.X_CLIENT_ID!,
    redirect_uri: process.env.X_REDIRECT_URI!,
    scope: X_SCOPES.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `https://twitter.com/i/oauth2/authorize?${params}`
}

function xBasicAuth(): string {
  return Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64')
}

export async function exchangeXCode(code: string, verifier: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
}> {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${xBasicAuth()}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.X_REDIRECT_URI!,
      code_verifier: verifier,
    }),
  })
  if (!response.ok) throw new Error(`X token exchange failed: ${response.statusText}`)
  return response.json()
}

export async function refreshXToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${xBasicAuth()}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!response.ok) throw new Error(`X token refresh failed: ${response.statusText}`)
  return response.json()
}
