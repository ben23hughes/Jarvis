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

export async function sendEmail(
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<{ id: string; threadId: string }> {
  const gmail = await getGmailClient(userId)

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\n')

  const encoded = Buffer.from(message).toString('base64url')

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded },
  })

  return {
    id: response.data.id ?? '',
    threadId: response.data.threadId ?? '',
  }
}

export async function replyToEmail(
  userId: string,
  threadId: string,
  to: string,
  subject: string,
  body: string
): Promise<{ id: string; threadId: string }> {
  const gmail = await getGmailClient(userId)

  const message = [
    `To: ${to}`,
    `Subject: Re: ${subject.replace(/^Re:\s*/i, '')}`,
    `In-Reply-To: ${threadId}`,
    `References: ${threadId}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\n')

  const encoded = Buffer.from(message).toString('base64url')

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded, threadId },
  })

  return {
    id: response.data.id ?? '',
    threadId: response.data.threadId ?? '',
  }
}

export async function sendEmailWithAttachment(
  userId: string,
  to: string,
  subject: string,
  body: string,
  attachment: { filename: string; content: string; mimeType: string }
): Promise<{ id: string; threadId: string }> {
  const gmail = await getGmailClient(userId)

  const boundary = `boundary_${Date.now()}`
  const attachmentBase64 = Buffer.from(attachment.content).toString('base64')

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
    '',
    `--${boundary}`,
    `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
    `Content-Disposition: attachment; filename="${attachment.filename}"`,
    'Content-Transfer-Encoding: base64',
    '',
    attachmentBase64,
    '',
    `--${boundary}--`,
  ].join('\n')

  const encoded = Buffer.from(message).toString('base64url')

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded },
  })

  return {
    id: response.data.id ?? '',
    threadId: response.data.threadId ?? '',
  }
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
