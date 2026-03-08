'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CsvImportButton } from './csv-import-button'
import { toast } from 'sonner'
import type { Contact } from '@/types/contacts'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ContactsTable() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newContact, setNewContact] = useState({ first_name: '', last_name: '', email: '', phone: '', company: '', title: '' })

  const url = search ? `/api/contacts?q=${encodeURIComponent(search)}` : '/api/contacts'
  const { data, isLoading, mutate } = useSWR(url, fetcher)
  const contacts: Contact[] = data?.contacts ?? []

  async function handleDelete(id: string) {
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    toast.success('Contact deleted')
    mutate()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newContact.first_name) return
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContact),
    })
    if (res.ok) {
      toast.success('Contact added')
      setNewContact({ first_name: '', last_name: '', email: '', phone: '', company: '', title: '' })
      setShowForm(false)
      mutate()
    }
  }

  const handleImported = useCallback(() => mutate(), [mutate])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <CsvImportButton onImported={handleImported} />
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" />
          Add contact
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Input placeholder="First name *" value={newContact.first_name} onChange={(e) => setNewContact((p) => ({ ...p, first_name: e.target.value }))} required />
            <Input placeholder="Last name" value={newContact.last_name} onChange={(e) => setNewContact((p) => ({ ...p, last_name: e.target.value }))} />
            <Input placeholder="Email" type="email" value={newContact.email} onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))} />
            <Input placeholder="Phone" value={newContact.phone} onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))} />
            <Input placeholder="Company" value={newContact.company} onChange={(e) => setNewContact((p) => ({ ...p, company: e.target.value }))} />
            <Input placeholder="Title" value={newContact.title} onChange={(e) => setNewContact((p) => ({ ...p, title: e.target.value }))} />
            <div className="col-span-full flex gap-2">
              <Button type="submit" size="sm">Save</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : contacts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {search ? 'No contacts found' : 'No contacts yet. Add one or import a CSV.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="hidden px-4 py-2 text-left font-medium md:table-cell">Email</th>
                <th className="hidden px-4 py-2 text-left font-medium md:table-cell">Phone</th>
                <th className="hidden px-4 py-2 text-left font-medium lg:table-cell">Company</th>
                <th className="w-10 px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                    {contact.title && <p className="text-xs text-muted-foreground">{contact.title}</p>}
                  </td>
                  <td className="hidden px-4 py-2 text-muted-foreground md:table-cell">{contact.email}</td>
                  <td className="hidden px-4 py-2 text-muted-foreground md:table-cell">{contact.phone}</td>
                  <td className="hidden px-4 py-2 lg:table-cell">
                    {contact.company && <Badge variant="secondary" className="text-xs">{contact.company}</Badge>}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
