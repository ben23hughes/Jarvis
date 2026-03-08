export function getNotionAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.NOTION_CLIENT_ID!,
    redirect_uri: process.env.NOTION_REDIRECT_URI!,
    response_type: 'code',
    owner: 'user',
    state,
  })
  return `https://api.notion.com/v1/oauth/authorize?${params}`
}

export async function exchangeNotionCode(code: string): Promise<{
  access_token: string
  workspace_id: string
  workspace_name: string
  workspace_icon?: string
  bot_id: string
}> {
  const credentials = Buffer.from(
    `${process.env.NOTION_CLIENT_ID!}:${process.env.NOTION_CLIENT_SECRET!}`
  ).toString('base64')

  const response = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NOTION_REDIRECT_URI!,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Notion token exchange failed: ${err}`)
  }

  return response.json()
}
