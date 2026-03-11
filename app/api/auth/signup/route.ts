import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { accessCode, name, email, password } = await request.json()

  const validCode = process.env.SIGNUP_ACCESS_CODE
  if (!validCode || accessCode !== validCode) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 403 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jarvis4.com'}/api/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
