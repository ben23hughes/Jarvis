// Facebook scopes for both Pages and Instagram Business
const FB_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_comments',
].join(',')

export function getFacebookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
    scope: FB_SCOPES,
    state,
    response_type: 'code',
  })
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`
}

export async function exchangeFacebookCode(code: string): Promise<{
  access_token: string
  token_type: string
}> {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
    code,
  })
  const response = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params}`)
  if (!response.ok) throw new Error(`Facebook token exchange failed: ${response.statusText}`)
  return response.json()
}

// Exchange short-lived token for a long-lived one (~60 days)
export async function getLongLivedToken(shortToken: string): Promise<{
  access_token: string
  token_type: string
  expires_in: number
}> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    fb_exchange_token: shortToken,
  })
  const response = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params}`)
  if (!response.ok) throw new Error(`Facebook long-lived token exchange failed: ${response.statusText}`)
  return response.json()
}
