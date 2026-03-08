import { Octokit } from '@octokit/rest'
import { getValidToken } from '@/lib/oauth/token-refresh'

async function getOctokit(userId: string) {
  const token = await getValidToken(userId, 'github')
  return new Octokit({ auth: token })
}

export interface GithubPR {
  id: number
  number: number
  title: string
  state: string
  url: string
  repo: string
  author: string
  createdAt: string
  updatedAt: string
}

export interface GithubIssue {
  id: number
  number: number
  title: string
  state: string
  url: string
  repo: string
  labels: string[]
  createdAt: string
}

export async function getMyPullRequests(userId: string): Promise<GithubPR[]> {
  const octokit = await getOctokit(userId)

  const response = await octokit.search.issuesAndPullRequests({
    q: 'is:pr is:open author:@me',
    sort: 'updated',
    per_page: 20,
  })

  return response.data.items.map((item) => ({
    id: item.id,
    number: item.number,
    title: item.title,
    state: item.state,
    url: item.html_url,
    repo: item.repository_url.split('/').slice(-2).join('/'),
    author: item.user?.login ?? '',
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
}

export async function getAssignedIssues(userId: string): Promise<GithubIssue[]> {
  const octokit = await getOctokit(userId)

  const response = await octokit.search.issuesAndPullRequests({
    q: 'is:issue is:open assignee:@me',
    sort: 'updated',
    per_page: 20,
  })

  return response.data.items.map((item) => ({
    id: item.id,
    number: item.number,
    title: item.title,
    state: item.state,
    url: item.html_url,
    repo: item.repository_url.split('/').slice(-2).join('/'),
    labels: item.labels.map((l) => (typeof l === 'string' ? l : l.name ?? '')),
    createdAt: item.created_at,
  }))
}

export async function searchGithub(userId: string, query: string): Promise<GithubIssue[]> {
  const octokit = await getOctokit(userId)

  const response = await octokit.search.issuesAndPullRequests({
    q: query,
    per_page: 10,
  })

  return response.data.items.map((item) => ({
    id: item.id,
    number: item.number,
    title: item.title,
    state: item.state,
    url: item.html_url,
    repo: item.repository_url.split('/').slice(-2).join('/'),
    labels: item.labels.map((l) => (typeof l === 'string' ? l : l.name ?? '')),
    createdAt: item.created_at,
  }))
}
