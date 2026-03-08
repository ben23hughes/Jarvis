export interface Reminder {
  id: string
  user_id: string
  message: string
  remind_at: string
  channel: 'sms' | 'email'
  status: 'pending' | 'sent' | 'cancelled'
  sent_at?: string
  created_at: string
  updated_at: string
}
