import { getUpcomingEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/integrations/google-calendar'
import { getRecentEmails, searchEmails, sendEmail, replyToEmail } from '@/lib/integrations/gmail'
import { getRecentMessages, searchSlackMessages, sendSlackMessage } from '@/lib/integrations/slack'
import { getMyIssues, searchLinearIssues, createLinearIssue, updateLinearIssue } from '@/lib/integrations/linear'

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

    case 'update_calendar_event':
      return updateCalendarEvent(userId, input.event_id as string, {
        title: input.title as string | undefined,
        start: input.start as string | undefined,
        end: input.end as string | undefined,
        description: input.description as string | undefined,
        attendees: input.attendees as string[] | undefined,
      })

    case 'delete_calendar_event':
      return deleteCalendarEvent(userId, input.event_id as string)

    case 'send_email':
      return sendEmail(userId, input.to as string, input.subject as string, input.body as string)

    case 'reply_to_email':
      return replyToEmail(
        userId,
        input.thread_id as string,
        input.to as string,
        input.subject as string,
        input.body as string
      )

    case 'send_slack_message':
      return sendSlackMessage(userId, input.channel as string, input.text as string)

    case 'create_linear_issue':
      return createLinearIssue(userId, {
        title: input.title as string,
        description: input.description as string | undefined,
        priority: input.priority as number | undefined,
        teamId: input.team_id as string | undefined,
      })

    case 'update_linear_issue':
      return updateLinearIssue(userId, input.issue_id as string, {
        title: input.title as string | undefined,
        description: input.description as string | undefined,
        stateId: input.state_id as string | undefined,
        priority: input.priority as number | undefined,
      })

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}
