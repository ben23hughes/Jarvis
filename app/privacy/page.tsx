export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-10">Last updated: March 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Overview</h2>
        <p>Jarvis is a personal AI assistant application. This policy describes how we collect, use, and protect your information when you use the Jarvis platform, including any SMS notifications sent to your phone number.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Account information:</strong> Your name and email address when you create an account.</li>
          <li><strong>Phone number:</strong> If you choose to enable SMS notifications, we store your phone number to deliver reminders and updates you request.</li>
          <li><strong>Connected services:</strong> OAuth tokens for third-party services you connect (Google, Slack, Linear, etc.). These are encrypted at rest.</li>
          <li><strong>Chat history:</strong> Conversations with Jarvis to provide context for responses.</li>
          <li><strong>Memories:</strong> Facts and preferences you share that Jarvis saves to personalize future interactions.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">SMS Notifications</h2>
        <p className="mb-2">If you provide your phone number, Jarvis may send you SMS messages including:</p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Reminders you set via the assistant</li>
          <li>Scheduled briefings and updates you configure</li>
          <li>Alerts and notifications you request</li>
        </ul>
        <p>Message frequency varies based on your configured schedules and reminders. Message and data rates may apply. You can opt out at any time by removing your phone number from your account settings or replying STOP to any message.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>To provide and operate the Jarvis assistant service</li>
          <li>To send notifications, reminders, and updates you have requested</li>
          <li>To personalize responses based on your preferences and history</li>
          <li>To connect to third-party services on your behalf</li>
        </ul>
        <p className="mt-3">We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Data Storage & Security</h2>
        <p>Your data is stored securely using Supabase with row-level security policies ensuring you can only access your own data. OAuth tokens are encrypted at rest. We use industry-standard security practices to protect your information.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Third-Party Services</h2>
        <p>Jarvis integrates with third-party services at your direction (Google, Slack, Linear, etc.). Your use of those services is governed by their respective privacy policies. We only access data from those services that is necessary to fulfill your requests.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Your Rights</h2>
        <p>You may access, update, or delete your personal information at any time through your account settings. To request complete deletion of your account and data, contact us directly.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Contact</h2>
        <p>For questions about this privacy policy or your data, please contact us through the Jarvis application.</p>
      </section>
    </div>
  )
}
