import { ContactsTabs } from '@/components/contacts/contacts-tabs'
import { createClient } from '@/lib/supabase/server'
import { listContacts } from '@/lib/contacts'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [contacts, profileResult] = await Promise.all([
    listContacts(user!.id),
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
  ])

  const firstName = profileResult.data?.full_name?.split(' ')[0] ?? 'You'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contacts</h1>
        <p className="text-muted-foreground">
          Jarvis uses your contacts to personalize responses and reach out on your behalf.
        </p>
      </div>
      <ContactsTabs contacts={contacts} firstName={firstName} />
    </div>
  )
}
