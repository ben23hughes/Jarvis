import { cookies } from 'next/headers'

const STATE_COOKIE = 'oauth_state'
const VERIFIER_COOKIE = 'oauth_verifier'

export async function generateState(): Promise<string> {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function setOAuthState(state: string, verifier?: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })
  if (verifier) {
    cookieStore.set(VERIFIER_COOKIE, verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    })
  }
}

export async function validateAndClearOAuthState(
  incomingState: string
): Promise<{ valid: boolean; verifier?: string }> {
  const cookieStore = await cookies()
  const storedState = cookieStore.get(STATE_COOKIE)?.value
  const verifier = cookieStore.get(VERIFIER_COOKIE)?.value

  cookieStore.delete(STATE_COOKIE)
  cookieStore.delete(VERIFIER_COOKIE)

  return {
    valid: storedState === incomingState,
    verifier,
  }
}
