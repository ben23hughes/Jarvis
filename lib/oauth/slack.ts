export const SLACK_SCOPES = [
  'channels:history',
  'channels:read',
  'users:read',
  'im:history',
  'search:read',
].join(',')

export function getSlackAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    redirect_uri: process.env.SLACK_REDIRECT_URI!,
    scope: SLACK_SCOPES,
    state,
  })
  return `https://slack.com/oauth/v2/authorize?${params}`
}

export async function exchangeSlackCode(code: string): Promise<{
  access_token: string
  authed_user: { id: string }
  team: { id: string; name: string }
  scope: string
}> {
  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      redirect_uri: process.env.SLACK_REDIRECT_URI!,
    }),
  })

  if (!response.ok) {
    throw new Error(`Slack token exchange failed: ${response.statusText}`)
  }

  const data = await response.json()
  if (!data.ok) throw new Error(`Slack OAuth error: ${data.error}`)
  return data
}
