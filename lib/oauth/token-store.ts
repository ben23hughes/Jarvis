import { createClient } from '@supabase/supabase-js'
import type { IntegrationProvider, OAuthToken } from '@/types/integrations'

// Service-role client that bypasses RLS — only used server-side
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface StoreTokenParams {
  userId: string
  provider: IntegrationProvider
  accessToken: string
  refreshToken?: string
  expiresIn?: number // seconds
  scope?: string
  providerAccountId?: string
  providerMetadata?: Record<string, unknown>
}

export async function storeOAuthToken(params: StoreTokenParams): Promise<void> {
  const supabase = getServiceClient()

  const expiresAt = params.expiresIn
    ? new Date(Date.now() + params.expiresIn * 1000).toISOString()
    : null

  const { error } = await supabase.from('oauth_tokens').upsert(
    {
      user_id: params.userId,
      provider: params.provider,
      access_token: params.accessToken,
      refresh_token: params.refreshToken ?? null,
      expires_at: expiresAt,
      scope: params.scope ?? null,
      provider_account_id: params.providerAccountId ?? null,
      provider_metadata: params.providerMetadata ?? {},
    },
    { onConflict: 'user_id,provider' }
  )

  if (error) throw new Error(`Failed to store token: ${error.message}`)
}

export async function getOAuthToken(
  userId: string,
  provider: IntegrationProvider
): Promise<OAuthToken | null> {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single()

  if (error || !data) return null
  return data as OAuthToken
}

export async function deleteOAuthToken(
  userId: string,
  provider: IntegrationProvider
): Promise<void> {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('oauth_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)

  if (error) throw new Error(`Failed to delete token: ${error.message}`)
}

export async function getConnectedProviders(userId: string): Promise<IntegrationProvider[]> {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('provider')
    .eq('user_id', userId)

  if (error || !data) return []
  return data.map((row: { provider: IntegrationProvider }) => row.provider)
}
