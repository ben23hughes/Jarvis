import { getValidToken } from '@/lib/oauth/token-refresh'

async function spotifyFetch(userId: string, path: string, options?: RequestInit) {
  const token = await getValidToken(userId, 'spotify')
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) ?? {}),
    },
  })
  if (res.status === 204) return null
  if (!res.ok) throw new Error(`Spotify API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function getNowPlaying(userId: string) {
  return spotifyFetch(userId, '/me/player/currently-playing')
}

export async function getRecentlyPlayed(userId: string, limit = 10) {
  const data = await spotifyFetch(userId, `/me/player/recently-played?limit=${limit}`)
  return data?.items ?? []
}

export async function getTopTracks(userId: string, timeRange = 'short_term', limit = 10) {
  // timeRange: short_term (4 weeks), medium_term (6 months), long_term (all time)
  const data = await spotifyFetch(userId, `/me/top/tracks?time_range=${timeRange}&limit=${limit}`)
  return data?.items ?? []
}

export async function searchSpotify(userId: string, query: string, type = 'track,artist,playlist', limit = 5) {
  const data = await spotifyFetch(userId, `/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`)
  return data
}

export async function controlPlayback(userId: string, action: 'play' | 'pause' | 'next' | 'previous') {
  const methodMap = { play: 'PUT', pause: 'PUT', next: 'POST', previous: 'POST' }
  const pathMap = {
    play: '/me/player/play',
    pause: '/me/player/pause',
    next: '/me/player/next',
    previous: '/me/player/previous',
  }
  await spotifyFetch(userId, pathMap[action], { method: methodMap[action] })
  return { ok: true, action }
}

export async function setVolume(userId: string, volumePercent: number) {
  await spotifyFetch(userId, `/me/player/volume?volume_percent=${volumePercent}`, { method: 'PUT' })
  return { ok: true }
}

export async function createPlaylist(userId: string, name: string, description?: string) {
  const me = await spotifyFetch(userId, '/me')
  const data = await spotifyFetch(userId, `/users/${me.id}/playlists`, {
    method: 'POST',
    body: JSON.stringify({ name, description: description ?? '', public: false }),
  })
  return data
}
