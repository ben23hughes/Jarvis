const REDDIT_SCOPES = 'identity read mysubreddits'

export function getRedditAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.REDDIT_CLIENT_ID!,
    response_type: 'code',
    state,
    redirect_uri: process.env.REDDIT_REDIRECT_URI!,
    duration: 'permanent',
    scope: REDDIT_SCOPES,
  })
  return `https://www.reddit.com/api/v1/authorize?${params}`
}

function redditBasicAuth(): string {
  return Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString('base64')
}

export async function exchangeRedditCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
}> {
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${redditBasicAuth()}`,
      'User-Agent': 'Jarvis/1.0',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.REDDIT_REDIRECT_URI!,
    }),
  })

  if (!response.ok) {
    throw new Error(`Reddit token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

export async function refreshRedditToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${redditBasicAuth()}`,
      'User-Agent': 'Jarvis/1.0',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Reddit token refresh failed: ${response.statusText}`)
  }

  return response.json()
}
