import { ChatInterface } from '@/components/chat/chat-interface'

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-sm text-muted-foreground">Ask Jarvis about your calendar, emails, tasks, and more</p>
      </div>
      <ChatInterface />
    </div>
  )
}
