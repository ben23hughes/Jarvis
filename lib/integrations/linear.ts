import { LinearClient } from '@linear/sdk'
import { getValidToken } from '@/lib/oauth/token-refresh'
import type { LinearIssue } from '@/types/dashboard'

async function getLinearClient(userId: string) {
  const accessToken = await getValidToken(userId, 'linear')
  return new LinearClient({ accessToken })
}

export async function getMyIssues(
  userId: string,
  states?: string[]
): Promise<LinearIssue[]> {
  const linear = await getLinearClient(userId)
  const me = await linear.viewer

  const issues = await me.assignedIssues({
    filter: states?.length
      ? { state: { name: { in: states } } }
      : { state: { type: { nin: ['completed', 'cancelled'] } } },
    first: 20,
  })

  return Promise.all(
    issues.nodes.map(async (issue) => {
      const state = await issue.state
      const assignee = await issue.assignee
      return {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        state: state?.name ?? 'Unknown',
        priority: issue.priority,
        assignee: assignee?.name,
        url: issue.url,
        updatedAt: issue.updatedAt.toISOString(),
      }
    })
  )
}

export async function createLinearIssue(
  userId: string,
  params: {
    title: string
    description?: string
    teamId?: string
    priority?: number
    assigneeId?: string
  }
): Promise<LinearIssue> {
  const linear = await getLinearClient(userId)

  // Get first team if no teamId provided
  let teamId = params.teamId
  if (!teamId) {
    const teams = await linear.teams()
    teamId = teams.nodes[0]?.id
    if (!teamId) throw new Error('No teams found in Linear')
  }

  const result = await linear.createIssue({
    title: params.title,
    description: params.description,
    teamId,
    priority: params.priority,
    assigneeId: params.assigneeId,
  })

  const issue = await result.issue
  if (!issue) throw new Error('Failed to create Linear issue')

  const state = await issue.state
  const assignee = await issue.assignee
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    state: state?.name ?? 'Unknown',
    priority: issue.priority,
    assignee: assignee?.name,
    url: issue.url,
    updatedAt: issue.updatedAt.toISOString(),
  }
}

export async function updateLinearIssue(
  userId: string,
  issueId: string,
  updates: {
    title?: string
    description?: string
    stateId?: string
    priority?: number
    assigneeId?: string
  }
): Promise<LinearIssue> {
  const linear = await getLinearClient(userId)

  const result = await linear.updateIssue(issueId, updates)
  const issue = await result.issue
  if (!issue) throw new Error('Failed to update Linear issue')

  const state = await issue.state
  const assignee = await issue.assignee
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    state: state?.name ?? 'Unknown',
    priority: issue.priority,
    assignee: assignee?.name,
    url: issue.url,
    updatedAt: issue.updatedAt.toISOString(),
  }
}

export async function searchLinearIssues(
  userId: string,
  query: string
): Promise<LinearIssue[]> {
  const linear = await getLinearClient(userId)

  const issues = await linear.issueSearch({ filter: { title: { containsIgnoreCase: query } }, first: 10 })

  return Promise.all(
    issues.nodes.map(async (issue) => {
      const state = await issue.state
      const assignee = await issue.assignee
      return {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        state: state?.name ?? 'Unknown',
        priority: issue.priority,
        assignee: assignee?.name,
        url: issue.url,
        updatedAt: issue.updatedAt.toISOString(),
      }
    })
  )
}
