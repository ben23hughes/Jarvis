import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  MessageSquare,
  Calendar,
  Target,
  Zap,
  Brain,
  Terminal,
  Mail,
  BarChart2,
  Users,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Github,
  FileText,
  HardDrive,
  Video,
  Twitter,
  Facebook,
  Instagram,
  Music,
  DollarSign,
  TrendingUp,
  Lightbulb,
  Apple,
  Heart,
  Cloud,
  Newspaper,
  MapPin,
  Banknote,
} from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight">Jarvis</span>
          <div className="flex items-center gap-6">
            <Link
              href="/jarvis-4"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Cpu className="h-3.5 w-3.5" />
              Jarvis 4
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground mb-8">
          <Brain className="h-3 w-3" />
          Powered by Claude AI
        </div>
        <h1 className="text-5xl font-bold tracking-tight leading-tight">
          Your personal AI
          <br />
          <span className="text-muted-foreground">for work and life</span>
        </h1>
        <p className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground leading-relaxed">
          Jarvis connects to your calendar, email, Slack, and more — then uses AI to help you stay organized,
          hit your goals, and get things done without switching between a dozen apps.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-md border px-6 py-3 text-sm font-semibold hover:bg-accent transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-2xl font-bold mb-12">Everything in one place</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: MessageSquare,
                title: 'AI Chat',
                description:
                  'Ask Jarvis anything in plain English. It knows your schedule, emails, tasks, and goals — and acts on your behalf.',
              },
              {
                icon: Target,
                title: 'Goals & Progress',
                description:
                  'Track spiritual, physical, financial, career, and relationship goals. Jarvis factors them into every conversation.',
              },
              {
                icon: Terminal,
                title: 'Local Agent',
                description:
                  'Connect Jarvis to your machine so it can read files, run commands, and write code directly in your projects.',
              },
              {
                icon: Calendar,
                title: 'Smart Scheduling',
                description:
                  'View your upcoming events, create meetings, and get AI-generated daily briefings every morning.',
              },
              {
                icon: Brain,
                title: 'Persistent Memory',
                description:
                  'Jarvis remembers your preferences, important people, and key facts — so you never have to repeat yourself.',
              },
              {
                icon: Zap,
                title: 'Automated Schedules',
                description:
                  'Set recurring tasks like daily standups or weekly summaries. Jarvis runs them and delivers results by SMS or email.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold mb-3">Connects to your tools</h2>
        <p className="text-center text-muted-foreground mb-12 text-sm">
          Jarvis integrates with the apps you already use.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { icon: Calendar, name: 'Google Calendar' },
            { icon: Mail, name: 'Gmail' },
            { icon: HardDrive, name: 'Google Drive' },
            { icon: MessageSquare, name: 'Slack' },
            { icon: CheckCircle2, name: 'Linear' },
            { icon: Users, name: 'Contacts' },
            { icon: Github, name: 'GitHub' },
            { icon: FileText, name: 'Notion' },
            { icon: Video, name: 'Zoom' },
            { icon: MessageSquare, name: 'Teams' },
            { icon: Twitter, name: 'X (Twitter)' },
            { icon: Facebook, name: 'Facebook' },
            { icon: Instagram, name: 'Instagram' },
            { icon: Music, name: 'Spotify' },
            { icon: DollarSign, name: 'YNAB' },
            { icon: CheckCircle2, name: 'Todoist' },
            { icon: TrendingUp, name: 'Reddit' },
            { icon: Banknote, name: 'Plaid Banking' },
            { icon: TrendingUp, name: 'Alpaca Markets' },
            { icon: Brain, name: 'Coinbase' },
            { icon: Lightbulb, name: 'Govee Lights' },
            { icon: Apple, name: 'Apple Calendar' },
            { icon: Heart, name: 'Apple Health' },
            { icon: Cloud, name: 'Weather' },
            { icon: MapPin, name: 'Yelp' },
            { icon: Newspaper, name: 'News' },
          ].map(({ icon: Icon, name }) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground"
            >
              <Icon className="h-3.5 w-3.5" />
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to meet your AI assistant?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Set up takes minutes. Connect your accounts and start asking Jarvis to handle the things that slow you down.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Jarvis</span>
          <div className="flex gap-4">
            <Link href="/jarvis-4" className="hover:text-foreground transition-colors">Jarvis 4</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
