#!/usr/bin/env node
/**
 * Jarvis Local Agent
 * Polls the Jarvis server for tasks and executes them on your machine.
 *
 * Usage:
 *   JARVIS_KEY=jv_xxx JARVIS_URL=http://localhost:3000 node agent/index.mjs
 *
 * Or set these in agent/.env (loaded automatically):
 *   JARVIS_KEY=jv_xxx
 *   JARVIS_URL=http://localhost:3000
 */

import { execSync, spawn } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { createInterface } from 'readline'

// Load .env from agent/ directory if present
const envPath = new URL('.env', import.meta.url).pathname
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
  }
}

const JARVIS_KEY = process.env.JARVIS_KEY
const JARVIS_URL = (process.env.JARVIS_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const POLL_INTERVAL = 1500 // ms
const HEARTBEAT_INTERVAL = 5000 // ms

if (!JARVIS_KEY) {
  console.error('❌  JARVIS_KEY is required. Get it from the Jarvis 4 page in Jarvis.')
  console.error('   Set it in agent/.env or as an environment variable.')
  process.exit(1)
}

const headers = { Authorization: `Bearer ${JARVIS_KEY}`, 'Content-Type': 'application/json' }

// ── Tool implementations ───────────────────────────────────────────────────────

function readFile({ path: filePath }) {
  const abs = resolve(filePath)
  if (!existsSync(abs)) throw new Error(`File not found: ${filePath}`)
  const content = readFileSync(abs, 'utf-8')
  return { path: abs, content, lines: content.split('\n').length }
}

function writeFile({ path: filePath, content }) {
  const abs = resolve(filePath)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content, 'utf-8')
  return { path: abs, written: true, bytes: Buffer.byteLength(content) }
}

function listFiles({ directory = '.', pattern }) {
  const abs = resolve(directory)
  if (!existsSync(abs)) throw new Error(`Directory not found: ${directory}`)

  function walk(dir, depth = 0) {
    if (depth > 4) return []
    const entries = readdirSync(dir, { withFileTypes: true })
    const results = []
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const fullPath = join(dir, entry.name)
      const rel = fullPath.replace(abs + '/', '')
      if (entry.isDirectory()) {
        results.push({ path: rel, type: 'dir' })
        results.push(...walk(fullPath, depth + 1))
      } else {
        if (!pattern || rel.includes(pattern) || entry.name.includes(pattern)) {
          const stat = statSync(fullPath)
          results.push({ path: rel, type: 'file', size: stat.size })
        }
      }
    }
    return results
  }

  return { directory: abs, files: walk(abs) }
}

function runCommand({ command, cwd }) {
  const workDir = cwd ? resolve(cwd) : process.cwd()
  try {
    const output = execSync(command, {
      cwd: workDir,
      timeout: 30_000,
      maxBuffer: 1024 * 1024 * 5,
    }).toString()
    return { command, cwd: workDir, output, exit_code: 0 }
  } catch (err) {
    return {
      command,
      cwd: workDir,
      output: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? err.message,
      exit_code: err.status ?? 1,
    }
  }
}

function searchFiles({ query, directory = '.', file_pattern }) {
  const abs = resolve(directory)
  const grepPattern = file_pattern ? `--include="${file_pattern}"` : ''
  try {
    const output = execSync(
      `grep -rn ${grepPattern} "${query}" "${abs}" --max-count=5 -l`,
      { timeout: 10_000 }
    ).toString()
    const files = output.trim().split('\n').filter(Boolean)

    const results = files.slice(0, 20).map((f) => {
      try {
        const lines = readFileSync(f, 'utf-8').split('\n')
        const matches = lines
          .map((l, i) => ({ line: i + 1, text: l }))
          .filter((l) => l.text.includes(query))
          .slice(0, 5)
        return { file: f.replace(abs + '/', ''), matches }
      } catch {
        return { file: f, matches: [] }
      }
    })

    return { query, results }
  } catch {
    return { query, results: [] }
  }
}

function gitStatus({ cwd }) {
  const workDir = cwd ? resolve(cwd) : process.cwd()
  try {
    const status = execSync('git status --short', { cwd: workDir }).toString()
    const branch = execSync('git branch --show-current', { cwd: workDir }).toString().trim()
    const log = execSync('git log --oneline -5', { cwd: workDir }).toString()
    return { branch, status, recent_commits: log }
  } catch (err) {
    throw new Error(`Git error: ${err.message}`)
  }
}

// ── Task dispatcher ────────────────────────────────────────────────────────────

async function executeTask(tool, input) {
  switch (tool) {
    case 'read_file':    return readFile(input)
    case 'write_file':   return writeFile(input)
    case 'list_files':   return listFiles(input)
    case 'run_command':  return runCommand(input)
    case 'search_files': return searchFiles(input)
    case 'git_status':   return gitStatus(input)
    default: throw new Error(`Unknown tool: ${tool}`)
  }
}

// ── Polling loop ───────────────────────────────────────────────────────────────

async function pollTasks() {
  try {
    const res = await fetch(`${JARVIS_URL}/api/agent/tasks`, { headers })
    if (!res.ok) {
      if (res.status === 401) { console.error('❌  Invalid API key'); process.exit(1) }
      return
    }
    const { tasks } = await res.json()
    for (const task of tasks ?? []) {
      try {
        console.log(`▶  ${task.tool}`, JSON.stringify(task.input).slice(0, 80))
        const result = await executeTask(task.tool, task.input)
        await fetch(`${JARVIS_URL}/api/agent/tasks/${task.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'completed', result }),
        })
        console.log(`✓  ${task.tool} done`)
      } catch (err) {
        await fetch(`${JARVIS_URL}/api/agent/tasks/${task.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'failed', error: err.message }),
        })
        console.error(`✗  ${task.tool} failed:`, err.message)
      }
    }
  } catch (err) {
    // Network error — server might be down, keep retrying silently
  }
}

async function sendHeartbeat() {
  try {
    await fetch(`${JARVIS_URL}/api/agent/heartbeat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ cwd: process.cwd() }),
    })
  } catch { /* ignore */ }
}

// ── Start ──────────────────────────────────────────────────────────────────────

console.log(`🤖  Jarvis Agent`)
console.log(`   Server : ${JARVIS_URL}`)
console.log(`   CWD    : ${process.cwd()}`)
console.log(`   Polling every ${POLL_INTERVAL}ms\n`)

// Initial heartbeat
await sendHeartbeat()

// Heartbeat loop
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)

// Poll loop
setInterval(pollTasks, POLL_INTERVAL)
