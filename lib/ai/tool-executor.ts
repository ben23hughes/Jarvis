import { getUpcomingEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/integrations/google-calendar'
import { getRecentEmails, searchEmails, sendEmail, replyToEmail } from '@/lib/integrations/gmail'
import { getRecentMessages, searchSlackMessages, sendSlackMessage } from '@/lib/integrations/slack'
import { getMyIssues, searchLinearIssues, createLinearIssue, updateLinearIssue } from '@/lib/integrations/linear'
import { getMyPullRequests, getAssignedIssues, searchGithub } from '@/lib/integrations/github'
import { searchNotionPages, getNotionPageContent, createNotionPage } from '@/lib/integrations/notion'
import { searchDriveFiles, getDriveFileContent } from '@/lib/integrations/google-drive'
import { listContacts, createContact } from '@/lib/contacts'
import { saveMemory, listMemories } from '@/lib/memories'
import { createReminder, listReminders } from '@/lib/reminders'
import { sendSmsToUser } from '@/lib/twilio'
import { webSearch } from '@/lib/tavily'

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  switch (toolName) {
    // Calendar
    case 'get_calendar_events':
      return getUpcomingEvents(userId, (input.days_ahead as number) ?? 7, (input.max_results as number) ?? 10)
    case 'create_calendar_event':
      return createCalendarEvent(userId, {
        title: input.title as string,
        start: input.start as string,
        end: input.end as string,
        description: input.description as string | undefined,
        attendees: input.attendees as string[] | undefined,
      })
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

    // Gmail
    case 'get_recent_emails':
      return getRecentEmails(userId, (input.max_results as number) ?? 10)
    case 'search_emails':
      return searchEmails(userId, input.query as string, (input.max_results as number) ?? 10)
    case 'send_email':
      return sendEmail(userId, input.to as string, input.subject as string, input.body as string)
    case 'reply_to_email':
      return replyToEmail(userId, input.thread_id as string, input.to as string, input.subject as string, input.body as string)

    // Slack
    case 'get_slack_messages':
      return getRecentMessages(userId, (input.limit as number) ?? 20)
    case 'search_slack':
      return searchSlackMessages(userId, input.query as string)
    case 'send_slack_message':
      return sendSlackMessage(userId, input.channel as string, input.text as string)

    // Linear
    case 'get_linear_issues':
      return getMyIssues(userId, input.states as string[] | undefined)
    case 'search_linear':
      return searchLinearIssues(userId, input.query as string)
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

    // GitHub
    case 'get_github_prs':
      return getMyPullRequests(userId)
    case 'get_github_issues':
      return getAssignedIssues(userId)
    case 'search_github':
      return searchGithub(userId, input.query as string)

    // Notion
    case 'search_notion':
      return searchNotionPages(userId, input.query as string)
    case 'get_notion_page':
      return getNotionPageContent(userId, input.page_id as string)
    case 'create_notion_page':
      return createNotionPage(userId, input.title as string, input.content as string | undefined, input.parent_page_id as string | undefined)

    // Google Drive
    case 'search_drive':
      return searchDriveFiles(userId, input.query as string, (input.max_results as number) ?? 10)
    case 'get_drive_file':
      return getDriveFileContent(userId, input.file_id as string)

    // Contacts
    case 'lookup_contact':
      return listContacts(userId, input.query as string, 10)
    case 'list_contacts':
      return listContacts(userId, undefined, (input.limit as number) ?? 20)
    case 'create_contact':
      return createContact(userId, {
        first_name: input.first_name as string,
        last_name: input.last_name as string | undefined,
        email: input.email as string | undefined,
        phone: input.phone as string | undefined,
        company: input.company as string | undefined,
        title: input.title as string | undefined,
        notes: input.notes as string | undefined,
      })

    // Memory
    case 'remember':
      return saveMemory(userId, input.content as string, (input.category as string) ?? 'general')
    case 'recall_memories':
      return listMemories(userId, 30)

    // Reminders
    case 'create_reminder':
      return createReminder(userId, input.message as string, input.remind_at as string, (input.channel as 'sms' | 'email') ?? 'email')
    case 'list_reminders':
      return listReminders(userId)

    // SMS
    case 'send_sms':
      return sendSmsToUser(userId, input.message as string)

    // Web search
    case 'web_search':
      return webSearch(input.query as string, (input.max_results as number) ?? 5)

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}
