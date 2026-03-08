export type IntegrationProvider = 'google_calendar' | 'gmail' | 'slack' | 'linear'

export interface OAuthToken {
  id: string
  user_id: string
  provider: IntegrationProvider
  access_token: string
  refresh_token?: string
  token_type: string
  scope?: string
  expires_at?: string
  provider_account_id?: string
  provider_metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface IntegrationStatus {
  provider: IntegrationProvider
  connected: boolean
  account_id?: string
  metadata?: Record<string, unknown>
}
