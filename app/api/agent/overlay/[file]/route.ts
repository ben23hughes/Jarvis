import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

const ALLOWED = new Set(['main.js', 'preload.js', 'widget.html', 'edge.html', 'package.json'])

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params
  if (!ALLOWED.has(file)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const filePath = join(process.cwd(), 'agent', 'overlay', file)
  const content = readFileSync(filePath, 'utf-8')

  const contentType = file.endsWith('.html') ? 'text/html'
    : file.endsWith('.json') ? 'application/json'
    : 'application/javascript'

  return new NextResponse(content, { headers: { 'Content-Type': contentType } })
}
