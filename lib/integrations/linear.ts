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
