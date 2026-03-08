export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  attendees?: string[]
  htmlLink?: string
}

export interface Email {
  id: string
  threadId: string
  subject: string
  from: string
  snippet: string
  date: string
  isUnread: boolean
}

export interface SlackMessage {
  id: string
  channelId: string
  channelName: string
  user: string
  text: string
  ts: string
}

export interface LinearIssue {
  id: string
  identifier: string
  title: string
  state: string
  priority: number
  assignee?: string
  url: string
  updatedAt: string
}
