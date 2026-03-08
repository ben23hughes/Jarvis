export function getGithubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    scope: 'repo read:user read:org',
    state,
  })
  return `https://github.com/login/oauth/authorize?${params}`
}

export async function exchangeGithubCode(code: string): Promise<{
  access_token: string
  scope: string
  token_type: string
}> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    }),
  })

  if (!response.ok) throw new Error(`GitHub token exchange failed: ${response.statusText}`)
  const data = await response.json()
  if (data.error) throw new Error(`GitHub OAuth error: ${data.error_description}`)
  return data
}
