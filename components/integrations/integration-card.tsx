'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { IntegrationProvider } from '@/types/integrations'

interface IntegrationCardProps {
  provider: IntegrationProvider
  name: string
  description: string
  icon: React.ReactNode
  connected: boolean
  connectUrl: string
  accountId?: string
}

export function IntegrationCard({
  provider,
  name,
  description,
  icon,
  connected,
  connectUrl,
  accountId,
}: IntegrationCardProps) {
  const router = useRouter()
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('oauth_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider)

      if (error) throw error

      toast.success(`Disconnected ${name}`)
      router.refresh()
    } catch {
      toast.error(`Failed to disconnect ${name}`)
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              {connected && accountId && (
                <p className="text-xs text-muted-foreground">{accountId}</p>
              )}
            </div>
          </div>
          <Badge variant={connected ? 'default' : 'secondary'}>
            {connected ? 'Connected' : 'Not connected'}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {connected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        ) : (
          <a href={connectUrl}>
            <Button size="sm">Connect</Button>
          </a>
        )}
      </CardContent>
    </Card>
  )
}
