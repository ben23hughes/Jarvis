export function getLinearAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.LINEAR_CLIENT_ID!,
    redirect_uri: process.env.LINEAR_REDIRECT_URI!,
    response_type: 'code',
    scope: 'read',
    state,
  })
  return `https://linear.app/oauth/authorize?${params}`
}

export async function exchangeLinearCode(code: string): Promise<{
  access_token: string
  token_type: string
  scope: string
}> {
  const response = await fetch('https://api.linear.app/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.LINEAR_CLIENT_ID!,
      client_secret: process.env.LINEAR_CLIENT_SECRET!,
      redirect_uri: process.env.LINEAR_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Linear token exchange failed: ${err}`)
  }

  return response.json()
}
