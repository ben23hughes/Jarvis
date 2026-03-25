'use client'

import useSWR, { mutate } from 'swr'
import { Bell, Calendar, Clock, Zap, Trash2, CheckCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import type { Notification, NotificationType } from '@/lib/notifications'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; label: string; color: string }> = {
  reminder: { icon: Clock,    label: 'Reminder',  color: 'text-amber-500'  },
  schedule: { icon: Calendar, label: 'Scheduled',  color: 'text-blue-500'   },
  briefing: { icon: Zap,      label: 'Briefing',   color: 'text-violet-500' },
  alert:    { icon: Bell,     label: 'Alert',      color: 'text-rose-500'   },
}

async function markRead(id?: string) {
  await fetch('/api/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(id ? { id } : {}),
  })
  mutate('/api/notifications')
}

async function remove(id: string) {
  await fetch('/api/notifications', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  mutate('/api/notifications')
}

export function NotificationsWidget() {
  const { data, isLoading } = useSWR<Notification[]>('/api/notifications', fetcher, {
    refreshInterval: 30000,
  })

  const notifications = data ?? []
  const unreadCount = notifications.filter((n) => !n.read).length

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="default" className="h-5 px-1.5 text-xs">{unreadCount}</Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={() => markRead()}>
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No notifications yet</p>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => {
              const { icon: Icon, color } = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.alert
              return (
                <div
                  key={n.id}
                  className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer hover:bg-accent ${!n.read ? 'bg-muted/50' : ''}`}
                  onClick={() => !n.read && markRead(n.id)}
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${!n.read ? 'font-semibold' : 'font-medium'}`}>
                        {n.title}
                      </p>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); remove(n.id) }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
