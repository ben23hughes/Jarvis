async function geocode(location: string): Promise<{ lat: number; lon: number; name: string; country: string }> {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`)
  if (!res.ok) throw new Error(`Geocoding error ${res.status}`)
  const data = await res.json()
  const r = data.results?.[0]
  if (!r) throw new Error(`Location not found: ${location}`)
  return { lat: r.latitude, lon: r.longitude, name: r.name, country: r.country }
}

async function weatherFetch(lat: number, lon: number, params: string) {
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&${params}&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`)
  if (!res.ok) throw new Error(`Weather API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function getCurrentWeather(location: string) {
  const { lat, lon, name, country } = await geocode(location)
  const data = await weatherFetch(lat, lon, 'current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover,visibility')
  return {
    location: `${name}, ${country}`,
    ...data.current,
    units: data.current_units,
  }
}

export async function getWeatherForecast(location: string, days = 5) {
  const { lat, lon, name, country } = await geocode(location)
  const data = await weatherFetch(lat, lon, `daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max,sunrise,sunset&forecast_days=${days}`)
  const daily = (data.daily.time as string[]).map((date: string, i: number) => ({
    date,
    temp_max: data.daily.temperature_2m_max[i],
    temp_min: data.daily.temperature_2m_min[i],
    weather_code: data.daily.weather_code[i],
    precipitation_sum: data.daily.precipitation_sum[i],
    wind_speed_max: data.daily.wind_speed_10m_max[i],
    sunrise: data.daily.sunrise[i],
    sunset: data.daily.sunset[i],
  }))
  return { location: `${name}, ${country}`, daily, units: data.daily_units }
}
