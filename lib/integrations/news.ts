async function newsFetch(path: string) {
  const key = process.env.NEWS_API_KEY
  if (!key) throw new Error('NEWS_API_KEY not configured')
  const res = await fetch(`https://newsapi.org/v2${path}&apiKey=${key}`)
  if (!res.ok) throw new Error(`NewsAPI error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function getTopHeadlines(params: {
  country?: string // e.g. 'us'
  category?: string // business, entertainment, health, science, sports, technology
  query?: string
  pageSize?: number
}) {
  const q = new URLSearchParams()
  if (params.country) q.set('country', params.country)
  if (params.category) q.set('category', params.category)
  if (params.query) q.set('q', params.query)
  q.set('pageSize', String(params.pageSize ?? 10))
  const data = await newsFetch(`/top-headlines?${q}`)
  return data.articles ?? []
}

export async function searchNews(
  query: string,
  params?: {
    language?: string
    sortBy?: 'relevancy' | 'popularity' | 'publishedAt'
    pageSize?: number
    from?: string // ISO date
  }
) {
  const q = new URLSearchParams()
  q.set('q', query)
  if (params?.language) q.set('language', params.language)
  if (params?.sortBy) q.set('sortBy', params.sortBy)
  q.set('pageSize', String(params?.pageSize ?? 10))
  if (params?.from) q.set('from', params.from)
  const data = await newsFetch(`/everything?${q}`)
  return data.articles ?? []
}
