export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-muted-foreground mb-10">Last updated: March 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Acceptance of Terms</h2>
        <p>By accessing or using Jarvis, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Description of Service</h2>
        <p>Jarvis is a personal AI assistant platform that connects to your third-party services and accounts to help you manage your calendar, communications, tasks, and daily life. The service includes a web application, AI chat interface, and optional SMS notification delivery.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">SMS Terms</h2>
        <p className="mb-2">By providing your phone number and enabling SMS notifications, you consent to receive text messages from Jarvis including:</p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Reminders and alerts you have scheduled or requested</li>
          <li>Daily briefings and updates you have configured</li>
          <li>Notifications triggered by your use of the assistant</li>
        </ul>
        <p className="mb-2">Message frequency depends on your settings and requests. Message and data rates may apply.</p>
        <p><strong>To opt out:</strong> Reply STOP to any message or remove your phone number from your account settings. For help, reply HELP or contact us through the app.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Your Account</h2>
        <p>You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating your account. You may not share your account with others or use the service for unauthorized purposes.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Third-Party Integrations</h2>
        <p>Jarvis connects to third-party services (Google, Slack, Linear, and others) on your behalf using OAuth authorization. By connecting these services, you authorize Jarvis to access and interact with them as directed by your requests. You are responsible for ensuring your use of connected services complies with their respective terms of service.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Acceptable Use</h2>
        <p className="mb-2">You agree not to use Jarvis to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Violate any applicable laws or regulations</li>
          <li>Send unsolicited communications to others</li>
          <li>Attempt to gain unauthorized access to any systems</li>
          <li>Interfere with the operation of the service</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Disclaimer of Warranties</h2>
        <p>Jarvis is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or that AI-generated responses will always be accurate. You should verify important information before acting on it.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, Jarvis shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Changes to Terms</h2>
        <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Contact</h2>
        <p>For questions about these terms, please contact us through the Jarvis application.</p>
      </section>
    </div>
  )
}
