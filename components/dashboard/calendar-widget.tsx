'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Calendar, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { CalendarEvent } from '@/types/dashboard'
import { format, isToday, isTomorrow } from 'date-fns'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return `Today ${format(date, 'h:mm a')}`
  if (isTomorrow(date)) return `Tomorrow ${format(date, 'h:mm a')}`
  return format(date, 'MMM d, h:mm a')
}

export function CalendarWidget() {
  const { data, isLoading } = useSWR('/api/integrations/google-calendar', fetcher, {
    refreshInterval: 60000,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!data?.connected) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <Link href="/settings/integrations" className="underline">
              Connect Google Calendar
            </Link>{' '}
            to see your upcoming events.
          </p>
        </CardContent>
      </Card>
    )
  }

  const events: CalendarEvent[] = data.events ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events</p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex items-start justify-between rounded-md border p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">{formatEventDate(event.start)}</p>
              </div>
              {event.htmlLink && (
                <a
                  href={event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
