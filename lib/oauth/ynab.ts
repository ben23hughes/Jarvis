export function getYnabAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.YNAB_CLIENT_ID!,
    redirect_uri: process.env.YNAB_REDIRECT_URI!,
    response_type: 'code',
    state,
  })
  return `https://app.ynab.com/oauth/authorize?${params}`
}

export async function exchangeYnabCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}> {
  const response = await fetch('https://app.ynab.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YNAB_CLIENT_ID!,
      client_secret: process.env.YNAB_CLIENT_SECRET!,
      redirect_uri: process.env.YNAB_REDIRECT_URI!,
      grant_type: 'authorization_code',
      code,
    }),
  })

  if (!response.ok) {
    throw new Error(`YNAB token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

export async function refreshYnabToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const response = await fetch('https://app.ynab.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YNAB_CLIENT_ID!,
      client_secret: process.env.YNAB_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`YNAB token refresh failed: ${response.statusText}`)
  }

  return response.json()
}
