import { getOAuthToken } from '@/lib/oauth/token-store'

async function alpacaFetch(userId: string, path: string) {
  const token = await getOAuthToken(userId, 'alpaca')
  if (!token) throw new Error('Alpaca not connected. Add your API keys in Settings → Integrations.')

  const keyId = token.access_token
  const secretKey = (token.provider_metadata as { secret?: string })?.secret ?? ''
  const paper = (token.provider_metadata as { paper?: boolean })?.paper ?? false
  const baseUrl = paper ? 'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets'

  const res = await fetch(`${baseUrl}${path}`, {
    headers: {
      'APCA-API-KEY-ID': keyId,
      'APCA-API-SECRET-KEY': secretKey,
    },
  })
  if (!res.ok) throw new Error(`Alpaca API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function getAlpacaAccount(userId: string) {
  return alpacaFetch(userId, '/v2/account')
}

export async function getAlpacaPositions(userId: string) {
  return alpacaFetch(userId, '/v2/positions')
}

export async function getAlpacaPortfolioHistory(userId: string, period = '1M') {
  return alpacaFetch(userId, `/v2/account/portfolio/history?period=${period}&timeframe=1D`)
}

export async function getAlpacaOrders(userId: string, status = 'all', limit = 20) {
  return alpacaFetch(userId, `/v2/orders?status=${status}&limit=${limit}&direction=desc`)
}
