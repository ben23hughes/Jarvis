// Uses Microsoft Graph API (Azure AD OAuth 2.0)
const TEAMS_SCOPES = [
  'offline_access',
  'User.Read',
  'Team.ReadBasic.All',
  'Channel.ReadBasic.All',
  'Chat.Read',
  'ChannelMessage.Read.All',
].join(' ')

export function getMicrosoftTeamsAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
    scope: TEAMS_SCOPES,
    state,
    response_mode: 'query',
  })
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
}

export async function exchangeMicrosoftCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
  token_type: string
}> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
      code,
    }),
  })

  if (!response.ok) {
    throw new Error(`Microsoft token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

export async function refreshMicrosoftToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Microsoft token refresh failed: ${response.statusText}`)
  }

  return response.json()
}
