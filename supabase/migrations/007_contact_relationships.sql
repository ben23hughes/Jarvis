-- Add relationship fields to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS relationship_type TEXT
  CHECK (relationship_type IN ('colleague','client','friend','investor','mentor','vendor','other'));

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS connected_through UUID
  REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS relationship_notes TEXT;
