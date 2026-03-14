import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  const filePath = join(process.cwd(), 'agent', 'index.mjs')
  const content = readFileSync(filePath, 'utf-8')
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/javascript',
      'Content-Disposition': 'attachment; filename="jarvis-agent.mjs"',
    },
  })
}
