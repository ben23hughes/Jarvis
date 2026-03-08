import { Client } from '@notionhq/client'
import { getValidToken } from '@/lib/oauth/token-refresh'

async function getNotionClient(userId: string) {
  const token = await getValidToken(userId, 'notion')
  return new Client({ auth: token })
}

export interface NotionPage {
  id: string
  title: string
  url: string
  lastEdited: string
}

export async function searchNotionPages(userId: string, query: string): Promise<NotionPage[]> {
  const notion = await getNotionClient(userId)

  const response = await notion.search({
    query,
    filter: { value: 'page', property: 'object' },
    page_size: 10,
  })

  return response.results.map((page) => {
    const p = page as { id: string; url: string; last_edited_time: string; properties?: Record<string, { title?: Array<{ plain_text?: string }> }> }
    const titleProp = p.properties?.title?.title ?? p.properties?.Name?.title ?? []
    const title = titleProp.map((t) => t.plain_text).join('') || '(Untitled)'
    return {
      id: p.id,
      title,
      url: p.url,
      lastEdited: p.last_edited_time,
    }
  })
}

export async function getNotionPageContent(userId: string, pageId: string): Promise<string> {
  const notion = await getNotionClient(userId)

  const blocks = await notion.blocks.children.list({ block_id: pageId, page_size: 50 })

  const text = blocks.results
    .map((block) => {
      const b = block as { type: string; [key: string]: unknown }
      const content = b[b.type] as { rich_text?: Array<{ plain_text?: string }> } | undefined
      return content?.rich_text?.map((t) => t.plain_text).join('') ?? ''
    })
    .filter(Boolean)
    .join('\n')

  return text
}

export async function createNotionPage(
  userId: string,
  title: string,
  content?: string,
  parentPageId?: string
): Promise<NotionPage> {
  const notion = await getNotionClient(userId)

  // Find a parent — either the provided pageId or the first available page
  let parent: { type: 'page_id'; page_id: string } | { type: 'workspace'; workspace: true }
  if (parentPageId) {
    parent = { type: 'page_id', page_id: parentPageId }
  } else {
    parent = { type: 'workspace', workspace: true }
  }

  const response = await notion.pages.create({
    parent: parent as Parameters<typeof notion.pages.create>[0]['parent'],
    properties: {
      title: {
        title: [{ text: { content: title } }],
      },
    },
    children: content
      ? [
          {
            object: 'block' as const,
            type: 'paragraph' as const,
            paragraph: {
              rich_text: [{ type: 'text' as const, text: { content } }],
            },
          },
        ]
      : [],
  })

  return {
    id: response.id,
    title,
    url: (response as { url: string }).url,
    lastEdited: (response as { last_edited_time: string }).last_edited_time,
  }
}
