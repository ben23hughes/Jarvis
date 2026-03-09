'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Terminal, FolderOpen, Globe, Monitor, GitBranch,
  CheckCircle2, XCircle, Copy, Check, RefreshCw,
  FileText, FolderSearch, Play, Search, MousePointer,
  Camera, Keyboard, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface Props {
  apiKey: string
  connected: boolean
  cwd: string | null
  lastHeartbeat: string | null
}

interface CopiedState {
  [key: string]: boolean
}

// ── Capability data ────────────────────────────────────────────────────────

const CAPABILITIES = [
  {
    id: 'filesystem',
    icon: FolderOpen,
    label: 'File System',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    description: 'Read, write, and browse files anywhere on your machine.',
    tools: [
      { name: 'read_file', label: 'Read any file', example: '"Read my package.json and tell me what dependencies I have"' },
      { name: 'write_file', label: 'Create & edit files', example: '"Create a new .env.example file with placeholder values based on my .env"' },
      { name: 'list_files', label: 'Browse directories', example: '"List all TypeScript files in my src folder"' },
      { name: 'search_files', label: 'Search file contents', example: '"Find every file that imports useState"' },
    ],
  },
  {
    id: 'terminal',
    icon: Terminal,
    label: 'Terminal',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    description: 'Run shell commands, build projects, and run tests.',
    tools: [
      { name: 'run_command', label: 'Run any command', example: '"Run npm test and show me which tests are failing"' },
      { name: 'git_status', label: 'Git integration', example: '"What files have I changed since my last commit? Write a commit message for them."' },
    ],
  },
  {
    id: 'browser',
    icon: Globe,
    label: 'Browser Control',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    description: 'Navigate websites, fill forms, click buttons — Jarvis opens a real visible browser and you can watch it work.',
    badge: 'Requires Playwright',
    tools: [
      { name: 'browser_navigate', label: 'Navigate websites', example: '"Go to my GitHub notifications and summarize what needs attention"' },
      { name: 'browser_screenshot', label: 'See the page', example: '"Screenshot the current page so you can see what I\'m looking at"' },
      { name: 'browser_click', label: 'Click elements', example: '"Click the Sign in button then fill in my email"' },
      { name: 'browser_type', label: 'Fill forms', example: '"Search for \'React 18 migration guide\' and open the first result"' },
      { name: 'browser_get_text', label: 'Extract page content', example: '"Get all the pricing tiers from this page"' },
      { name: 'browser_evaluate', label: 'Run JavaScript', example: '"Get the value of localStorage.getItem(\'auth_token\') on this page"' },
    ],
  },
  {
    id: 'screen',
    icon: Monitor,
    label: 'Screen Control',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    description: 'See and control your entire desktop — any app, any window.',
    badge: 'macOS only',
    tools: [
      { name: 'screen_screenshot', label: 'Capture your screen', example: '"What\'s on my screen right now?"' },
      { name: 'screen_click', label: 'Click anywhere', example: '"Take a screenshot, then click the close button on that modal"' },
      { name: 'screen_type', label: 'Type text', example: '"Type this message into whatever text field is focused"' },
    ],
  },
]

const SETUP_STEPS = [
  {
    n: 1,
    title: 'Get your API key',
    body: 'Copy your personal agent key from the section below. This is how the agent authenticates with your Jarvis account.',
  },
  {
    n: 2,
    title: 'Create agent/.env',
    body: 'In the Jarvis project folder, create a file at agent/.env with your key and the server URL.',
    code: (key: string) => `JARVIS_KEY=${key}\nJARVIS_URL=https://jarvis4.com`,
  },
  {
    n: 3,
    title: 'Install browser support (optional)',
    body: 'If you want browser control, install Playwright. Skip this if you only need file system and terminal access.',
    code: () => `npm install playwright\nnpx playwright install chromium`,
  },
  {
    n: 4,
    title: 'Start the agent',
    body: 'Open a terminal in your project directory and run the agent. Keep it running in the background.',
    code: () => `node agent/index.mjs`,
  },
  {
    n: 5,
    title: 'Start chatting',
    body: 'The status indicator above will turn green. Go to Chat and start giving Jarvis tasks on your machine.',
  },
]

