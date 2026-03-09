import { getOAuthToken, storeOAuthToken } from './token-store'
import { refreshZoomToken } from './zoom'
import { refreshMicrosoftToken } from './microsoft-teams'
import type { IntegrationProvider } from '@/types/integrations'

const REFRESH_BUFFER_MS = 5 * 60 * 1000 // 5 minutes

export async function getValidToken(
  userId: string,
  provider: IntegrationProvider
): Promise<string> {
  const token = await getOAuthToken(userId, provider)
  if (!token) throw new Error(`No token found for provider: ${provider}`)

  // These providers use non-expiring tokens
  if (provider === 'linear' || provider === 'slack' || provider === 'github' || provider === 'notion') {
    return token.access_token
  }

  // Check if token is still valid
  if (token.expires_at) {
    const expiresAt = new Date(token.expires_at).getTime()
    if (Date.now() < expiresAt - REFRESH_BUFFER_MS) {
      return token.access_token
    }
  }

  // Token expired — refresh it
  if (!token.refresh_token) {
    throw new Error(`Token expired and no refresh token available for: ${provider}`)
  }

  if (provider === 'google_calendar' || provider === 'gmail' || provider === 'google_drive') {
    return refreshGoogleToken(userId, token.refresh_token)
  }

  if (provider === 'zoom') {
    const data = await refreshZoomToken(token.refresh_token)
    await storeOAuthToken({
      userId,
      provider: 'zoom',
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    })
    return data.access_token
  }

  if (provider === 'microsoft_teams') {
    const data = await refreshMicrosoftToken(token.refresh_token)
    await storeOAuthToken({
      userId,
      provider: 'microsoft_teams',
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    })
    return data.access_token
  }

  throw new Error(`Unknown provider for refresh: ${provider}`)
}

async function refreshGoogleToken(userId: string, refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${response.statusText}`)
  }

  const data = await response.json()

  // Store refreshed token for both google providers since they share creds
  await storeOAuthToken({
    userId,
    provider: 'google_calendar',
    accessToken: data.access_token,
    refreshToken: refreshToken, // Google doesn't always return a new refresh token
    expiresIn: data.expires_in,
    scope: data.scope,
  })

  await storeOAuthToken({
    userId,
    provider: 'gmail',
    accessToken: data.access_token,
    refreshToken: refreshToken,
    expiresIn: data.expires_in,
    scope: data.scope,
  })

  await storeOAuthToken({
    userId,
    provider: 'google_drive',
    accessToken: data.access_token,
    refreshToken: refreshToken,
    expiresIn: data.expires_in,
    scope: data.scope,
  })

  return data.access_token
}
