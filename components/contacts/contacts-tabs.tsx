'use client'

import { useState } from 'react'
import { ContactsTable } from './contacts-table'
import { RelationshipGraph } from './relationship-graph'
import type { Contact } from '@/types/contacts'

interface Props {
  contacts: Contact[]
  firstName: string
}

export function ContactsTabs({ contacts, firstName }: Props) {
  const [tab, setTab] = useState<'list' | 'network'>('list')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
        {(['list', 'network'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'list' ? (
        <ContactsTable />
      ) : (
        contacts.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Add some contacts to see your network.
          </p>
        ) : (
          <RelationshipGraph contacts={contacts} userName={firstName} />
        )
      )}
    </div>
  )
}
