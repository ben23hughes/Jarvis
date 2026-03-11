async function yelpFetch(path: string) {
  const key = process.env.YELP_API_KEY
  if (!key) throw new Error('YELP_API_KEY not configured')
  const res = await fetch(`https://api.yelp.com/v3${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`Yelp API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function searchYelp(params: {
  location: string
  term?: string
  categories?: string
  limit?: number
  sort_by?: 'best_match' | 'rating' | 'review_count' | 'distance'
  open_now?: boolean
  price?: string // '1', '1,2', '1,2,3,4'
}) {
  const q = new URLSearchParams()
  q.set('location', params.location)
  if (params.term) q.set('term', params.term)
  if (params.categories) q.set('categories', params.categories)
  if (params.limit) q.set('limit', String(params.limit))
  if (params.sort_by) q.set('sort_by', params.sort_by)
  if (params.open_now) q.set('open_now', 'true')
  if (params.price) q.set('price', params.price)
  const data = await yelpFetch(`/businesses/search?${q}`)
  return data.businesses ?? []
}

export async function getYelpBusiness(id: string) {
  return yelpFetch(`/businesses/${id}`)
}
