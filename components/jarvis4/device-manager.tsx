'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Cpu, Wifi, WifiOff, Plus, Trash2, Copy, Check, ChevronDown, ChevronUp, Terminal } from 'lucide-react'
import type { Device } from '@/lib/devices'

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 30_000
}

function getPiScript(device: Device, baseUrl: string): string {
  return `#!/usr/bin/env python3
"""
Jarvis Pi — runs on your Raspberry Pi to connect it to Jarvis.
Install deps: pip install requests SpeechRecognition pyaudio mpg123
"""

import time
import subprocess
import threading
import tempfile
import os
import requests
import speech_recognition as sr

DEVICE_ID  = "${device.id}"
DEVICE_KEY = "${device.device_key}"
BASE_URL   = "${baseUrl}"
WAKE_WORD  = "jarvis"
VERSION    = "1.0.0"

headers = {"Authorization": f"Bearer {DEVICE_KEY}"}


def speak(text: str):
    """Speak text aloud using ElevenLabs TTS via Jarvis server."""
    try:
        r = requests.post(
            f"{BASE_URL}/api/tts",
            headers={**headers, "Content-Type": "application/json"},
            json={"text": text},
            timeout=15,
        )
        if r.ok:
            # Write audio to temp file and play with mpg123
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
                f.write(r.content)
                tmp_path = f.name
            subprocess.run(["mpg123", "-q", tmp_path], check=False)
            os.unlink(tmp_path)
            return
    except Exception as e:
        print(f"[tts error] {e}")
    # Fallback to espeak if ElevenLabs fails
    subprocess.run(["espeak", "-ven+f3", "-k5", "-s150", text], check=False)


def heartbeat():
    try:
        requests.post(
            f"{BASE_URL}/api/jarvis4/devices/{DEVICE_ID}/heartbeat",
            headers=headers,
            json={"version": VERSION},
            timeout=5,
        )
    except Exception:
        pass


def poll_messages():
    try:
        r = requests.get(
            f"{BASE_URL}/api/jarvis4/devices/{DEVICE_ID}/poll",
            headers=headers,
            timeout=5,
        )
        if r.ok:
            for msg in r.json().get("messages", []):
                print(f"[message] {msg['content']}")
                speak(msg["content"])
    except Exception:
        pass


def ask_jarvis(message: str) -> str:
    try:
        r = requests.post(
            f"{BASE_URL}/api/jarvis4/chat",
            headers=headers,
            json={"message": message},
            timeout=30,
        )
        if r.ok:
            return r.json().get("response", "Sorry, I had trouble with that.")
    except Exception:
        pass
    return "Sorry, I could not reach Jarvis."


def listen_loop():
    recognizer = sr.Recognizer()
    mic = sr.Microphone()

    print("[ready] Listening for wake word...")
    speak("Jarvis is ready.")

    with mic as source:
        recognizer.adjust_for_ambient_noise(source, duration=1)

    while True:
        try:
            with mic as source:
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)

            text = recognizer.recognize_google(audio).lower()
            print(f"[heard] {text}")

            if WAKE_WORD in text:
                query = text.split(WAKE_WORD, 1)[-1].strip(" ,.")
                if not query:
                    speak("Yes?")
                    with mic as source:
                        audio = recognizer.listen(source, timeout=8, phrase_time_limit=15)
                    query = recognizer.recognize_google(audio)

                print(f"[query] {query}")
                speak("On it.")
                response = ask_jarvis(query)
                print(f"[response] {response}")
                speak(response)

        except sr.WaitTimeoutError:
            pass
        except sr.UnknownValueError:
            pass
        except Exception as e:
            print(f"[error] {e}")


def main():
    # Background thread: heartbeat + message polling every 10 seconds
    def background():
        while True:
            heartbeat()
            poll_messages()
            time.sleep(10)

    threading.Thread(target=background, daemon=True).start()

    # Main thread: voice listener
    listen_loop()


if __name__ == "__main__":
    main()
`
}

interface Props {
  initialDevices: Device[]
}

