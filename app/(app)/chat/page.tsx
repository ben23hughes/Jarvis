import { createClient } from '@/lib/supabase/server'
import { ChatInterface } from '@/components/chat/chat-interface'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? 'there'

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-sm text-muted-foreground">Ask Jarvis about your calendar, emails, tasks, and more</p>
      </div>
      <ChatInterface userName={firstName} />
    </div>
  )
}
