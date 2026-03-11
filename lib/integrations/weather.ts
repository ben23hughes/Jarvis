async function weatherFetch(path: string) {
  const key = process.env.OPENWEATHERMAP_API_KEY
  if (!key) throw new Error('OPENWEATHERMAP_API_KEY not configured')
  const res = await fetch(`https://api.openweathermap.org/data/2.5${path}&appid=${key}&units=imperial`)
  if (!res.ok) throw new Error(`Weather API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function getCurrentWeather(location: string) {
  return weatherFetch(`/weather?q=${encodeURIComponent(location)}`)
}

export async function getWeatherForecast(location: string, days = 5) {
  // cnt = number of 3-hour intervals. 8 per day.
  const cnt = days * 8
  const data = await weatherFetch(`/forecast?q=${encodeURIComponent(location)}&cnt=${cnt}`)
  // Return daily summary (take one reading per day at noon)
  const byDay: Record<string, unknown[]> = {}
  for (const item of data.list) {
    const date = (item.dt_txt as string).split(' ')[0]
    if (!byDay[date]) byDay[date] = []
    byDay[date].push(item)
  }
  return {
    city: data.city,
    daily: Object.entries(byDay)
      .map(([date, items]) => ({
        date,
        items,
      }))
      .slice(0, days),
  }
}
