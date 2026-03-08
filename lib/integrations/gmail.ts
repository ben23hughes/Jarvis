import { google } from 'googleapis'
import { getValidToken } from '@/lib/oauth/token-refresh'
import type { Email } from '@/types/dashboard'

async function getGmailClient(userId: string) {
  const accessToken = await getValidToken(userId, 'gmail')
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.gmail({ version: 'v1', auth })
}

export async function getRecentEmails(userId: string, maxResults = 10): Promise<Email[]> {
  const gmail = await getGmailClient(userId)

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    labelIds: ['INBOX'],
  })

  const messages = listResponse.data.messages ?? []

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      })

      const headers = detail.data.payload?.headers ?? []
      const get = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''

      return {
        id: msg.id ?? '',
        threadId: detail.data.threadId ?? '',
        subject: get('Subject') || '(No subject)',
        from: get('From'),
        snippet: detail.data.snippet ?? '',
        date: get('Date'),
        isUnread: (detail.data.labelIds ?? []).includes('UNREAD'),
      }
    })
  )

  return emails
}

export async function searchEmails(
  userId: string,
  query: string,
  maxResults = 10
): Promise<Email[]> {
  const gmail = await getGmailClient(userId)

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults,
  })

  const messages = listResponse.data.messages ?? []
  if (messages.length === 0) return []

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      })

      const headers = detail.data.payload?.headers ?? []
      const get = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''

      return {
        id: msg.id ?? '',
        threadId: detail.data.threadId ?? '',
        subject: get('Subject') || '(No subject)',
        from: get('From'),
        snippet: detail.data.snippet ?? '',
        date: get('Date'),
        isUnread: (detail.data.labelIds ?? []).includes('UNREAD'),
      }
    })
  )

  return emails
}
