'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { CheckSquare, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { LinearIssue } from '@/types/dashboard'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PRIORITY_LABELS: Record<number, string> = {
  0: 'No priority',
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'destructive',
  2: 'default',
  3: 'secondary',
  4: 'outline',
}

export function LinearWidget() {
  const { data, isLoading } = useSWR('/api/integrations/linear', fetcher, {
    refreshInterval: 120000,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <CheckSquare className="h-4 w-4" />
            Linear
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
            <CheckSquare className="h-4 w-4" />
            Linear
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <Link href="/settings/integrations" className="underline">
              Connect Linear
            </Link>{' '}
            to see your assigned issues.
          </p>
        </CardContent>
      </Card>
    )
  }

  const issues: LinearIssue[] = data.issues ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <CheckSquare className="h-4 w-4" />
          My Linear Issues
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assigned issues</p>
        ) : (
          issues.map((issue) => (
            <div
              key={issue.id}
              className="flex items-start justify-between rounded-md border p-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{issue.identifier}</span>
                  {issue.priority > 0 && (
                    <Badge
                      variant={(PRIORITY_COLORS[issue.priority] ?? 'outline') as 'default' | 'secondary' | 'destructive' | 'outline'}
                      className="text-xs"
                    >
                      {PRIORITY_LABELS[issue.priority]}
                    </Badge>
                  )}
                </div>
                <p className="truncate text-sm font-medium">{issue.title}</p>
                <p className="text-xs text-muted-foreground">{issue.state}</p>
              </div>
              <a
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
