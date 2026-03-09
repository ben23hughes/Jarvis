/**
 * LeadVault integration — shared read-only access to the LeadVault leads database.
 * Uses service role key (bypasses RLS) since Jarvis users aren't in LeadVault's auth.users.
 *
 * Env vars required:
 *   LEADVAULT_URL           — Supabase project URL
 *   LEADVAULT_SERVICE_KEY   — Service role key
 */

import { createClient } from '@supabase/supabase-js'

function getClient() {
  const url = process.env.LEADVAULT_URL
  const key = process.env.LEADVAULT_SERVICE_KEY
  if (!url || !key) throw new Error('LeadVault is not configured (missing LEADVAULT_URL or LEADVAULT_SERVICE_KEY).')
  return createClient(url, key)
}

// ── Schema reference ───────────────────────────────────────────────────────
// leads table columns used here:
//   first_name, last_name, company_name, industry, employee_count_range,
//   company_revenue_range, email, email_status, persona_type,
//   city, state_region, country, phone_number, website_domain,
//   title_position, address, source_type, special_tag,
//   is_duplicate, deleted_at

export interface LeadFilter {
  state?: string          // matches state_region (ilike)
  city?: string           // matches city (ilike)
  industry?: string       // matches industry (ilike)
  company?: string        // matches company_name (ilike)
  title?: string          // matches title_position (ilike)
  email_status?: string   // exact: 'valid' | 'invalid' | 'risky' | 'unknown'
  source_type?: string    // exact: 'linkedin' | 'google_maps' | 'apollo' | 'web_scrape' | 'other' | 'enriched'
  persona_type?: string   // exact: 'company' | 'person'
  employee_range?: string // matches employee_count_range (ilike)
  revenue_range?: string  // matches company_revenue_range (ilike)
  country?: string        // matches country (ilike)
  special_tag?: string    // exact match
}

const SELECT_COLS = [
  'first_name', 'last_name', 'company_name', 'title_position',
  'email', 'email_status', 'phone_number', 'website_domain',
  'city', 'state_region', 'country', 'address',
  'industry', 'employee_count_range', 'company_revenue_range',
  'persona_type', 'source_type', 'special_tag', 'linkedin_url',
].join(', ')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, filter: LeadFilter): any {
  // Always exclude soft-deleted and duplicate rows
  query = query.is('deleted_at', null).eq('is_duplicate', false)

  if (filter.state)         query = query.ilike('state_region', `%${filter.state}%`)
  if (filter.city)          query = query.ilike('city', `%${filter.city}%`)
  if (filter.industry)      query = query.ilike('industry', `%${filter.industry}%`)
  if (filter.company)       query = query.ilike('company_name', `%${filter.company}%`)
  if (filter.title)         query = query.ilike('title_position', `%${filter.title}%`)
  if (filter.country)       query = query.ilike('country', `%${filter.country}%`)
  if (filter.employee_range) query = query.ilike('employee_count_range', `%${filter.employee_range}%`)
  if (filter.revenue_range)  query = query.ilike('company_revenue_range', `%${filter.revenue_range}%`)
  if (filter.email_status)  query = query.eq('email_status', filter.email_status)
  if (filter.source_type)   query = query.eq('source_type', filter.source_type)
  if (filter.persona_type)  query = query.eq('persona_type', filter.persona_type)
  if (filter.special_tag)   query = query.eq('special_tag', filter.special_tag)

  return query
}

// ── Count ──────────────────────────────────────────────────────────────────

export async function countLeads(filter: LeadFilter = {}): Promise<number> {
  const client = getClient()
  let query = client.from('leads').select('*', { count: 'exact', head: true })
  query = applyFilters(query, filter)
  const { count, error } = await query
  if (error) throw new Error(`LeadVault count failed: ${error.message}`)
  return count ?? 0
}

// ── Search / preview ───────────────────────────────────────────────────────

export async function searchLeads(
  filter: LeadFilter = {},
  limit = 25
): Promise<Record<string, unknown>[]> {
  const client = getClient()
  let query = client.from('leads').select(SELECT_COLS).limit(limit)
  query = applyFilters(query, filter)
  const { data, error } = await query
  if (error) throw new Error(`LeadVault search failed: ${error.message}`)
  return ((data as unknown) as Record<string, unknown>[]) ?? []
}

// ── CSV export ─────────────────────────────────────────────────────────────

export async function exportLeadsAsCsv(
  filter: LeadFilter = {},
  maxRows = 10_000
): Promise<{ csv: string; count: number }> {
  const client = getClient()
  let query = client.from('leads').select(SELECT_COLS).limit(maxRows)
  query = applyFilters(query, filter)
  const { data, error } = await query
  if (error) throw new Error(`LeadVault export failed: ${error.message}`)

  const rows = ((data as unknown) as Record<string, unknown>[]) ?? []
  if (rows.length === 0) return { csv: '', count: 0 }

  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ]

  return { csv: lines.join('\n'), count: rows.length }
}

// ── Stats (for system prompt awareness) ───────────────────────────────────

export async function getLeadVaultStats(): Promise<{ total: number; by_state: Record<string, number> } | null> {
  try {
    const client = getClient()
    const { count } = await client
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('is_duplicate', false)
    return { total: count ?? 0, by_state: {} }
  } catch {
    return null
  }
}
