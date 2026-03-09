import Anthropic from '@anthropic-ai/sdk'
import type { IntegrationProvider } from '@/types/integrations'

export const ALL_TOOLS: Anthropic.Tool[] = [
  // ── Calendar ──────────────────────────────────────────────────
  {
    name: 'get_calendar_events',
    description: 'Get upcoming calendar events for the user',
    input_schema: {
      type: 'object' as const,
      properties: {
        days_ahead: { type: 'number', description: 'How many days ahead to look (default: 7)' },
        max_results: { type: 'number', description: 'Max events to return (default: 10)' },
      },
    },
  },
  {
    name: 'create_calendar_event',
    description: 'Create a new calendar event',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        start: { type: 'string', description: 'ISO 8601 datetime' },
        end: { type: 'string', description: 'ISO 8601 datetime' },
        description: { type: 'string' },
        attendees: { type: 'array', items: { type: 'string' }, description: 'Email addresses' },
      },
      required: ['title', 'start', 'end'],
    },
  },
  {
    name: 'update_calendar_event',
    description: 'Update/reschedule an existing calendar event',
    input_schema: {
      type: 'object' as const,
      properties: {
        event_id: { type: 'string' },
        title: { type: 'string' },
        start: { type: 'string', description: 'ISO 8601 datetime' },
        end: { type: 'string', description: 'ISO 8601 datetime' },
        description: { type: 'string' },
        attendees: { type: 'array', items: { type: 'string' } },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'delete_calendar_event',
    description: 'Delete a calendar event',
    input_schema: {
      type: 'object' as const,
      properties: { event_id: { type: 'string' } },
      required: ['event_id'],
    },
  },

  // ── Gmail ──────────────────────────────────────────────────────
  {
    name: 'get_recent_emails',
    description: 'Get recent emails from inbox',
    input_schema: {
      type: 'object' as const,
      properties: { max_results: { type: 'number', description: 'Default: 10' } },
    },
  },
  {
    name: 'search_emails',
    description: 'Search Gmail messages',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Gmail search query' },
        max_results: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'send_email',
    description: 'Send an email via Gmail',
    input_schema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string', description: 'Plain text body' },
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
        thread_id: { type: 'string' },
        to: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['thread_id', 'to', 'subject', 'body'],
    },
  },

  // ── Slack ──────────────────────────────────────────────────────
  {
    name: 'get_slack_messages',
    description: 'Get recent Slack messages',
    input_schema: {
      type: 'object' as const,
      properties: { limit: { type: 'number', description: 'Default: 20' } },
    },
  },
  {
    name: 'search_slack',
    description: 'Search Slack messages',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'send_slack_message',
    description: 'Send a message to a Slack channel',
    input_schema: {
      type: 'object' as const,
      properties: {
        channel: { type: 'string', description: 'Channel name (e.g. #general) or ID' },
        text: { type: 'string' },
      },
      required: ['channel', 'text'],
    },
  },

  // ── Linear ─────────────────────────────────────────────────────
  {
    name: 'get_linear_issues',
    description: "Get the user's assigned Linear issues",
    input_schema: {
      type: 'object' as const,
      properties: {
        states: { type: 'array', items: { type: 'string' }, description: 'Filter by state names' },
      },
    },
  },
  {
    name: 'search_linear',
    description: 'Search Linear issues',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'create_linear_issue',
    description: 'Create a new Linear issue',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        description: { type: 'string', description: 'Markdown' },
        priority: { type: 'number', description: '0=none,1=urgent,2=high,3=medium,4=low' },
        team_id: { type: 'string', description: 'Optional, uses first team if omitted' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_linear_issue',
    description: 'Update a Linear issue',
    input_schema: {
      type: 'object' as const,
      properties: {
        issue_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        state_id: { type: 'string' },
        priority: { type: 'number' },
      },
      required: ['issue_id'],
    },
  },

  // ── GitHub ─────────────────────────────────────────────────────
  {
    name: 'get_github_prs',
    description: 'Get open GitHub pull requests authored by the user',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_github_issues',
    description: 'Get GitHub issues assigned to the user',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'search_github',
    description: 'Search GitHub issues and PRs',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },

  // ── Notion ─────────────────────────────────────────────────────
  {
    name: 'search_notion',
    description: 'Search Notion pages',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'get_notion_page',
    description: 'Get the content of a Notion page',
    input_schema: {
      type: 'object' as const,
      properties: { page_id: { type: 'string' } },
      required: ['page_id'],
    },
  },
  {
    name: 'create_notion_page',
    description: 'Create a new Notion page',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        content: { type: 'string', description: 'Page content' },
        parent_page_id: { type: 'string', description: 'Optional parent page' },
      },
      required: ['title'],
    },
  },

  // ── Google Drive ───────────────────────────────────────────────
  {
    name: 'search_drive',
    description: 'Search Google Drive files',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' },
        max_results: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_drive_file',
    description: 'Get the content of a Google Drive file (Google Docs only)',
    input_schema: {
      type: 'object' as const,
      properties: { file_id: { type: 'string' } },
      required: ['file_id'],
    },
  },

  // ── Contacts ───────────────────────────────────────────────────
  {
    name: 'lookup_contact',
    description: 'Search contacts by name, email, or company',
    input_schema: {
      type: 'object' as const,
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'list_contacts',
    description: 'List all contacts',
    input_schema: {
      type: 'object' as const,
      properties: { limit: { type: 'number', description: 'Default: 20' } },
    },
  },
  {
    name: 'create_contact',
    description: 'Create a new contact',
    input_schema: {
      type: 'object' as const,
      properties: {
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        company: { type: 'string' },
        title: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['first_name'],
    },
  },

  // ── Memory ─────────────────────────────────────────────────────
  {
    name: 'remember',
    description: 'Save an important fact or preference about the user for future conversations',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'The fact or preference to remember' },
        category: {
          type: 'string',
          description: 'Category: preference, fact, person, instruction, or general',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'recall_memories',
    description: 'Retrieve previously saved memories about the user',
    input_schema: { type: 'object' as const, properties: {} },
  },

  // ── Reminders ──────────────────────────────────────────────────
  {
    name: 'create_reminder',
    description: 'Set a reminder that will be sent via SMS or email at a specified time',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: { type: 'string', description: 'Reminder message' },
        remind_at: { type: 'string', description: 'ISO 8601 datetime' },
        channel: { type: 'string', description: '"sms" or "email" (default: email)' },
      },
      required: ['message', 'remind_at'],
    },
  },
  {
    name: 'list_reminders',
    description: 'List pending reminders',
    input_schema: { type: 'object' as const, properties: {} },
  },

  // ── Schedules ──────────────────────────────────────────────────
  {
    name: 'create_schedule',
    description: 'Create a recurring scheduled task. Jarvis will run the prompt on the given schedule and deliver the result via SMS or email. Times are in MST.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Short name for the schedule' },
        prompt: { type: 'string', description: 'What Jarvis should do each time it runs' },
        frequency: { type: 'string', description: '"hourly", "daily", "weekdays", or "weekly"' },
        hour: { type: 'number', description: 'Hour in MST (0-23). Not needed for hourly.' },
        minute: { type: 'number', description: 'Minute (0-59, default 0)' },
        day_of_week: { type: 'number', description: 'Day of week for weekly (0=Sun, 1=Mon, ..., 6=Sat)' },
        channel: { type: 'string', description: '"sms" or "email" (default: sms)' },
      },
      required: ['name', 'prompt', 'frequency'],
    },
  },
  {
    name: 'list_schedules',
    description: 'List all scheduled tasks for the user',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'delete_schedule',
    description: 'Delete a scheduled task by id',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string', description: 'Schedule id' } },
      required: ['id'],
    },
  },
  {
    name: 'toggle_schedule',
    description: 'Enable or pause a scheduled task by id',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string' },
        enabled: { type: 'boolean', description: 'true to enable, false to pause' },
      },
      required: ['id', 'enabled'],
    },
  },

  // ── Goals ──────────────────────────────────────────────────────
  {
    name: 'get_goals',
    description: "Get the user's goals. Use this to understand what the user is working toward and provide contextual advice aligned with their aspirations.",
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category: spiritual, physical, financial, career, relationships, learning, or other',
        },
        status: {
          type: 'string',
          description: 'Filter by status: active, completed, or paused. Defaults to all.',
        },
      },
    },
  },
  {
    name: 'create_goal',
    description: "Create a new goal for the user",
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Goal title' },
        category: { type: 'string', description: 'spiritual, physical, financial, career, relationships, learning, or other' },
        description: { type: 'string', description: 'More detail about the goal' },
        why: { type: 'string', description: "The user's deeper motivation for this goal" },
        target_date: { type: 'string', description: 'Target completion date (YYYY-MM-DD)' },
      },
      required: ['title', 'category'],
    },
  },
  {
    name: 'update_goal',
    description: "Update a goal's progress, status, or details",
    input_schema: {
      type: 'object' as const,
      properties: {
        goal_id: { type: 'string', description: 'Goal ID' },
        progress: { type: 'number', description: 'Progress percentage 0-100' },
        status: { type: 'string', description: 'active, completed, or paused' },
        title: { type: 'string' },
        description: { type: 'string' },
        why: { type: 'string' },
        target_date: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['goal_id'],
    },
  },

  // ── SMS ────────────────────────────────────────────────────────
  {
    name: 'send_sms',
    description: "Send an SMS text message to the user's phone number",
    input_schema: {
      type: 'object' as const,
      properties: { message: { type: 'string' } },
      required: ['message'],
    },
  },

  // ── Web Search ─────────────────────────────────────────────────
  {
    name: 'web_search',
    description: 'Search the web for current information',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' },
        max_results: { type: 'number', description: 'Default: 5' },
      },
      required: ['query'],
    },
  },
]

