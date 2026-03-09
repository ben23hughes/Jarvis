import { getOAuthToken } from '@/lib/oauth/token-store'

async function zoomRequest(userId: string, path: string, options?: RequestInit) {
  const token = await getOAuthToken(userId, 'zoom')
  if (!token) throw new Error('Zoom not connected')

  const response = await fetch(`https://api.zoom.us/v2${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Zoom API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export interface ZoomMeeting {
  id: number
  topic: string
  type: number
  start_time: string
  duration: number
  timezone: string
  join_url: string
  status: string
}

export async function getUpcomingMeetings(userId: string): Promise<ZoomMeeting[]> {
  const data = await zoomRequest(userId, '/users/me/meetings?type=upcoming&page_size=20')
  return data.meetings ?? []
}

export async function getMeetingDetails(userId: string, meetingId: string): Promise<ZoomMeeting> {
  return zoomRequest(userId, `/meetings/${meetingId}`)
}

export async function createZoomMeeting(
  userId: string,
  params: {
    topic: string
    start_time: string
    duration: number
    agenda?: string
    password?: string
  }
): Promise<ZoomMeeting> {
  return zoomRequest(userId, '/users/me/meetings', {
    method: 'POST',
    body: JSON.stringify({
      topic: params.topic,
      type: 2, // Scheduled meeting
      start_time: params.start_time,
      duration: params.duration,
      agenda: params.agenda,
      password: params.password,
      settings: {
        waiting_room: false,
        join_before_host: true,
      },
    }),
  })
}

export async function deleteZoomMeeting(userId: string, meetingId: string): Promise<void> {
  const token = await getOAuthToken(userId, 'zoom')
  if (!token) throw new Error('Zoom not connected')

  await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token.access_token}` },
  })
}

export async function getZoomRecordings(userId: string, from?: string): Promise<{
  meetings: Array<{
    id: number
    topic: string
    start_time: string
    duration: number
    recording_files: Array<{ download_url: string; file_type: string }>
  }>
}> {
  const fromDate = from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  return zoomRequest(userId, `/users/me/recordings?from=${fromDate}&page_size=10`)
}
