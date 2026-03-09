import { getValidToken } from '@/lib/oauth/token-refresh'

async function fbFetch(token: string, path: string) {
  const url = new URL(`https://graph.facebook.com/v19.0${path}`)
  url.searchParams.set('access_token', token)
  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Instagram API error ${res.status}: ${text}`)
  }
  return res.json()
}

interface IgAccount {
  igId: string
  token: string
}

async function getIgAccount(userId: string): Promise<IgAccount> {
  // Instagram uses the Facebook token (same OAuth connection)
  const token = await getValidToken(userId, 'instagram')
  const pages = await fbFetch(token, '/me/accounts?fields=id,access_token,instagram_business_account')
  const page = (pages.data ?? []).find(
    (p: { instagram_business_account?: { id: string } }) => p.instagram_business_account
  )
  if (!page) {
    throw new Error(
      'No Instagram Business or Creator account connected. Make sure your Instagram account is linked to a Facebook Page.'
    )
  }
  return { igId: page.instagram_business_account.id, token: page.access_token }
}

export async function getInstagramProfile(userId: string) {
  const { igId, token } = await getIgAccount(userId)
  return fbFetch(
    token,
    `/${igId}?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website`
  )
}

export async function getInstagramMedia(userId: string, limit = 12) {
  const { igId, token } = await getIgAccount(userId)
  const data = await fbFetch(
    token,
    `/${igId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink&limit=${limit}`
  )
  return data.data ?? []
}

export async function createInstagramPost(userId: string, imageUrl: string, caption: string) {
  const { igId, token } = await getIgAccount(userId)

  // Step 1: Create media container
  const containerUrl = new URL(`https://graph.facebook.com/v19.0/${igId}/media`)
  containerUrl.searchParams.set('access_token', token)
  const containerRes = await fetch(containerUrl.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption }),
  })
  const container = await containerRes.json()
  if (!container.id) throw new Error(`Container creation failed: ${JSON.stringify(container)}`)

  // Step 2: Publish the container
  const publishUrl = new URL(`https://graph.facebook.com/v19.0/${igId}/media_publish`)
  publishUrl.searchParams.set('access_token', token)
  const publishRes = await fetch(publishUrl.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id }),
  })
  return publishRes.json()
}
