import { getOAuthToken } from '@/lib/oauth/token-store'

// ── CalDAV helpers ──────────────────────────────────────────────

async function davRequest(
  url: string,
  method: string,
  auth: string,
  body?: string,
  extraHeaders?: Record<string, string>
): Promise<{ status: number; text: string }> {
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
  return { status: res.status, text: await res.text() }
}

function xmlFirst(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<(?:[\\w-]+:)?${tag}[^>]*>\\s*([^<\\s][^<]*?)\\s*</`, 'i'))
  return m ? m[1].trim() : ''
}

function xmlAll(xml: string, tag: string): string[] {
  const results: string[] = []
  const re = new RegExp(`<(?:[\\w-]+:)?${tag}[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${tag}>`, 'gi')
  let m
  while ((m = re.exec(xml)) !== null) results.push(m[1])
  return results
}

async function discoverCalendarHomeUrl(auth: string): Promise<string> {
  const wellKnown = 'https://caldav.icloud.com/.well-known/caldav'

  const propfindPrincipal = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop><D:current-user-principal/></D:prop>
</D:propfind>`

  const r1 = await davRequest(wellKnown, 'PROPFIND', auth, propfindPrincipal, { Depth: '0' })
  if (r1.status >= 400) throw new Error(`iCloud auth failed (${r1.status}). Check your Apple ID and app-specific password.`)

  const principalHref = xmlFirst(r1.text, 'href')
  if (!principalHref) throw new Error('Could not find principal URL')

  const principalUrl = principalHref.startsWith('http')
    ? principalHref
    : `https://caldav.icloud.com${principalHref}`

  const propfindHome = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop><C:calendar-home-set/></D:prop>
</D:propfind>`

  const r2 = await davRequest(principalUrl, 'PROPFIND', auth, propfindHome, { Depth: '0' })
  const homeHref = xmlFirst(r2.text, 'href')
  if (!homeHref) throw new Error('Could not find calendar home set')

  return homeHref.startsWith('http') ? homeHref : `https://caldav.icloud.com${homeHref}`
}

async function listCalendars(homeUrl: string, auth: string): Promise<{ url: string; name: string }[]> {
  const propfind = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:resourcetype/>
    <D:displayname/>
  </D:prop>
</D:propfind>`

  const r = await davRequest(homeUrl, 'PROPFIND', auth, propfind, { Depth: '1' })
  const responses = xmlAll(r.text, 'response')
  const calendars: { url: string; name: string }[] = []

  for (const resp of responses) {
    if (resp.toLowerCase().includes('calendar') && !resp.toLowerCase().includes('schedule')) {
      const href = xmlFirst(resp, 'href')
      const name = xmlFirst(resp, 'displayname')
      if (href && name) {
        const url = href.startsWith('http') ? href : `https://caldav.icloud.com${href}`
        calendars.push({ url, name })
      }
    }
  }

  return calendars
}

// ── iCalendar parser ──────────────────────────────────────────────

function parseICSDate(val: string): string {
  // YYYYMMDDTHHMMSSZ or YYYYMMDD
  const m = val.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?/)
  if (!m) return val
  if (m[4]) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`
  return `${m[1]}-${m[2]}-${m[3]}`
}

function parseVEvents(icsText: string): AppleCalendarEvent[] {
  const events: AppleCalendarEvent[] = []
  const unfolded = icsText.replace(/\r?\n[ \t]/g, '')
  const blocks = unfolded.split(/BEGIN:VEVENT/i).slice(1)

  for (const block of blocks) {
    const getVal = (prop: string) => {
      const m = block.match(new RegExp(`^${prop}(?:;[^:]*)?:(.+)$`, 'im'))
      return m ? m[1].trim() : ''
    }

    const uid = getVal('UID')
    const summary = getVal('SUMMARY')
    const start = getVal('DTSTART')
    const end = getVal('DTEND') || getVal('DURATION')
    const description = getVal('DESCRIPTION')
    const location = getVal('LOCATION')

    if (uid && summary) {
      events.push({
        uid,
        title: summary,
        start: parseICSDate(start),
        end: parseICSDate(end),
        description: description || undefined,
        location: location || undefined,
      })
    }
  }

  return events
}

export interface AppleCalendarEvent {
  uid: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  calendar?: string
}

// ── Public API ────────────────────────────────────────────────────

async function getAuth(userId: string): Promise<string> {
  const token = await getOAuthToken(userId, 'apple_calendar')
  if (!token) throw new Error('Apple Calendar not connected. Add your Apple ID credentials in Settings → Integrations.')
  return Buffer.from(`${token.provider_account_id}:${token.access_token}`).toString('base64')
}

export async function getAppleCalendarEvents(
  userId: string,
  daysAhead = 14
): Promise<AppleCalendarEvent[]> {
  const auth = await getAuth(userId)
  const homeUrl = await discoverCalendarHomeUrl(auth)
  const calendars = await listCalendars(homeUrl, auth)

  const now = new Date()
  const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const report = `<?xml version="1.0" encoding="utf-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${fmt(now)}" end="${fmt(until)}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`

  const allEvents: AppleCalendarEvent[] = []

  for (const cal of calendars) {
    try {
      const r = await davRequest(cal.url, 'REPORT', auth, report, { Depth: '1' })
      const calendarDatas = xmlAll(r.text, 'calendar-data')
      for (const ics of calendarDatas) {
        const events = parseVEvents(ics)
        allEvents.push(...events.map(e => ({ ...e, calendar: cal.name })))
      }
    } catch {
      // Skip calendars that fail
    }
  }

  return allEvents.sort((a, b) => a.start.localeCompare(b.start))
}

export async function createAppleCalendarEvent(
  userId: string,
  event: { title: string; start: string; end: string; description?: string; location?: string }
): Promise<{ uid: string }> {
  const auth = await getAuth(userId)
  const homeUrl = await discoverCalendarHomeUrl(auth)
  const calendars = await listCalendars(homeUrl, auth)

  if (calendars.length === 0) throw new Error('No calendars found')

  // Use first non-subscription calendar
  const targetCal = calendars[0]
  const uid = `jarvis-${Date.now()}@icloud.com`

  const toICS = (iso: string) => iso.replace(/[-:]/g, '').replace('.000', '')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jarvis//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${toICS(event.start)}`,
    `DTEND:${toICS(event.end)}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description}` : '',
    event.location ? `LOCATION:${event.location}` : '',
    `CREATED:${toICS(new Date().toISOString())}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  const eventUrl = `${targetCal.url}${uid}.ics`
  const r = await davRequest(eventUrl, 'PUT', auth, ics, { 'Content-Type': 'text/calendar; charset=utf-8' })

  if (r.status >= 400) throw new Error(`Failed to create event: ${r.status}`)

  return { uid }
}

export async function deleteAppleCalendarEvent(userId: string, uid: string): Promise<void> {
  const auth = await getAuth(userId)
  const homeUrl = await discoverCalendarHomeUrl(auth)
  const calendars = await listCalendars(homeUrl, auth)

  for (const cal of calendars) {
    const url = `${cal.url}${uid}.ics`
    const r = await davRequest(url, 'DELETE', auth)
    if (r.status < 400) return
  }

  throw new Error(`Event ${uid} not found in any calendar`)
}
