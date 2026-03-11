const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-top-read',
  'user-read-recently-played',
].join(' ')

export function getSpotifyAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
    scope: SPOTIFY_SCOPES,
  })
  return `https://accounts.spotify.com/authorize?${params}`
}

function spotifyBasicAuth(): string {
  return Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64')
}

export async function exchangeSpotifyCode(
  code: string,
  verifier: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number; scope: string }> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${spotifyBasicAuth()}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      code_verifier: verifier,
    }),
  })

  if (!response.ok) {
    throw new Error(`Spotify token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

export async function refreshSpotifyToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${spotifyBasicAuth()}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Spotify token refresh failed: ${response.statusText}`)
  }

  return response.json()
}
