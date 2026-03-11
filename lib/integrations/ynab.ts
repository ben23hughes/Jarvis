import { getValidToken } from '@/lib/oauth/token-refresh'

async function ynabFetch(userId: string, path: string) {
  const token = await getValidToken(userId, 'ynab')
  const res = await fetch(`https://api.ynab.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`YNAB API error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.data
}

export async function getYnabBudgets(userId: string) {
  const data = await ynabFetch(userId, '/budgets?include_accounts=true')
  return data.budgets ?? []
}

export async function getYnabAccounts(userId: string, budgetId = 'last-used') {
  const data = await ynabFetch(userId, `/budgets/${budgetId}/accounts`)
  return (data.accounts ?? []).filter((a: { closed: boolean }) => !a.closed)
}

export async function getYnabTransactions(userId: string, budgetId = 'last-used', sinceDays = 30) {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const data = await ynabFetch(userId, `/budgets/${budgetId}/transactions?since_date=${since}`)
  return data.transactions ?? []
}

export async function getYnabCategoryGroups(userId: string, budgetId = 'last-used') {
  const data = await ynabFetch(userId, `/budgets/${budgetId}/categories`)
  return data.category_groups ?? []
}

export async function getYnabBudgetSummary(userId: string, budgetId = 'last-used') {
  // Get current month budget vs actual
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const data = await ynabFetch(userId, `/budgets/${budgetId}/months/${month}`)
  return data.month
}
