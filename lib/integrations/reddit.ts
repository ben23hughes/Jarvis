import { getValidToken } from '@/lib/oauth/token-refresh'

async function redditFetch(userId: string, path: string) {
  const token = await getValidToken(userId, 'reddit')
  const res = await fetch(`https://oauth.reddit.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Jarvis/1.0',
    },
  })
  if (!res.ok) throw new Error(`Reddit API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function getSubredditPosts(userId: string, subreddit: string, sort = 'hot', limit = 10) {
  const data = await redditFetch(userId, `/r/${subreddit}/${sort}?limit=${limit}`)
  return (data.data?.children ?? []).map((c: { data: unknown }) => c.data)
}

export async function searchReddit(userId: string, query: string, subreddit?: string, limit = 10) {
  const path = subreddit
    ? `/r/${subreddit}/search?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&limit=${limit}`
    : `/search?q=${encodeURIComponent(query)}&sort=relevance&limit=${limit}`
  const data = await redditFetch(userId, path)
  return (data.data?.children ?? []).map((c: { data: unknown }) => c.data)
}

export async function getMySubreddits(userId: string) {
  const data = await redditFetch(userId, '/subreddits/mine/subscriber?limit=50')
  return (data.data?.children ?? []).map(
    (c: { data: { display_name: string; title: string; subscribers: number } }) => ({
      name: c.data.display_name,
      title: c.data.title,
      subscribers: c.data.subscribers,
    })
  )
}

export async function getHomeFeed(userId: string, limit = 15) {
  const data = await redditFetch(userId, `/best?limit=${limit}`)
  return (data.data?.children ?? []).map((c: { data: unknown }) => c.data)
}
