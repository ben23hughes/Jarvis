#!/usr/bin/env node
/**
 * Jarvis Local Agent
 * Connects to Jarvis and executes tasks on your machine via long-polling.
 *
 * Usage:
 *   JARVIS_KEY=jv_xxx JARVIS_URL=https://jarvis4.com node agent/index.mjs
 *
 * Or set these in agent/.env (loaded automatically):
 *   JARVIS_KEY=jv_xxx
 *   JARVIS_URL=https://jarvis4.com
 */

import { execSync, spawnSync, spawn } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { tmpdir } from 'os'

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
const JARVIS_URL = (process.env.JARVIS_URL ?? 'https://www.jarvis4.com').replace(/\/$/, '')
const HEARTBEAT_INTERVAL = 5000 // ms

// Token-saving limits
const MAX_FILE_LINES = 300
const MAX_COMMAND_CHARS = 8_000
const MAX_SEARCH_FILES = 10
const MAX_SEARCH_MATCHES = 5

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
  const raw = readFileSync(abs, 'utf-8')
  const lines = raw.split('\n')
  const truncated = lines.length > MAX_FILE_LINES
  const content = truncated ? lines.slice(0, MAX_FILE_LINES).join('\n') : raw
  return {
    path: abs,
    content,
    total_lines: lines.length,
    ...(truncated && { note: `Truncated to first ${MAX_FILE_LINES} of ${lines.length} lines` }),
  }
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

function truncateOutput(raw, max = MAX_COMMAND_CHARS) {
  if (raw.length <= max) return raw
  return raw.slice(0, max) + `\n… (truncated — ${raw.length} chars total, showing first ${max})`
}

