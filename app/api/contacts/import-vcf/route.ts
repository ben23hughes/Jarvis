import { createClient } from '@/lib/supabase/server'
import { upsertContactsFromSync } from '@/lib/contacts'
import { NextResponse } from 'next/server'
import type { CreateContactInput } from '@/types/contacts'

// Strip fields with large binary payloads before parsing (photos, sounds, etc.)
// Must remove the header line AND its folded continuation lines (which start with whitespace).
function stripBinaryFields(text: string): string {
  const lines = text.split(/\r?\n/)
  const result: string[] = []
  let skipping = false

  for (const line of lines) {
    const isContinuation = line.startsWith(' ') || line.startsWith('\t')
    if (skipping && isContinuation) continue  // drop continuation of binary prop
    skipping = false
    if (/^(PHOTO|SOUND|LOGO|KEY|X-ABCROP)[;:]/i.test(line)) {
      skipping = true  // drop this line and its continuations
      continue
    }
    result.push(line)
  }

  return result.join('\n')
}

function parseVCards(text: string): CreateContactInput[] {
  // Strip binary fields first to avoid huge strings in memory
  const stripped = stripBinaryFields(text)

  // Unfold continuation lines (lines starting with whitespace are continuations)
  const unfolded = stripped.replace(/\r?\n[ \t]/g, '')

  const blocks = unfolded.split(/BEGIN:VCARD/i).slice(1)

  return blocks
    .map((block) => {
      const getVal = (prop: string): string => {
        const match = block.match(new RegExp(`^${prop}(?:;[^:]*)?:(.+)$`, 'im'))
        return match ? match[1].trim() : ''
      }

      const fn = getVal('FN')
      const n = getVal('N')
      const parts = n.split(';')
      const lastName = (parts[0] || '').trim()
      const firstName = (parts[1] || '').trim() || fn

      const emailMatch = block.match(/^EMAIL(?:;[^:]*)?:(.+)$/im)
      const email = emailMatch ? emailMatch[1].trim() : ''

      const telMatch = block.match(/^TEL(?:;[^:]*)?:(.+)$/im)
      const phone = telMatch ? telMatch[1].trim() : ''

      const orgRaw = getVal('ORG')
      const company = orgRaw.split(';')[0].trim()

      const title = getVal('TITLE')

      return { first_name: firstName, last_name: lastName, email, phone, company, title }
    })
    .filter((c) => c.first_name) as CreateContactInput[]
}

// Tell Next.js not to limit the request body for this route
export const config = {
  api: { bodyParser: false },
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text = await file.text()
    const contacts = parseVCards(text)

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No valid contacts found in vCard file' }, { status: 400 })
    }
    if (contacts.length > 5000) {
      return NextResponse.json({ error: 'Max 5000 contacts per import' }, { status: 400 })
    }

    const result = await upsertContactsFromSync(user.id, contacts)
    return NextResponse.json(result)
  } catch (err) {
    console.error('vCard import error:', err)
    return NextResponse.json({ error: 'Failed to parse vCard file' }, { status: 400 })
  }
}
