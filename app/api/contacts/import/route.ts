import { createClient } from '@/lib/supabase/server'
import { importContactsFromCsv } from '@/lib/contacts'
import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text = await file.text()
    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as Record<string, string>[]

    if (rows.length > 5000) {
      return NextResponse.json({ error: 'Max 5000 contacts per import' }, { status: 400 })
    }

    const result = await importContactsFromCsv(user.id, rows)
    return NextResponse.json(result)
  } catch (err) {
    console.error('CSV import error:', err)
    return NextResponse.json({ error: 'Failed to parse CSV' }, { status: 400 })
  }
}
