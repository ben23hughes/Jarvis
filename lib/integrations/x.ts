import { getValidToken } from '@/lib/oauth/token-refresh'

async function xFetch(userId: string, path: string, options?: RequestInit) {
  const token = await getValidToken(userId, 'x')
  const res = await fetch(`https://api.twitter.com/2${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`X API error ${res.status}: ${text}`)
  }
  return res.json()
}

let _myIdCache: Record<string, string> = {}

async function getMyXUserId(userId: string): Promise<string> {
  if (_myIdCache[userId]) return _myIdCache[userId]
  const data = await xFetch(userId, '/users/me')
  _myIdCache[userId] = data.data.id
  return data.data.id
}

export async function getMyTweets(userId: string, maxResults = 10) {
  const xUserId = await getMyXUserId(userId)
  const data = await xFetch(
    userId,
    `/users/${xUserId}/tweets?max_results=${maxResults}&tweet.fields=created_at,text,public_metrics`
  )
  return data.data ?? []
}

export async function getMyMentions(userId: string, maxResults = 10) {
  const xUserId = await getMyXUserId(userId)
  const data = await xFetch(
    userId,
    `/users/${xUserId}/mentions?max_results=${maxResults}&tweet.fields=created_at,text,author_id,public_metrics`
  )
  return data.data ?? []
}

export async function searchTweets(userId: string, query: string, maxResults = 10) {
  const data = await xFetch(
    userId,
    `/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}&tweet.fields=created_at,text,author_id,public_metrics`
  )
  return data.data ?? []
}

export async function postTweet(userId: string, text: string) {
  const data = await xFetch(userId, '/tweets', {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
  return data.data
}
