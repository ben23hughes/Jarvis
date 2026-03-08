import Anthropic from '@anthropic-ai/sdk'
import type { IntegrationProvider } from '@/types/integrations'

export const ALL_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_calendar_events',
    description: 'Get upcoming calendar events for the user',
    input_schema: {
      type: 'object' as const,
      properties: {
        days_ahead: {
          type: 'number',
          description: 'How many days ahead to look (default: 7)',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of events to return (default: 10)',
        },
      },
    },
  },
  {
    name: 'create_calendar_event',
    description: 'Create a new calendar event',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Event title' },
        start: { type: 'string', description: 'Start time in ISO 8601 format' },
        end: { type: 'string', description: 'End time in ISO 8601 format' },
        description: { type: 'string', description: 'Event description' },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Email addresses of attendees',
        },
      },
      required: ['title', 'start', 'end'],
    },
  },
  {
    name: 'search_emails',
    description: 'Search Gmail messages',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Gmail search query' },
        max_results: { type: 'number', description: 'Max results (default: 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_recent_emails',
    description: 'Get recent emails from inbox',
    input_schema: {
      type: 'object' as const,
      properties: {
        max_results: { type: 'number', description: 'Max results (default: 10)' },
      },
    },
  },
  {
    name: 'get_slack_messages',
    description: 'Get recent Slack messages from channels the user is in',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Number of messages (default: 20)' },
      },
    },
  },
  {
    name: 'search_slack',
    description: 'Search Slack messages',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_linear_issues',
    description: "Get the user's assigned Linear issues",
    input_schema: {
      type: 'object' as const,
      properties: {
        states: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by state names (e.g. ["In Progress", "Todo"])',
        },
      },
    },
  },
  {
    name: 'search_linear',
    description: 'Search Linear issues',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'update_calendar_event',
    description: 'Update/reschedule an existing calendar event',
    input_schema: {
      type: 'object' as const,
      properties: {
        event_id: { type: 'string', description: 'The event ID to update' },
        title: { type: 'string', description: 'New title' },
        start: { type: 'string', description: 'New start time in ISO 8601 format' },
        end: { type: 'string', description: 'New end time in ISO 8601 format' },
        description: { type: 'string', description: 'New description' },
        attendees: { type: 'array', items: { type: 'string' }, description: 'New attendee emails' },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'delete_calendar_event',
    description: 'Delete a calendar event',
    input_schema: {
      type: 'object' as const,
      properties: {
        event_id: { type: 'string', description: 'The event ID to delete' },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'send_email',
    description: 'Send an email via Gmail',
    input_schema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body (plain text)' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'reply_to_email',
    description: 'Reply to an existing email thread',
    input_schema: {
      type: 'object' as const,
      properties: {
        thread_id: { type: 'string', description: 'The thread ID to reply to' },
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Original email subject' },
        body: { type: 'string', description: 'Reply body (plain text)' },
      },
      required: ['thread_id', 'to', 'subject', 'body'],
    },
  },
  {
    name: 'send_slack_message',
    description: 'Send a message to a Slack channel',
    input_schema: {
      type: 'object' as const,
      properties: {
        channel: { type: 'string', description: 'Channel name (e.g. #general) or channel ID' },
        text: { type: 'string', description: 'Message text' },
      },
      required: ['channel', 'text'],
    },
  },
  {
    name: 'create_linear_issue',
    description: 'Create a new Linear issue',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Issue title' },
        description: { type: 'string', description: 'Issue description (markdown)' },
        priority: { type: 'number', description: '0=none, 1=urgent, 2=high, 3=medium, 4=low' },
        team_id: { type: 'string', description: 'Team ID (optional, uses first team if omitted)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_linear_issue',
    description: 'Update an existing Linear issue (change state, priority, title, etc.)',
    input_schema: {
      type: 'object' as const,
      properties: {
        issue_id: { type: 'string', description: 'The issue ID to update' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        state_id: { type: 'string', description: 'New state ID' },
        priority: { type: 'number', description: '0=none, 1=urgent, 2=high, 3=medium, 4=low' },
      },
      required: ['issue_id'],
    },
  },
]

const PROVIDER_TOOL_MAP: Record<string, IntegrationProvider[]> = {
  get_calendar_events: ['google_calendar'],
  create_calendar_event: ['google_calendar'],
  update_calendar_event: ['google_calendar'],
  delete_calendar_event: ['google_calendar'],
  search_emails: ['gmail'],
  get_recent_emails: ['gmail'],
  send_email: ['gmail'],
  reply_to_email: ['gmail'],
  get_slack_messages: ['slack'],
  search_slack: ['slack'],
  send_slack_message: ['slack'],
  get_linear_issues: ['linear'],
  search_linear: ['linear'],
  create_linear_issue: ['linear'],
  update_linear_issue: ['linear'],
}

export function getToolsForConnectedProviders(
  connectedProviders: IntegrationProvider[]
): Anthropic.Tool[] {
  return ALL_TOOLS.filter((tool) => {
    const required = PROVIDER_TOOL_MAP[tool.name] ?? []
    return required.every((p) => connectedProviders.includes(p))
  })
}