function runCommand({ command, cwd }) {
  const workDir = cwd ? resolve(cwd) : process.cwd()
  try {
    const raw = execSync(command, {
      cwd: workDir,
      timeout: 30_000,
      maxBuffer: 1024 * 1024 * 5,
    }).toString()
    return { command, cwd: workDir, output: truncateOutput(raw), exit_code: 0 }
  } catch (err) {
    return {
      command,
      cwd: workDir,
      output: truncateOutput(err.stdout?.toString() ?? ''),
      stderr: truncateOutput(err.stderr?.toString() ?? err.message),
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

    const results = files.slice(0, MAX_SEARCH_FILES).map((f) => {
      try {
        const lines = readFileSync(f, 'utf-8').split('\n')
        const matches = lines
          .map((l, i) => ({ line: i + 1, text: l }))
          .filter((l) => l.text.includes(query))
          .slice(0, MAX_SEARCH_MATCHES)
        return { file: f.replace(abs + '/', ''), matches }
      } catch {
        return { file: f, matches: [] }
      }
    })

    return { query, results, total_files: files.length }
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

// ── Browser control (Playwright) ───────────────────────────────────────────────

let _browser = null
let _page = null

async function getPage() {
  if (!_page || _page.isClosed()) {
    const { chromium } = await import('playwright')
    _browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized'],
    })
    _page = await _browser.newPage()
    _page.setDefaultTimeout(15_000)
    console.log('🌐  Browser opened')
  }
  return _page
}

async function browserNavigate({ url, wait_for = 'load' }) {
  const page = await getPage()
  const waitUntil = ['load', 'networkidle', 'domcontentloaded'].includes(wait_for)
    ? wait_for
    : 'load'
  await page.goto(url, { waitUntil })
  const title = await page.title()
  const text = await page.evaluate(() => document.body?.innerText?.slice(0, 3000) ?? '')
  return { url: page.url(), title, text }
}

async function browserScreenshot({ full_page = false }) {
  const page = await getPage()
  const buffer = await page.screenshot({
    type: 'jpeg',
    quality: 75,
    fullPage: full_page,
  })
  const title = await page.title()
  return {
    __image: true,
    base64: buffer.toString('base64'),
    media_type: 'image/jpeg',
    description: `Browser screenshot — page: "${title}" at ${page.url()}`,
  }
}

async function browserClick({ selector, text }) {
  const page = await getPage()
  if (text) {
    await page.getByText(text, { exact: false }).first().click()
  } else if (selector) {
    await page.locator(selector).first().click()
  } else {
    throw new Error('Provide selector or text')
  }
  await page.waitForLoadState('load').catch(() => null)
  const title = await page.title()
  return { clicked: selector ?? text, current_url: page.url(), title }
}

async function browserType({ selector, text, clear_first = true, press_enter = false }) {
  const page = await getPage()
  const loc = page.locator(selector).first()
  if (clear_first) await loc.clear()
  await loc.type(text)
  if (press_enter) await loc.press('Enter')
  return { typed: text, into: selector }
}

async function browserGetText({ selector }) {
  const page = await getPage()
  if (selector) {
    const el = page.locator(selector).first()
    const text = await el.innerText()
    return { selector, text: text.slice(0, 5000) }
  }
  const text = await page.evaluate(() => document.body?.innerText?.slice(0, 8000) ?? '')
  return { url: page.url(), text }
}

async function browserEvaluate({ script }) {
  const page = await getPage()
  const result = await page.evaluate(script)
  return { result }
}

async function browserBack() {
  const page = await getPage()
  await page.goBack({ waitUntil: 'load' })
  return { url: page.url(), title: await page.title() }
}

async function browserClose() {
  if (_browser) {
    await _browser.close()
    _browser = null
    _page = null
    console.log('🌐  Browser closed')
  }
  return { closed: true }
}

// ── Screen control (macOS) ────────────────────────────────────────────────────

async function screenScreenshot() {
  const tmpPath = join(tmpdir(), `jarvis_screen_${Date.now()}.jpg`)
  try {
    execSync(`screencapture -x -t jpg "${tmpPath}"`, { timeout: 5000 })
    const buffer = readFileSync(tmpPath)
    return {
      __image: true,
      base64: buffer.toString('base64'),
      media_type: 'image/jpeg',
      description: 'Full desktop screenshot',
    }
  } finally {
    try { unlinkSync(tmpPath) } catch { /* ignore */ }
  }
}

async function screenClick({ x, y, double_click = false }) {
  const click = double_click ? 'double click' : 'click'
  execSync(
    `osascript -e 'tell application "System Events" to ${click} at {${x}, ${y}}'`,
    { timeout: 5000 }
  )
  return { clicked: { x, y }, double: double_click }
}

async function screenType({ text, press_return = false }) {
  const escaped = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  execSync(
    `osascript -e 'tell application "System Events" to keystroke "${escaped}"'`,
    { timeout: 5000 }
  )
  if (press_return) {
    execSync(`osascript -e 'tell application "System Events" to key code 36'`, { timeout: 3000 })
  }
  return { typed: text }
}

// ── Task dispatcher ────────────────────────────────────────────────────────────

async function executeTask(tool, input) {
  switch (tool) {
    case 'read_file':         return readFile(input)
    case 'write_file':        return writeFile(input)
    case 'list_files':        return listFiles(input)
    case 'run_command':       return runCommand(input)
    case 'search_files':      return searchFiles(input)
    case 'git_status':        return gitStatus(input)
    // Browser
    case 'browser_navigate':  return browserNavigate(input)
    case 'browser_screenshot':return browserScreenshot(input)
    case 'browser_click':     return browserClick(input)
    case 'browser_type':      return browserType(input)
    case 'browser_get_text':  return browserGetText(input)
    case 'browser_evaluate':  return browserEvaluate(input)
    case 'browser_back':      return browserBack()
    case 'browser_close':     return browserClose()
    // Screen
    case 'screen_screenshot': return screenScreenshot()
    case 'screen_click':      return screenClick(input)
    case 'screen_type':       return screenType(input)
    default: throw new Error(`Unknown tool: ${tool}`)
  }
}

async function executeAndReport(task) {
  notifyOverlay('executing', task.tool)
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
    notifyOverlay('error')
    await fetch(`${JARVIS_URL}/api/agent/tasks/${task.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'failed', error: err.message }),
    })
    console.error(`✗  ${task.tool} failed:`, err.message)
    return
  }
  notifyOverlay('idle')
}

// ── Long-poll loop (replaces setInterval polling) ─────────────────────────────

async function runLoop() {
  while (true) {
    try {
      const controller = new AbortController()
      // 25s — slightly longer than server's 20s hold, to avoid race on timeout
      const timeoutId = setTimeout(() => controller.abort(), 25_000)

      const res = await fetch(`${JARVIS_URL}/api/agent/tasks`, {
        headers,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        if (res.status === 401) { console.error('❌  Invalid API key'); process.exit(1) }
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }

      const { tasks } = await res.json()
      for (const task of tasks ?? []) {
        // Execute in background so we immediately re-enter the long-poll
        executeAndReport(task).catch(() => {})
      }
      // Loop immediately — server will hold the next request open if nothing pending
    } catch (err) {
      if (err.name === 'AbortError') {
        // Server timeout — reconnect immediately
        continue
      }
      // Network error — brief pause before retry
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}

// ── Overlay (cross-platform screen widget + edge glow via Electron) ───────────

const OVERLAY_DIR = new URL('overlay/', import.meta.url).pathname
const OVERLAY_FILES = ['package.json', 'main.js', 'preload.js', 'widget.html', 'edge.html']

let overlayProcess = null

function getElectronBin() {
  const base = join(OVERLAY_DIR, 'node_modules', '.bin', 'electron')
  if (process.platform === 'win32') {
    const cmd = base + '.cmd'
    if (existsSync(cmd)) return { bin: cmd, shell: true }
  }
  if (existsSync(base)) return { bin: base, shell: false }
  return null
}

async function bootstrapOverlay() {
  // Download any missing overlay files from the Jarvis server
  mkdirSync(OVERLAY_DIR, { recursive: true })
  let downloaded = false
  for (const file of OVERLAY_FILES) {
    const dest = join(OVERLAY_DIR, file)
    if (!existsSync(dest)) {
      try {
        const res = await fetch(`${JARVIS_URL}/api/agent/overlay/${file}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        writeFileSync(dest, await res.text(), 'utf-8')
        downloaded = true
      } catch (err) {
        console.warn(`⚠️  Could not download overlay/${file}: ${err.message}`)
        return false
      }
    }
  }
  if (downloaded) console.log('✓  Overlay files downloaded')

  // Run npm install if node_modules is missing
  if (!existsSync(join(OVERLAY_DIR, 'node_modules'))) {
    console.log('🎨  Installing overlay dependencies (one-time, ~200MB)…')
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const result = spawnSync(npm, ['install', '--prefer-offline'], {
      cwd: OVERLAY_DIR,
      stdio: 'inherit',
      timeout: 120_000,
    })
    if (result.status !== 0) {
      console.warn('⚠️  Overlay npm install failed — continuing without overlay')
      return false
    }
  }

  return true
}

async function spawnOverlay() {
  const ok = await bootstrapOverlay()
  if (!ok) return

  const electron = getElectronBin()
  if (!electron) {
    console.warn('⚠️  Electron not found after install — overlay disabled')
    return
  }

  overlayProcess = spawn(electron.bin, [OVERLAY_DIR], {
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: electron.shell,
  })
  overlayProcess.on('exit', () => { overlayProcess = null })
  console.log('🎨  Overlay running')
}

function notifyOverlay(event, tool = null) {
  if (!overlayProcess?.stdin?.writable) return
  try {
    const msg = JSON.stringify(tool ? { event, tool } : { event })
    overlayProcess.stdin.write(msg + '\n')
  } catch { /* ignore */ }
}

// ── Heartbeat ─────────────────────────────────────────────────────────────────

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
console.log(`   Mode   : long-poll (instant task delivery)`)

await sendHeartbeat()
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)

await spawnOverlay()
runLoop()
