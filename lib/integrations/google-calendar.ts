import { google } from 'googleapis'
import { getValidToken } from '@/lib/oauth/token-refresh'
import type { CalendarEvent } from '@/types/dashboard'

async function getCalendarClient(userId: string) {
  const accessToken = await getValidToken(userId, 'google_calendar')
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.calendar({ version: 'v3', auth })
}

export async function getUpcomingEvents(
  userId: string,
  daysAhead = 7,
  maxResults = 10
): Promise<CalendarEvent[]> {
  const calendar = await getCalendarClient(userId)
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString()

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  })

  return (response.data.items ?? []).map((event) => ({
    id: event.id ?? '',
    title: event.summary ?? '(No title)',
    start: event.start?.dateTime ?? event.start?.date ?? '',
    end: event.end?.dateTime ?? event.end?.date ?? '',
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    attendees: event.attendees?.map((a) => a.email ?? '').filter(Boolean),
    htmlLink: event.htmlLink ?? undefined,
  }))
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  updates: {
    title?: string
    start?: string
    end?: string
    description?: string
    attendees?: string[]
  }
): Promise<CalendarEvent> {
  const calendar = await getCalendarClient(userId)

  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: {
      ...(updates.title && { summary: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.start && { start: { dateTime: updates.start } }),
      ...(updates.end && { end: { dateTime: updates.end } }),
      ...(updates.attendees && { attendees: updates.attendees.map((email) => ({ email })) }),
    },
  })

  const e = response.data
  return {
    id: e.id ?? '',
    title: e.summary ?? '',
    start: e.start?.dateTime ?? '',
    end: e.end?.dateTime ?? '',
    description: e.description ?? undefined,
    htmlLink: e.htmlLink ?? undefined,
  }
}

export async function deleteCalendarEvent(userId: string, eventId: string): Promise<void> {
  const calendar = await getCalendarClient(userId)
  await calendar.events.delete({ calendarId: 'primary', eventId })
}

export async function createCalendarEvent(
  userId: string,
  event: {
    title: string
    start: string
    end: string
    description?: string
    attendees?: string[]
  }
): Promise<CalendarEvent> {
  const calendar = await getCalendarClient(userId)

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.start },
      end: { dateTime: event.end },
      attendees: event.attendees?.map((email) => ({ email })),
    },
  })

  const e = response.data
  return {
    id: e.id ?? '',
    title: e.summary ?? '',
    start: e.start?.dateTime ?? '',
    end: e.end?.dateTime ?? '',
    description: e.description ?? undefined,
    htmlLink: e.htmlLink ?? undefined,
  }
}
