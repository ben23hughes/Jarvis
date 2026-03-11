import { createHmac } from 'crypto'
import { getOAuthToken } from '@/lib/oauth/token-store'

async function coinbaseFetch(userId: string, path: string) {
  const token = await getOAuthToken(userId, 'coinbase')
  if (!token) throw new Error('Coinbase not connected. Add your API keys in Settings → Integrations.')

  const apiKey = token.access_token
  const apiSecret = (token.provider_metadata as { secret?: string })?.secret ?? ''

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const message = timestamp + 'GET' + path
  const signature = createHmac('sha256', apiSecret).update(message).digest('hex')

  const res = await fetch(`https://api.coinbase.com${path}`, {
    headers: {
      'CB-ACCESS-KEY': apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-VERSION': '2016-02-18',
    },
  })
  if (!res.ok) throw new Error(`Coinbase API error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.data
}

export async function getCoinbaseAccounts(userId: string) {
  return coinbaseFetch(userId, '/v2/accounts?limit=100')
}

export async function getCoinbaseTransactions(userId: string, accountId: string, limit = 25) {
  return coinbaseFetch(userId, `/v2/accounts/${accountId}/transactions?limit=${limit}`)
}

export async function getCoinbasePortfolio(userId: string) {
  const accounts = await getCoinbaseAccounts(userId)
  return (accounts ?? []).filter(
    (a: { balance: { amount: string } }) => parseFloat(a.balance.amount) > 0
  )
}

export async function getCryptoSpotPrice(currencyPair: string) {
  // Public endpoint — no auth needed
  const res = await fetch(`https://api.coinbase.com/v2/prices/${currencyPair}/spot`, {
    headers: { 'CB-VERSION': '2016-02-18' },
  })
  if (!res.ok) throw new Error(`Coinbase price error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.data
}
