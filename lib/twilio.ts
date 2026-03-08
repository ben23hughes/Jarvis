import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

function getTwilioClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
}

export async function sendSms(to: string, body: string): Promise<void> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio is not configured')
  }
  const client = getTwilioClient()
  await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  })
}

export async function getUserPhoneNumber(userId: string): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabase
    .from('profiles')
    .select('phone_number')
    .eq('id', userId)
    .single()

  return data?.phone_number ?? null
}

export async function sendSmsToUser(userId: string, body: string): Promise<void> {
  const phone = await getUserPhoneNumber(userId)
  if (!phone) throw new Error('User has no phone number configured')
  await sendSms(phone, body)
}
