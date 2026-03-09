import { getOAuthToken } from '@/lib/oauth/token-store'

async function graphRequest(userId: string, path: string, options?: RequestInit) {
  const token = await getOAuthToken(userId, 'microsoft_teams')
  if (!token) throw new Error('Microsoft Teams not connected')

  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Microsoft Graph error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export interface TeamsTeam {
  id: string
  displayName: string
  description?: string
}

export interface TeamsChannel {
  id: string
  displayName: string
  description?: string
}

export interface TeamsMessage {
  id: string
  createdDateTime: string
  body: { content: string; contentType: string }
  from?: { user?: { displayName?: string } }
  channelIdentity?: { teamId: string; channelId: string }
}

export async function getJoinedTeams(userId: string): Promise<TeamsTeam[]> {
  const data = await graphRequest(userId, '/me/joinedTeams')
  return data.value ?? []
}

export async function getTeamChannels(userId: string, teamId: string): Promise<TeamsChannel[]> {
  const data = await graphRequest(userId, `/teams/${teamId}/channels`)
  return data.value ?? []
}

export async function getChannelMessages(
  userId: string,
  teamId: string,
  channelId: string,
  limit = 20
): Promise<TeamsMessage[]> {
  const data = await graphRequest(
    userId,
    `/teams/${teamId}/channels/${channelId}/messages?$top=${limit}`
  )
  return data.value ?? []
}

export async function sendChannelMessage(
  userId: string,
  teamId: string,
  channelId: string,
  content: string
): Promise<TeamsMessage> {
  return graphRequest(userId, `/teams/${teamId}/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      body: { contentType: 'text', content },
    }),
  })
}

export async function getMyChats(userId: string): Promise<Array<{
  id: string
  chatType: string
  topic?: string
  members?: Array<{ displayName?: string }>
}>> {
  const data = await graphRequest(userId, '/me/chats?$expand=members&$top=20')
  return data.value ?? []
}

export async function getChatMessages(
  userId: string,
  chatId: string,
  limit = 20
): Promise<TeamsMessage[]> {
  const data = await graphRequest(userId, `/me/chats/${chatId}/messages?$top=${limit}`)
  return data.value ?? []
}
