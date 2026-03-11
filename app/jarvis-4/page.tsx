import Link from 'next/link'
import { ArrowRight, Cpu, Mic, Wifi, Volume2, Brain, ArrowLeft } from 'lucide-react'

export default function Jarvis4Page() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <header className="border-b border-zinc-800 sticky top-0 z-50 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Jarvis
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Cpu className="h-3.5 w-3.5" />
              Jarvis 4
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 mb-8">
          <Cpu className="h-3 w-3" />
          Hardware · Raspberry Pi
        </div>
        <h1 className="text-6xl font-bold tracking-tight leading-tight">
          Jarvis 4
        </h1>
        <p className="mt-4 text-2xl text-zinc-400 font-light">
          Your AI assistant. In your home.
        </p>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-zinc-400 leading-relaxed">
          A Raspberry Pi-powered voice assistant that lives in any room. Always listening, always ready —
          no phone, no browser, no wake-app. Just say <em className="text-zinc-200 not-italic font-medium">"Jarvis"</em> and get
          answers backed by your full AI assistant and all your connected accounts.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Main video */}
      <div className="mx-auto max-w-4xl px-6 pb-20">
        <div className="overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl shadow-black/50">
          <video
            src="/Jarvis4simplevideo.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full scale-110 origin-top-left"
          />
        </div>
      </div>

      {/* Feature pills */}
      <div className="border-t border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Mic,
                title: 'Wake word',
                description: 'Say "Jarvis" from across the room. No button, no app, no phone.',
              },
              {
                icon: Brain,
                title: 'Full AI power',
                description: 'Backed by Claude AI — the same intelligence behind your Jarvis account.',
              },
              {
                icon: Wifi,
                title: 'All your data',
                description: 'Checks your calendar, emails, Slack, and reminders in real time.',
              },
              {
                icon: Volume2,
                title: 'Speaks back',
                description: 'Responds out loud via text-to-speech. Completely hands-free.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold mb-4">Set up in minutes</h2>
          <p className="text-center text-zinc-400 mb-14 max-w-lg mx-auto">
            No soldering, no complicated config. If you can plug in a Raspberry Pi, you can run Jarvis 4.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                n: '1',
                title: 'Create an account',
                body: 'Sign up for Jarvis and connect your calendar, email, and other accounts.',
              },
              {
                n: '2',
                title: 'Register your Pi',
                body: 'Go to the Jarvis 4 page, add a device, and copy the auto-generated Python script onto your Pi.',
              },
              {
                n: '3',
                title: 'Say "Jarvis"',
                body: 'Run the script and start talking. Your Pi listens 24/7 and responds out loud with real answers.',
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-zinc-900 text-sm font-bold">
                  {n}
                </span>
                <div>
                  <p className="font-semibold text-white mb-1">{title}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Example commands */}
      <div className="border-t border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold mb-4">Ask it anything</h2>
          <p className="text-center text-zinc-400 mb-14">Just like talking to a person who knows your whole life.</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              '"Jarvis, what\'s on my calendar today?"',
              '"Jarvis, do I have any unread emails from David?"',
              '"Jarvis, remind me to call mom at 5pm."',
              '"Jarvis, what\'s the weather this weekend?"',
              '"Jarvis, did anyone message me on Slack?"',
              '"Jarvis, add milk to my shopping list."',
            ].map((cmd) => (
              <div
                key={cmd}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-3.5 text-sm text-zinc-300 font-mono"
              >
                {cmd}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <h2 className="text-4xl font-bold mb-4">Get Jarvis in your home</h2>
          <p className="text-zinc-400 mb-10 max-w-md mx-auto text-lg">
            Create your Jarvis account and set up your Pi from the Jarvis 4 page. Takes under 10 minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-white px-8 py-4 text-base font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Get started free <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between text-xs text-zinc-500">
          <span>Jarvis</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-zinc-100 transition-colors">Home</Link>
            <Link href="/login" className="hover:text-zinc-100 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-zinc-100 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
