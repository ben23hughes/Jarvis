import { useState } from 'react'
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ToolCall } from '@/types/chat'

const TOOL_LABELS: Record<string, string> = {
  get_calendar_events: 'Checking calendar',
  create_calendar_event: 'Creating event',
  search_emails: 'Searching emails',
  get_recent_emails: 'Fetching emails',
  get_slack_messages: 'Fetching Slack messages',
  search_slack: 'Searching Slack',
  get_linear_issues: 'Fetching Linear issues',
  search_linear: 'Searching Linear',
}

interface ToolCallCardProps {
  toolCall: ToolCall
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false)
  const label = TOOL_LABELS[toolCall.name] ?? toolCall.name
  const hasResult = toolCall.result !== undefined

  return (
    <div className="rounded-lg border bg-muted/50 text-xs">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <Wrench className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium text-muted-foreground">{label}</span>
        {hasResult ? (
          <Badge variant="secondary" className="ml-auto text-xs">
            Done
          </Badge>
        ) : (
          <span className="ml-auto animate-pulse text-muted-foreground">Running...</span>
        )}
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t px-3 py-2 font-mono text-xs text-muted-foreground">
          <p className="font-semibold">Input:</p>
          <pre className="mt-1 overflow-auto">{JSON.stringify(toolCall.input, null, 2)}</pre>
          {hasResult && (
            <>
              <p className="mt-2 font-semibold">Result:</p>
              <pre className="mt-1 max-h-40 overflow-auto">
                {typeof toolCall.result === 'string'
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  )
}