export function DeviceManager({ initialDevices }: Props) {
  const [devices, setDevices] = useState(initialDevices)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDevice, setNewDevice] = useState<Device | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://jarvis4.com'

  async function addDevice() {
    if (!newName.trim()) return
    setCreating(true)
    const res = await fetch('/api/jarvis4/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const device = await res.json()
    setDevices((prev) => [device, ...prev])
    setNewDevice(device)
    setNewName('')
    setCreating(false)
    setShowScript(false)
  }

  async function removeDevice(id: string) {
    setDeletingId(id)
    await fetch(`/api/jarvis4/devices/${id}`, { method: 'DELETE' })
    setDevices((prev) => prev.filter((d) => d.id !== id))
    if (newDevice?.id === id) setNewDevice(null)
    setDeletingId(null)
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  function copyScript(device: Device) {
    navigator.clipboard.writeText(getPiScript(device, baseUrl))
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Cpu className="h-6 w-6" />
          Jarvis 4
        </h1>
        <p className="text-muted-foreground mt-1">
          Connect a Raspberry Pi so Jarvis can talk to you anywhere — no browser needed.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { n: '1', title: 'Register your Pi', body: 'Add a device here to get a unique API key.' },
          { n: '2', title: 'Run the script', body: 'Copy the Python script onto your Pi and run it.' },
          { n: '3', title: 'Say "Jarvis"', body: 'Your Pi listens for the wake word and talks back.' },
        ].map(({ n, title, body }) => (
          <div key={n} className="rounded-lg border bg-card p-4 flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {n}
            </span>
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add device form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Register a new Pi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Living Room Pi"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDevice()}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={addDevice}
              disabled={creating || !newName.trim()}
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {creating ? 'Adding…' : 'Add'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Newly created device — show key + setup instructions */}
      {newDevice && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              {newDevice.name} — setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1.5">Your device key — save it now, it won&apos;t be shown again</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded border bg-muted px-3 py-2 text-xs font-mono break-all select-all">
                  {newDevice.device_key}
                </code>
                <button
                  onClick={() => copyKey(newDevice.device_key)}
                  className="shrink-0 rounded-md border p-2 hover:bg-accent transition-colors"
                  title="Copy key"
                >
                  {copiedKey ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Setup steps */}
            <div className="space-y-3 text-sm">
              <p className="font-medium">Setup instructions</p>

              <div className="rounded-md border bg-muted p-3 space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">1 — Install dependencies on your Pi</p>
                <code className="text-xs font-mono">pip install requests SpeechRecognition pyaudio && sudo apt-get install -y mpg123</code>
              </div>

              <div className="rounded-md border bg-muted p-3 space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">2 — Install espeak (for voice output)</p>
                <code className="text-xs font-mono">sudo apt-get install espeak</code>
              </div>

              <div className="rounded-md border bg-muted p-3 space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">3 — Save and run the script</p>
                <code className="text-xs font-mono">python3 jarvis_pi.py</code>
              </div>
            </div>

            {/* Script */}
            <div>
              <button
                onClick={() => setShowScript((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Terminal className="h-4 w-4" />
                {showScript ? 'Hide' : 'Show'} jarvis_pi.py
                {showScript ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showScript && (
                <div className="mt-2 relative">
                  <pre className="rounded-md border bg-zinc-950 text-zinc-100 p-4 text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto leading-relaxed">
                    {getPiScript(newDevice, baseUrl)}
                  </pre>
                  <button
                    onClick={() => copyScript(newDevice)}
                    className="absolute top-2 right-2 rounded border border-zinc-700 bg-zinc-800 p-1.5 hover:bg-zinc-700 transition-colors"
                    title="Copy script"
                  >
                    {copiedScript
                      ? <Check className="h-3.5 w-3.5 text-green-400" />
                      : <Copy className="h-3.5 w-3.5 text-zinc-300" />}
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device list */}
      <div>
        <h2 className="text-base font-semibold mb-3">Connected devices</h2>

        {devices.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
            No devices registered yet. Add one above to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => {
              const online = isOnline(device.last_seen_at)
              return (
                <div
                  key={device.id}
                  className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${online ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                    <Cpu className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{device.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {online ? (
                          <><Wifi className="h-3 w-3 text-green-500" /> Online</>
                        ) : (
                          <><WifiOff className="h-3 w-3" /> {device.last_seen_at ? `Last seen ${new Date(device.last_seen_at).toLocaleDateString()}` : 'Never connected'}</>
                        )}
                        {device.ip_address && <span className="ml-2 opacity-60">{device.ip_address}</span>}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeDevice(device.id)}
                    disabled={deletingId === device.id}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                    title="Remove device"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground space-y-1">
        <p><strong>Voice:</strong> Say <em>"Jarvis, what&apos;s on my calendar today?"</em> and your Pi will respond out loud.</p>
        <p><strong>Proactive:</strong> Reminders and scheduled tasks can also be delivered to your Pi via text-to-speech.</p>
        <p><strong>Privacy:</strong> Your device key is stored only on your Pi. Rotate it by deleting and re-adding the device.</p>
      </div>
    </div>
  )
}
