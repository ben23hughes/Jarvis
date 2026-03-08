import { createClient } from '@/lib/supabase/server'
import { listContacts, createContact } from '@/lib/contacts'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreateSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? undefined

  const contacts = await listContacts(user.id, query)
  return NextResponse.json({ contacts })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const contact = await createContact(user.id, parsed.data)
  return NextResponse.json({ contact }, { status: 201 })
}
