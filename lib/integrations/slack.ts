import { WebClient } from '@slack/web-api'
import { getValidToken } from '@/lib/oauth/token-refresh'
import { getOAuthToken } from '@/lib/oauth/token-store'
import type { SlackMessage } from '@/types/dashboard'

async function getSlackClient(userId: string) {
  const accessToken = await getValidToken(userId, 'slack')
  return new WebClient(accessToken)
}

// search.messages requires a user token (search:read is a user scope, not bot scope)
async function getSlackUserClient(userId: string): Promise<WebClient | null> {
  const token = await getOAuthToken(userId, 'slack')
  const userToken = token?.provider_metadata?.user_token as string | null
  if (!userToken) return null
  return new WebClient(userToken)
}

export async function getRecentMessages(
  userId: string,
  limit = 20
): Promise<SlackMessage[]> {
  const slack = await getSlackClient(userId)

  // Get channels the user is in
  const channelsResponse = await slack.conversations.list({
    types: 'public_channel,private_channel',
    exclude_archived: true,
    limit: 10,
  })

  const channels = (channelsResponse.channels ?? [])
    .filter((c) => c.is_member)
    .slice(0, 5)

  const allMessages: SlackMessage[] = []

  for (const channel of channels) {
    const historyResponse = await slack.conversations.history({
      channel: channel.id!,
      limit: Math.ceil(limit / channels.length),
    })

    const msgs = (historyResponse.messages ?? []).map((msg) => ({
      id: msg.ts ?? '',
      channelId: channel.id ?? '',
      channelName: channel.name ?? '',
      user: msg.user ?? 'unknown',
      text: msg.text ?? '',
      ts: msg.ts ?? '',
    }))

    allMessages.push(...msgs)
  }

  return allMessages.sort((a, b) => parseFloat(b.ts) - parseFloat(a.ts)).slice(0, limit)
}

export async function sendSlackMessage(
  userId: string,
  channel: string,
  text: string
): Promise<{ ts: string; channel: string }> {
  const slack = await getSlackClient(userId)

  const response = await slack.chat.postMessage({ channel, text })

  if (!response.ok) throw new Error(`Slack send failed: ${response.error}`)

  return {
    ts: response.ts ?? '',
    channel: response.channel ?? channel,
  }
}

export async function searchSlackMessages(
  userId: string,
  query: string
): Promise<SlackMessage[]> {
  const slack = await getSlackUserClient(userId)

  if (!slack) {
    return [{ id: '', channelId: '', channelName: '', user: '', text: 'Slack search requires reconnecting Slack to grant the search permission.', ts: '' }]
  }

  const response = await slack.search.messages({ query, count: 10 })
  const matches = response.messages?.matches ?? []

  return matches.map((msg) => ({
    id: msg.ts ?? '',
    channelId: (msg.channel as { id?: string })?.id ?? '',
    channelName: (msg.channel as { name?: string })?.name ?? '',
    user: msg.username ?? '',
    text: msg.text ?? '',
    ts: msg.ts ?? '',
  }))
}
