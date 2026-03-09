import { getValidToken } from '@/lib/oauth/token-refresh'

async function fbFetch(token: string, path: string, options?: RequestInit) {
  const url = new URL(`https://graph.facebook.com/v19.0${path}`)
  url.searchParams.set('access_token', token)
  const res = await fetch(url.toString(), options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Facebook API error ${res.status}: ${text}`)
  }
  return res.json()
}

async function getPageToken(userToken: string, pageId: string): Promise<string> {
  const pages = await fbFetch(userToken, '/me/accounts?fields=id,access_token')
  const page = (pages.data ?? []).find((p: { id: string }) => p.id === pageId)
  return page?.access_token ?? userToken
}

export async function getMyPages(userId: string) {
  const token = await getValidToken(userId, 'facebook')
  const data = await fbFetch(token, '/me/accounts?fields=id,name,category,fan_count,followers_count')
  return data.data ?? []
}

export async function getPagePosts(userId: string, pageId: string, limit = 10) {
  const token = await getValidToken(userId, 'facebook')
  const pageToken = await getPageToken(token, pageId)
  const data = await fbFetch(
    pageToken,
    `/${pageId}/posts?fields=id,message,story,created_time,full_picture,shares&limit=${limit}`
  )
  return data.data ?? []
}

export async function postToPage(userId: string, pageId: string, message: string) {
  const token = await getValidToken(userId, 'facebook')
  const pageToken = await getPageToken(token, pageId)
  const url = new URL(`https://graph.facebook.com/v19.0/${pageId}/feed`)
  url.searchParams.set('access_token', pageToken)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error(`Facebook post failed: ${await res.text()}`)
  return res.json()
}
