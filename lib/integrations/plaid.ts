import { getOAuthToken } from '@/lib/oauth/token-store'

interface PlaidItem {
  access_token: string
  institution_name: string
}

async function plaidFetch(path: string, body: Record<string, unknown>) {
  const env = process.env.PLAID_ENV ?? 'sandbox'
  const res = await fetch(`https://${env}.plaid.com${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      ...body,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Plaid error: ${(err as { error_message?: string }).error_message ?? res.statusText}`)
  }
  return res.json()
}

async function getPlaidItems(userId: string): Promise<PlaidItem[]> {
  const token = await getOAuthToken(userId, 'plaid')
  if (!token) return []
  return (token.provider_metadata?.items as PlaidItem[]) ?? []
}

export async function getPlaidAccounts(userId: string) {
  const items = await getPlaidItems(userId)
  if (items.length === 0)
    throw new Error('No bank accounts connected. Connect a bank in Settings → Integrations.')

  const allAccounts = []
  for (const item of items) {
    const data = await plaidFetch('/accounts/get', { access_token: item.access_token })
    const accounts = (data.accounts ?? []).map((a: Record<string, unknown>) => ({
      ...a,
      institution_name: item.institution_name,
    }))
    allAccounts.push(...accounts)
  }
  return allAccounts
}

export async function getPlaidTransactions(userId: string, days = 30) {
  const items = await getPlaidItems(userId)
  if (items.length === 0) throw new Error('No bank accounts connected.')

  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const allTransactions = []
  for (const item of items) {
    const data = await plaidFetch('/transactions/get', {
      access_token: item.access_token,
      start_date: startDate,
      end_date: endDate,
    })
    allTransactions.push(...(data.transactions ?? []))
  }

  return allTransactions.sort((a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date))
}

export async function getSpendingSummary(userId: string, days = 30) {
  const transactions = await getPlaidTransactions(userId, days)

  // Group by category
  const byCategory: Record<string, number> = {}
  let totalSpent = 0

  for (const tx of transactions) {
    if (tx.amount <= 0) continue // skip credits/refunds
    const category = tx.personal_finance_category?.primary ?? tx.category?.[0] ?? 'Other'
    byCategory[category] = (byCategory[category] ?? 0) + tx.amount
    totalSpent += tx.amount
  }

  return {
    total_spent: Math.round(totalSpent * 100) / 100,
    by_category: Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount),
    transaction_count: transactions.filter((t: { amount: number }) => t.amount > 0).length,
    days,
  }
}