const PROVIDER_TOOL_MAP: Record<string, IntegrationProvider[]> = {
  get_calendar_events: ['google_calendar'],
  create_calendar_event: ['google_calendar'],
  update_calendar_event: ['google_calendar'],
  delete_calendar_event: ['google_calendar'],
  get_recent_emails: ['gmail'],
  search_emails: ['gmail'],
  send_email: ['gmail'],
  reply_to_email: ['gmail'],
  get_slack_messages: ['slack'],
  search_slack: ['slack'],
  send_slack_message: ['slack'],
  get_linear_issues: ['linear'],
  search_linear: ['linear'],
  create_linear_issue: ['linear'],
  update_linear_issue: ['linear'],
  get_github_prs: ['github'],
  get_github_issues: ['github'],
  search_github: ['github'],
  search_notion: ['notion'],
  get_notion_page: ['notion'],
  create_notion_page: ['notion'],
  search_drive: ['google_drive'],
  get_drive_file: ['google_drive'],
  // Always available (no OAuth needed)
  lookup_contact: [],
  list_contacts: [],
  create_contact: [],
  remember: [],
  recall_memories: [],
  create_reminder: [],
  list_reminders: [],
  create_schedule: [],
  list_schedules: [],
  delete_schedule: [],
  toggle_schedule: [],
  send_sms: [],
  web_search: [],
}

export function getToolsForConnectedProviders(
  connectedProviders: IntegrationProvider[]
): Anthropic.Tool[] {
  return ALL_TOOLS.filter((tool) => {
    const required = PROVIDER_TOOL_MAP[tool.name] ?? []
    return required.every((p) => connectedProviders.includes(p))
  })
}
