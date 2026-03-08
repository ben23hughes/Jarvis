export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
}

export async function webSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY is not set')
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: maxResults,
      search_depth: 'basic',
      include_answer: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.statusText}`)
  }

  const data = await response.json()
  return (data.results ?? []).map((r: SearchResult) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    score: r.score,
  }))
}
