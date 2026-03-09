import { createClient } from '@/lib/supabase/server'
import { getOAuthToken } from '@/lib/oauth/token-store'
import { upsertContactsFromSync } from '@/lib/contacts'
import { NextResponse } from 'next/server'
import type { CreateContactInput } from '@/types/contacts'

// ── CardDAV helpers ────────────────────────────────────────────────────────────

async function davRequest(
  url: string,
  method: string,
  auth: string,
  body?: string,
  extraHeaders?: Record<string, string>
): Promise<{ status: number; text: string; headers: Headers }> {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      Authorization: `Basic ${auth}`,
      ...extraHeaders,
    },
    body,
    redirect: 'follow',
  })
  return { status: res.status, text: await res.text(), headers: res.headers }
}

function xmlFirst(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<(?:[\\w-]+:)?${tag}[^>]*>\\s*([^<\\s][^<]*?)\\s*</`, 'i'))
  return match ? match[1].trim() : ''
}

function xmlAll(xml: string, tag: string): string[] {
  const results: string[] = []
  const re = new RegExp(`<(?:[\\w-]+:)?${tag}[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${tag}>`, 'gi')
  let m
  while ((m = re.exec(xml)) !== null) results.push(m[1])
  return results
}

async function discoverAddressbookUrl(auth: string): Promise<string> {
  const wellKnown = 'https://contacts.icloud.com/.well-known/carddav'

  // Step 1: Get current-user-principal
  const propfindPrincipal = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop><D:current-user-principal/></D:prop>
</D:propfind>`

  const r1 = await davRequest(wellKnown, 'PROPFIND', auth, propfindPrincipal, { Depth: '0' })
  if (r1.status >= 400) throw new Error(`iCloud auth failed (${r1.status}). Check your Apple ID and app-specific password.`)

  const principalHref = xmlFirst(r1.text, 'href')
  if (!principalHref) throw new Error('Could not find principal URL in iCloud response')

  const principalUrl = principalHref.startsWith('http')
    ? principalHref
    : `https://contacts.icloud.com${principalHref}`

  // Step 2: Get addressbook-home-set from principal
  const propfindHome = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
  <D:prop><C:addressbook-home-set/></D:prop>
</D:propfind>`

  const r2 = await davRequest(principalUrl, 'PROPFIND', auth, propfindHome, { Depth: '0' })
  const homeHref = xmlFirst(r2.text, 'href')
  if (!homeHref) throw new Error('Could not find addressbook home in iCloud response')

  const homeUrl = homeHref.startsWith('http')
    ? homeHref
    : `https://contacts.icloud.com${homeHref}`

  // Step 3: List addressbooks
  const propfindBooks = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
  <D:prop>
    <D:resourcetype/>
    <D:displayname/>
  </D:prop>
</D:propfind>`

  const r3 = await davRequest(homeUrl, 'PROPFIND', auth, propfindBooks, { Depth: '1' })
  // Find response hrefs that have addressbook resourcetype
  const responses = xmlAll(r3.text, 'response')
  for (const resp of responses) {
    if (resp.toLowerCase().includes('addressbook')) {
      const href = xmlFirst(resp, 'href')
      if (href && href !== homeHref) {
        return href.startsWith('http') ? href : `https://contacts.icloud.com${href}`
      }
    }
  }

  // Fallback: use the home URL itself
  return homeUrl
}

async function fetchAllVCards(addressbookUrl: string, auth: string): Promise<string[]> {
  const report = `<?xml version="1.0" encoding="utf-8"?>
<C:addressbook-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
  <D:prop>
    <D:getetag/>
    <C:address-data/>
  </D:prop>
</C:addressbook-query>`

  const r = await davRequest(addressbookUrl, 'REPORT', auth, report, { Depth: '1' })
  return xmlAll(r.text, 'address-data')
}

// ── vCard parser (shared logic) ────────────────────────────────────────────────

function parseVCards(text: string): CreateContactInput[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, '')
  const blocks = unfolded.split(/BEGIN:VCARD/i).slice(1)

  return blocks
    .map((block) => {
      const getVal = (prop: string) => {
        const m = block.match(new RegExp(`^${prop}(?:;[^:]*)?:(.+)$`, 'im'))
        return m ? m[1].trim() : ''
      }
      const fn = getVal('FN')
      const n = getVal('N')
      const parts = n.split(';')
      const firstName = (parts[1] || '').trim() || fn
      const lastName = (parts[0] || '').trim()

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

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tokenRow = await getOAuthToken(user.id, 'apple_contacts')
  if (!tokenRow) {
    return NextResponse.json({ error: 'iCloud credentials not saved. Enter your Apple ID and app-specific password first.' }, { status: 400 })
  }

  const appleId = tokenRow.provider_account_id!
  const appPassword = tokenRow.access_token
  const auth = Buffer.from(`${appleId}:${appPassword}`).toString('base64')

  try {
    const addressbookUrl = await discoverAddressbookUrl(auth)
    const vcardTexts = await fetchAllVCards(addressbookUrl, auth)

    const contacts = vcardTexts.flatMap((text) => parseVCards(`BEGIN:VCARD\n${text}`))
    const result = await upsertContactsFromSync(user.id, contacts)
    return NextResponse.json(result)
  } catch (err) {
    console.error('CardDAV sync error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'CardDAV sync failed' },
      { status: 500 }
    )
  }
}
