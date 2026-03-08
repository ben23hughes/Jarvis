import { ContactsTable } from '@/components/contacts/contacts-table'

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contacts</h1>
        <p className="text-muted-foreground">
          Jarvis uses your contacts to personalize responses and reach out on your behalf.
        </p>
      </div>
      <ContactsTable />
    </div>
  )
}
