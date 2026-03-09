'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, RefreshCw, Terminal, CheckCircle2, Circle } from 'lucide-react'
import { toast } from 'sonner'

interface AgentStatus {
  connected: boolean
  cwd: string | null
  last_heartbeat: string | null
}

export function AgentPanel() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [status, setStatus] = useState<AgentStatus | null>(null)
  const [loadingKey, setLoadingKey] = useState(false)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStatus() {
    const res = await fetch('/api/agent/status')
    if (res.ok) setStatus(await res.json())
  }

  async function fetchKey() {
    setLoadingKey(true)
    const res = await fetch('/api/agent/key')
    const data = await res.json()
    setApiKey(data.key)
    setShowKey(true)
    setLoadingKey(false)
  }

  async function regenerateKey() {
    if (!confirm('Regenerate key? The current agent will disconnect.')) return
    setLoadingKey(true)
    const res = await fetch('/api/agent/key', { method: 'POST' })
    const data = await res.json()
    setApiKey(data.key)
    setShowKey(true)
    setLoadingKey(false)
    toast.success('New key generated')
  }

  function copyKey() {
    if (apiKey) { navigator.clipboard.writeText(apiKey); toast.success('Copied') }
  }

  const isConnected = status?.connected ?? false

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Local Agent
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Run the agent on your machine so Jarvis can read files, run commands, and write code.
        </p>
      </div>

      {/* Status */}
      <Card className="p-4 flex items-center gap-3">
        {isConnected
          ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{isConnected ? 'Agent connected' : 'No agent connected'}</p>
          {isConnected && status?.cwd && (
            <p className="text-xs text-muted-foreground truncate font-mono">{status.cwd}</p>
          )}
          {!isConnected && (
            <p className="text-xs text-muted-foreground">Start the agent in your project directory</p>
          )}
        </div>
        <Badge variant={isConnected ? 'default' : 'secondary'} className="shrink-0">
          {isConnected ? 'Online' : 'Offline'}
        </Badge>
      </Card>

      {/* API Key */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">API Key</p>
          <div className="flex gap-2">
            {apiKey && (
              <Button size="sm" variant="ghost" onClick={copyKey}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={regenerateKey} disabled={loadingKey}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerate
            </Button>
          </div>
        </div>

        {showKey && apiKey ? (
          <div className="rounded-md bg-muted px-3 py-2 font-mono text-xs break-all select-all">
            {apiKey}
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={fetchKey} disabled={loadingKey}>
            {loadingKey ? 'Loading…' : 'Show API key'}
          </Button>
        )}
      </Card>

      {/* Setup instructions */}
      <Card className="p-4 space-y-3">
        <p className="text-sm font-medium">Setup</p>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-foreground font-medium shrink-0">1.</span>
            Copy your API key above
          </li>
          <li className="flex gap-2">
            <span className="text-foreground font-medium shrink-0">2.</span>
            <div>
              Create <code className="text-xs bg-muted px-1 rounded">agent/.env</code> in your Jarvis repo:
              <pre className="mt-1.5 rounded-md bg-muted p-2 text-xs font-mono overflow-x-auto">
{`JARVIS_KEY=jv_your_key_here
JARVIS_URL=http://localhost:3000`}
              </pre>
            </div>
          </li>
          <li className="flex gap-2">
            <span className="text-foreground font-medium shrink-0">3.</span>
            <div>
              Open a terminal in your project and run:
              <pre className="mt-1.5 rounded-md bg-muted p-2 text-xs font-mono overflow-x-auto">
node agent/index.mjs
              </pre>
            </div>
          </li>
          <li className="flex gap-2">
            <span className="text-foreground font-medium shrink-0">4.</span>
            The status above will turn green. Then ask Jarvis things like:
            <ul className="mt-1 ml-2 space-y-0.5 text-xs">
              <li>"Read my package.json"</li>
              <li>"Run npm test and show me the output"</li>
              <li>"Search for all files that use useEffect"</li>
              <li>"Write a new component at components/foo.tsx"</li>
            </ul>
          </li>
        </ol>
      </Card>

      {/* Capabilities */}
      <Card className="p-4">
        <p className="text-sm font-medium mb-2">What the agent can do</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
          {[
            ['read_file', 'Read any file'],
            ['write_file', 'Create / edit files'],
            ['list_files', 'Browse directories'],
            ['run_command', 'Run shell commands'],
            ['search_files', 'Search file contents'],
            ['git_status', 'Check git status'],
          ].map(([tool, label]) => (
            <div key={tool} className="flex items-center gap-1.5">
              <code className="bg-muted px-1 rounded text-[10px]">{tool}</code>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
