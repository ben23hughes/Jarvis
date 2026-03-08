'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Email } from '@/types/dashboard'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function extractName(from: string): string {
  const match = from.match(/^([^<]+)/)
  return match ? match[1].trim().replace(/"/g, '') : from
}

export function EmailWidget() {
  const { data, isLoading } = useSWR('/api/integrations/gmail', fetcher, {
    refreshInterval: 120000,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4" />
            Gmail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  if (!data?.connected) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4" />
            Gmail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <Link href="/settings/integrations" className="underline">
              Connect Gmail
            </Link>{' '}
            to see your recent emails.
          </p>
        </CardContent>
      </Card>
    )
  }

  const emails: Email[] = data.emails ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4" />
          Recent Emails
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {emails.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent emails</p>
        ) : (
          emails.map((email) => (
            <div key={email.id} className="rounded-md border p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{email.subject}</p>
                {email.isUnread && (
                  <Badge variant="default" className="shrink-0 text-xs">
                    New
                  </Badge>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{extractName(email.from)}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{email.snippet}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
