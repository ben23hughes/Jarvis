'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Hash } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { SlackMessage } from '@/types/dashboard'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function SlackWidget() {
  const { data, isLoading } = useSWR('/api/integrations/slack', fetcher, {
    refreshInterval: 60000,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Hash className="h-4 w-4" />
            Slack
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  if (!data?.connected) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Hash className="h-4 w-4" />
            Slack
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <Link href="/settings/integrations" className="underline">
              Connect Slack
            </Link>{' '}
            to see your recent messages.
          </p>
        </CardContent>
      </Card>
    )
  }

  const messages: SlackMessage[] = data.messages ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Hash className="h-4 w-4" />
          Recent Slack
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent messages</p>
        ) : (
          messages.map((msg) => (
            <div key={`${msg.channelId}-${msg.ts}`} className="rounded-md border p-2">
              <p className="text-xs font-medium text-muted-foreground">#{msg.channelName}</p>
              <p className="truncate text-sm">{msg.text || '(attachment)'}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
