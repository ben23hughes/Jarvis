import { createClient } from '@/lib/supabase/server'
import { getValidToken } from '@/lib/oauth/token-refresh'
import { upsertContactsFromSync } from '@/lib/contacts'
import { NextResponse } from 'next/server'
import type { CreateContactInput } from '@/types/contacts'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const token = await getValidToken(user.id, 'google_calendar')

    const contacts: CreateContactInput[] = []
    let nextPageToken: string | undefined

    do {
      const params = new URLSearchParams({
        personFields: 'names,emailAddresses,phoneNumbers,organizations',
        pageSize: '1000',
      })
      if (nextPageToken) params.set('pageToken', nextPageToken)

      const res = await fetch(
        `https://people.googleapis.com/v1/people/me/connections?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (err?.error?.status === 'PERMISSION_DENIED' || res.status === 403) {
          return NextResponse.json(
            { error: 'Google Contacts permission not granted. Please reconnect Google in Settings → Integrations.' },
            { status: 403 }
          )
        }
        throw new Error(`Google People API: ${res.status} ${res.statusText}`)
      }

      const data = await res.json()

      for (const person of data.connections ?? []) {
        const name = person.names?.[0]
        if (!name) continue

        contacts.push({
          first_name: name.givenName ?? name.displayName ?? '',
          last_name: name.familyName ?? '',
          email: person.emailAddresses?.[0]?.value ?? '',
          phone: person.phoneNumbers?.[0]?.value ?? '',
          company: person.organizations?.[0]?.name ?? '',
          title: person.organizations?.[0]?.title ?? '',
        })
      }

      nextPageToken = data.nextPageToken
    } while (nextPageToken)

    const valid = contacts.filter((c) => c.first_name)
    const result = await upsertContactsFromSync(user.id, valid)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Google Contacts sync error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
