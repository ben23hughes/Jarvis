import { getValidToken } from '@/lib/oauth/token-refresh'

async function todoistFetch(userId: string, path: string, options?: RequestInit) {
  const token = await getValidToken(userId, 'todoist')
  const res = await fetch(`https://api.todoist.com/rest/v2${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) ?? {}),
    },
  })
  if (res.status === 204) return null
  if (!res.ok) throw new Error(`Todoist API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function getTasks(userId: string, filter?: string) {
  // filter examples: 'today', 'overdue', 'p1', '#Work'
  const params = filter ? `?filter=${encodeURIComponent(filter)}` : ''
  return todoistFetch(userId, `/tasks${params}`)
}

export async function getProjects(userId: string) {
  return todoistFetch(userId, '/projects')
}

export async function createTask(
  userId: string,
  params: {
    content: string
    description?: string
    project_id?: string
    due_string?: string // e.g. "tomorrow", "next monday at 2pm"
    priority?: number // 1-4, 4=urgent
    labels?: string[]
  }
) {
  return todoistFetch(userId, '/tasks', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function completeTask(userId: string, taskId: string) {
  await todoistFetch(userId, `/tasks/${taskId}/close`, { method: 'POST' })
  return { ok: true, task_id: taskId }
}

export async function updateTask(
  userId: string,
  taskId: string,
  updates: {
    content?: string
    description?: string
    due_string?: string
    priority?: number
  }
) {
  return todoistFetch(userId, `/tasks/${taskId}`, {
    method: 'POST',
    body: JSON.stringify(updates),
  })
}
