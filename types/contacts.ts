export type RelationshipType = 'colleague' | 'client' | 'friend' | 'investor' | 'mentor' | 'vendor' | 'other'

export interface Contact {
  id: string
  user_id: string
  first_name: string
  last_name?: string
  email?: string
  phone?: string
  company?: string
  title?: string
  notes?: string
  tags: string[]
  relationship_type?: RelationshipType
  connected_through?: string | null   // contact id
  relationship_notes?: string
  created_at: string
  updated_at: string
}

export interface CreateContactInput {
  first_name: string
  last_name?: string
  email?: string
  phone?: string
  company?: string
  title?: string
  notes?: string
  tags?: string[]
  relationship_type?: RelationshipType
  connected_through?: string | null
  relationship_notes?: string
}
