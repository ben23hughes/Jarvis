const { app, BrowserWindow, screen } = require('electron')
const path = require('path')

// No dock icon on macOS
if (app.dock) app.dock.hide()

let widgetWin = null
let edgeWin = null
let errorTimer = null

function createWindows() {
  const display = screen.getPrimaryDisplay()
  const { bounds, workArea } = display

  // ── Edge glow window (full screen, sits behind everything) ──────────────────
  edgeWin = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    transparent: true,
    frame: false,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })
  edgeWin.setIgnoreMouseEvents(true)
  edgeWin.setAlwaysOnTop(true, 'screen-saver')
  if (process.platform !== 'win32') {
    edgeWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  }
  edgeWin.loadFile(path.join(__dirname, 'edge.html'))
  edgeWin.once('ready-to-show', () => edgeWin.show())

  // ── Status widget (bottom-right corner, above taskbar) ──────────────────────
  const W = 200
  const H = 58
  const MARGIN = 16
  widgetWin = new BrowserWindow({
    x: workArea.x + workArea.width - W - MARGIN,
    y: workArea.y + workArea.height - H - MARGIN,
    width: W,
    height: H,
    transparent: true,
    frame: false,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })
  widgetWin.setIgnoreMouseEvents(true)
  widgetWin.setAlwaysOnTop(true, 'screen-saver')
  if (process.platform !== 'win32') {
    widgetWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  }
  widgetWin.loadFile(path.join(__dirname, 'widget.html'))
  widgetWin.once('ready-to-show', () => widgetWin.show())
}

function broadcast(event, tool) {
  const payload = tool ? { event, tool } : { event }
  widgetWin?.webContents.send('status', payload)
  edgeWin?.webContents.send('status', payload)
}

// Read JSON commands from the agent via stdin
function startStdinReader() {
  process.stdin.setEncoding('utf8')
  let buf = ''

  process.stdin.on('data', (chunk) => {
    buf += chunk
    const lines = buf.split('\n')
    buf = lines.pop() // hold incomplete last line
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const { event, tool } = JSON.parse(trimmed)
        if (!event) continue

        // Auto-clear errors after 3s, notifications after 5s
        if (event === 'error') {
          clearTimeout(errorTimer)
          errorTimer = setTimeout(() => broadcast('idle', null), 3000)
        } else if (event === 'notification') {
          clearTimeout(errorTimer)
          errorTimer = setTimeout(() => broadcast('idle', null), 5000)
        } else {
          clearTimeout(errorTimer)
        }

        broadcast(event, tool ?? null)
      } catch { /* ignore bad JSON */ }
    }
  })

  // Parent process exited — quit overlay
  process.stdin.on('end', () => app.quit())
}

app.whenReady().then(() => {
  createWindows()
  startStdinReader()
})

app.on('window-all-closed', () => app.quit())
