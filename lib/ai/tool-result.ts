import type Anthropic from '@anthropic-ai/sdk'

/**
 * Tools that return screenshots send this shape so the chat loop
 * can forward the image to Claude as a vision content block.
 */
export interface ImageToolResult {
  __image: true
  base64: string
  media_type: 'image/png' | 'image/jpeg'
  description: string
}

export function isImageResult(v: unknown): v is ImageToolResult {
  return typeof v === 'object' && v !== null && '__image' in v
}

/**
 * Format a tool result into the content field Anthropic expects.
 * Image results get a text description + an image block so Claude can see them.
 */
export function formatToolContent(
  result: unknown
): Anthropic.ToolResultBlockParam['content'] {
  if (isImageResult(result)) {
    return [
      { type: 'text', text: result.description },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: result.media_type,
          data: result.base64,
        },
      },
    ]
  }
  return JSON.stringify(result)
}