// ── Component ──────────────────────────────────────────────────────────────

export function AgentPage({ apiKey: initialKey, connected: initialConnected, cwd, lastHeartbeat }: Props) {
  const [connected, setConnected] = useState(initialConnected)
  const [currentCwd, setCurrentCwd] = useState(cwd)
  const [copied, setCopied] = useState<CopiedState>({})
  const [showKey, setShowKey] = useState(false)
  const [apiKey, setApiKey] = useState(initialKey)
  const [regenerating, setRegenerating] = useState(false)
  const [expandedCapability, setExpandedCapability] = useState<string | null>('filesystem')

  const pollStatus = useCallback(async () => {
    const res = await fetch('/api/agent/status')
    if (res.ok) {
      const data = await res.json()
      setConnected(data.connected)
      setCurrentCwd(data.cwd ?? null)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(pollStatus, 4000)
    return () => clearInterval(id)
  }, [pollStatus])

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 2000)
  }

  async function regenerateKey() {
    if (!confirm('Regenerate key? The running agent will disconnect and need to be restarted.')) return
    setRegenerating(true)
    const res = await fetch('/api/agent/key', { method: 'POST' })
    const data = await res.json()
    setApiKey(data.key)
    setShowKey(true)
    setRegenerating(false)
  }

  const envContent = `JARVIS_KEY=${apiKey}\nJARVIS_URL=https://jarvis4.com`

  return (
    <div className="max-w-3xl space-y-10 pb-16">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <Terminal className="h-6 w-6" />
          Local Agent
        </h1>
        <p className="text-muted-foreground">
          A lightweight process that runs on your computer and lets Jarvis control your files,
          terminal, browser, and screen — all from the chat window.
        </p>
      </div>

      {/* Live status bar */}
      <div className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${
        connected ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-muted/30'
      }`}>
        {connected
          ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          : <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
            {connected ? 'Agent is running' : 'Agent not connected'}
          </p>
          {connected && currentCwd && (
            <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
              Working directory: {currentCwd}
            </p>
          )}
          {!connected && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Follow the setup guide below to get started.
            </p>
          )}
        </div>
        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
          connected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'
        }`} />
      </div>

      {/* What it can do */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">What the agent can do</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Click a category to see the tools and example prompts.
          </p>
        </div>

        <div className="space-y-2">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon
            const isOpen = expandedCapability === cap.id
            return (
              <div key={cap.id} className="rounded-xl border overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpandedCapability(isOpen ? null : cap.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-accent/40 transition-colors"
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${cap.bg}`}>
                    <Icon className={`h-5 w-5 ${cap.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{cap.label}</span>
                      {cap.badge && (
                        <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          {cap.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{cap.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 mr-1">{cap.tools.length} tools</span>
                  {isOpen
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {/* Expanded tool list */}
                {isOpen && (
                  <div className="border-t divide-y bg-muted/20">
                    {cap.tools.map((tool) => (
                      <div key={tool.name} className="px-5 py-3.5 flex gap-4">
                        <code className="text-[11px] font-mono bg-background border rounded px-2 py-1 h-fit shrink-0 text-muted-foreground mt-0.5">
                          {tool.name}
                        </code>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{tool.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 italic">{tool.example}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Setup guide */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Setup guide</h2>

        <div className="space-y-3">
          {SETUP_STEPS.map((step) => (
            <div key={step.n} className="flex gap-4">
              {/* Step number */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">
                {step.n}
              </div>

              <div className="flex-1 min-w-0 space-y-2 pb-2">
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.body}</p>

                {step.code && (
                  <div className="relative">
                    <pre className="rounded-lg border bg-zinc-950 text-zinc-100 px-4 py-3 text-xs font-mono overflow-x-auto leading-relaxed">
                      {step.code(apiKey)}
                    </pre>
                    <button
                      onClick={() => copy(step.code!(apiKey), `step-${step.n}`)}
                      className="absolute top-2 right-2 rounded border border-zinc-700 bg-zinc-800 p-1.5 hover:bg-zinc-700 transition-colors"
                      title="Copy"
                    >
                      {copied[`step-${step.n}`]
                        ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                        : <Copy className="h-3.5 w-3.5 text-zinc-300" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API key management */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your API key</h2>
        <p className="text-sm text-muted-foreground">
          This key authenticates your agent. Keep it private — it gives access to your machine.
        </p>

        <div className="rounded-xl border p-5 space-y-3">
          {showKey ? (
            <>
              <div className="relative">
                <pre className="rounded-lg border bg-zinc-950 text-zinc-100 px-4 py-3 text-xs font-mono break-all select-all leading-relaxed">
                  {apiKey}
                </pre>
                <button
                  onClick={() => copy(apiKey, 'apikey')}
                  className="absolute top-2 right-2 rounded border border-zinc-700 bg-zinc-800 p-1.5 hover:bg-zinc-700 transition-colors"
                  title="Copy"
                >
                  {copied['apikey']
                    ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                    : <Copy className="h-3.5 w-3.5 text-zinc-300" />}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => copy(envContent, 'envfile')}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border rounded-md px-3 py-1.5"
                >
                  {copied['envfile'] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copy as .env
                </button>
                <button
                  onClick={regenerateKey}
                  disabled={regenerating}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border rounded-md px-3 py-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setShowKey(true)}
              className="text-sm font-medium text-primary hover:underline"
            >
              Show API key
            </button>
          )}
        </div>
      </div>

      {/* Example use cases */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">What to ask Jarvis</h2>
        <p className="text-sm text-muted-foreground">
          Once connected, go to Chat and try any of these:
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              icon: FileText,
              category: 'Code review',
              prompts: [
                'Read my git diff and review the changes',
                'Find all TODO comments in my codebase',
                'What does the auth middleware in my project do?',
              ],
            },
            {
              icon: Play,
              category: 'Development',
              prompts: [
                'Run my tests and fix any failures',
                'Build the project and tell me about any errors',
                'Create a new API route following the pattern in my existing routes',
              ],
            },
            {
              icon: Globe,
              category: 'Web browsing',
              prompts: [
                'Go to Hacker News and summarize the top 5 stories',
                'Check the status page for our cloud provider',
                'Search for and open the latest Next.js docs on App Router',
              ],
            },
            {
              icon: Monitor,
              category: 'Screen control',
              prompts: [
                'Take a screenshot — what windows do I have open?',
                'What error is showing on my screen?',
                'Click the accept button in that dialog',
              ],
            },
            {
              icon: GitBranch,
              category: 'Git workflow',
              prompts: [
                'Show me what changed since last Tuesday',
                'Write a changelog entry based on recent commits',
                'Create a new branch and stub out this feature',
              ],
            },
            {
              icon: FolderSearch,
              category: 'Codebase Q&A',
              prompts: [
                'How does authentication work in my project?',
                'Where is the database schema defined?',
                'Show me all the places we call the payments API',
              ],
            },
          ].map(({ icon: Icon, category, prompts }) => (
            <div key={category} className="rounded-xl border p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{category}</span>
              </div>
              <ul className="space-y-1.5">
                {prompts.map((p) => (
                  <li key={p} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-primary mt-px shrink-0">›</span>
                    <span className="italic">&ldquo;{p}&rdquo;</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border bg-muted/40 p-5 space-y-2 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Good to know</p>
        <p>• The agent runs entirely on your machine — Jarvis never sees your files directly, only the results it asks for.</p>
        <p>• Browser control opens a real Chrome window so you can see exactly what Jarvis is doing.</p>
        <p>• Screen control requires <strong>macOS Screen Recording permission</strong> for the Terminal app (System Settings → Privacy & Security → Screen Recording).</p>
        <p>• The agent auto-reconnects if you restart it. Regenerating your key will disconnect the current session.</p>
      </div>

    </div>
  )
}
