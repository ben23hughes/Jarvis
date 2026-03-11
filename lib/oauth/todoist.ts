const TODOIST_SCOPES = 'data:read_write,data:delete'

export function getTodoistAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.TODOIST_CLIENT_ID!,
    scope: TODOIST_SCOPES,
    state,
  })
  return `https://todoist.com/oauth/authorize?${params}`
}

export async function exchangeTodoistCode(code: string): Promise<{
  access_token: string
  token_type: string
}> {
  const response = await fetch('https://todoist.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TODOIST_CLIENT_ID!,
      client_secret: process.env.TODOIST_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.TODOIST_REDIRECT_URI!,
    }),
  })

  if (!response.ok) {
    throw new Error(`Todoist token exchange failed: ${response.statusText}`)
  }

  return response.json()
}
