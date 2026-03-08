import { createClient } from '@supabase/supabase-js'
import type { Contact, CreateContactInput } from '@/types/contacts'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function listContacts(userId: string, query?: string, limit = 50): Promise<Contact[]> {
  const supabase = getServiceClient()
  let q = supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('first_name', { ascending: true })
    .limit(limit)

  if (query) {
    q = q.or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`
    )
  }

  const { data, error } = await q
  if (error) throw new Error(`Failed to list contacts: ${error.message}`)
  return (data ?? []) as Contact[]
}

export async function getContact(userId: string, contactId: string): Promise<Contact | null> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data as Contact
}

export async function createContact(userId: string, input: CreateContactInput): Promise<Contact> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('contacts')
    .insert({ ...input, user_id: userId, tags: input.tags ?? [] })
    .select()
    .single()

  if (error || !data) throw new Error(`Failed to create contact: ${error?.message}`)
  return data as Contact
}

export async function updateContact(
  userId: string,
  contactId: string,
  updates: Partial<CreateContactInput>
): Promise<Contact> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', contactId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error || !data) throw new Error(`Failed to update contact: ${error?.message}`)
  return data as Contact
}

export async function deleteContact(userId: string, contactId: string): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to delete contact: ${error.message}`)
}

export async function importContactsFromCsv(
  userId: string,
  rows: Record<string, string>[]
): Promise<{ imported: number; skipped: number }> {
  const supabase = getServiceClient()
  let imported = 0
  let skipped = 0

  const contacts = rows
    .map((row) => {
      const firstName =
        row['first_name'] || row['First Name'] || row['firstname'] || row['name'] || ''
      if (!firstName) { skipped++; return null }
      return {
        user_id: userId,
        first_name: firstName.trim(),
        last_name: (row['last_name'] || row['Last Name'] || row['lastname'] || '').trim() || null,
        email: (row['email'] || row['Email'] || '').trim() || null,
        phone: (row['phone'] || row['Phone'] || row['mobile'] || row['Mobile'] || '').trim() || null,
        company: (row['company'] || row['Company'] || row['organization'] || '').trim() || null,
        title: (row['title'] || row['Title'] || row['job_title'] || '').trim() || null,
        notes: (row['notes'] || row['Notes'] || '').trim() || null,
        tags: [],
      }
    })
    .filter(Boolean)

  // Batch insert in chunks of 100
  for (let i = 0; i < contacts.length; i += 100) {
    const chunk = contacts.slice(i, i + 100)
    const { data, error } = await supabase.from('contacts').insert(chunk).select('id')
    if (error) { skipped += chunk.length } else { imported += (data?.length ?? 0) }
  }

  return { imported, skipped }
}
