import { getUpcomingEvents, createCalendarEvent } from '@/lib/integrations/google-calendar'
import { getRecentEmails, searchEmails } from '@/lib/integrations/gmail'
import { getRecentMessages, searchSlackMessages } from '@/lib/integrations/slack'
import { getMyIssues, searchLinearIssues } from '@/lib/integrations/linear'

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  switch (toolName) {
    case 'get_calendar_events':
      return getUpcomingEvents(
        userId,
        (input.days_ahead as number) ?? 7,
        (input.max_results as number) ?? 10
      )

    case 'create_calendar_event':
      return createCalendarEvent(userId, {
        title: input.title as string,
        start: input.start as string,
        end: input.end as string,
        description: input.description as string | undefined,
        attendees: input.attendees as string[] | undefined,
      })

    case 'get_recent_emails':
      return getRecentEmails(userId, (input.max_results as number) ?? 10)

    case 'search_emails':
      return searchEmails(userId, input.query as string, (input.max_results as number) ?? 10)

    case 'get_slack_messages':
      return getRecentMessages(userId, (input.limit as number) ?? 20)

    case 'search_slack':
      return searchSlackMessages(userId, input.query as string)

    case 'get_linear_issues':
      return getMyIssues(userId, input.states as string[] | undefined)

    case 'search_linear':
      return searchLinearIssues(userId, input.query as string)

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}
