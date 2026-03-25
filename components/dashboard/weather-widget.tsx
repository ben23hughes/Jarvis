'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, Eye, MapPin, CloudLightning, CloudDrizzle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// WMO weather interpretation codes → label + icon
function describeWeather(code: number): { label: string; Icon: React.ElementType } {
  if (code === 0) return { label: 'Clear sky', Icon: Sun }
  if (code <= 2) return { label: 'Partly cloudy', Icon: Cloud }
  if (code === 3) return { label: 'Overcast', Icon: Cloud }
  if (code <= 49) return { label: 'Foggy', Icon: Cloud }
  if (code <= 57) return { label: 'Drizzle', Icon: CloudDrizzle }
  if (code <= 67) return { label: 'Rain', Icon: CloudRain }
  if (code <= 77) return { label: 'Snow', Icon: CloudSnow }
  if (code <= 82) return { label: 'Rain showers', Icon: CloudRain }
  if (code <= 86) return { label: 'Snow showers', Icon: CloudSnow }
  if (code <= 99) return { label: 'Thunderstorm', Icon: CloudLightning }
  return { label: 'Unknown', Icon: Cloud }
}

interface WeatherData {
  city: string
  temp: number
  feels_like: number
  humidity: number
  wind_speed: number
  visibility: number
  weather_code: number
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords

          const [weatherRes, geoRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,visibility&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`),
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
              headers: { 'Accept-Language': 'en' },
            }),
          ])

          const weatherData = await weatherRes.json()
          const geoData = await geoRes.json()

          const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || 'Your location'
          const c = weatherData.current

          setWeather({
            city,
            temp: Math.round(c.temperature_2m),
            feels_like: Math.round(c.apparent_temperature),
            humidity: c.relative_humidity_2m,
            wind_speed: Math.round(c.wind_speed_10m),
            visibility: Math.round((c.visibility ?? 0) / 5280), // meters → miles
            weather_code: c.weather_code,
          })
        } catch {
          setError('Failed to load weather')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('Location permission denied')
        setLoading(false)
      }
    )
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Sun className="h-4 w-4" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Sun className="h-4 w-4" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!weather) return null

  const { label, Icon: WeatherIcon } = describeWeather(weather.weather_code)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Sun className="h-4 w-4" />
          Weather
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MapPin className="h-3 w-3" />
              <span className="text-xs">{weather.city}</span>
            </div>
            <div className="text-4xl font-bold tracking-tight">{weather.temp}°F</div>
            <div className="text-sm text-muted-foreground mt-1">{label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Feels like {weather.feels_like}°F</div>
          </div>
          <WeatherIcon className="h-12 w-12 text-muted-foreground/50" />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
          <div className="flex flex-col items-center gap-1">
            <Droplets className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">{weather.humidity}%</span>
            <span className="text-xs text-muted-foreground">Humidity</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Wind className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium">{weather.wind_speed} mph</span>
            <span className="text-xs text-muted-foreground">Wind</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Eye className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium">{weather.visibility} mi</span>
            <span className="text-xs text-muted-foreground">Visibility</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
