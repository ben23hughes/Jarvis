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
]

const PROVIDER_TOOL_MAP: Record<string, IntegrationProvider[]> = {
  get_calendar_events: ['google_calendar'],
  create_calendar_event: ['google_calendar'],
  search_emails: ['gmail'],
  get_recent_emails: ['gmail'],
  get_slack_messages: ['slack'],
  search_slack: ['slack'],
  get_linear_issues: ['linear'],
  search_linear: ['linear'],
}

export function getToolsForConnectedProviders(
  connectedProviders: IntegrationProvider[]
): Anthropic.Tool[] {
  return ALL_TOOLS.filter((tool) => {
    const required = PROVIDER_TOOL_MAP[tool.name] ?? []
    return required.every((p) => connectedProviders.includes(p))
  })
}
