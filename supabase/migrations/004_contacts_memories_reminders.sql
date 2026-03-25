-- =============================================
-- Extend integration_provider enum
-- =============================================
ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'github';
ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'notion';
ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'google_drive';

-- =============================================
-- Profiles: add phone_number
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- =============================================
-- Contacts
-- =============================================
CREATE TABLE IF NOT EXISTS contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name  TEXT NOT NULL,
  last_name   TEXT,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  title       TEXT,
  notes       TEXT,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

DROP TRIGGER IF EXISTS contacts_updated_at ON contacts;
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contacts_select_own" ON contacts;
CREATE POLICY "contacts_select_own" ON contacts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "contacts_insert_own" ON contacts;
CREATE POLICY "contacts_insert_own" ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "contacts_update_own" ON contacts;
CREATE POLICY "contacts_update_own" ON contacts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "contacts_delete_own" ON contacts;
CREATE POLICY "contacts_delete_own" ON contacts FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Memories
-- =============================================
CREATE TABLE IF NOT EXISTS memories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  category    TEXT DEFAULT 'general',
  source      TEXT DEFAULT 'user',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id, created_at DESC);

DROP TRIGGER IF EXISTS memories_updated_at ON memories;
CREATE TRIGGER memories_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "memories_select_own" ON memories;
CREATE POLICY "memories_select_own" ON memories FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "memories_insert_own" ON memories;
CREATE POLICY "memories_insert_own" ON memories FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "memories_update_own" ON memories;
CREATE POLICY "memories_update_own" ON memories FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "memories_delete_own" ON memories;
CREATE POLICY "memories_delete_own" ON memories FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Reminders
-- =============================================
CREATE TABLE IF NOT EXISTS reminders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  remind_at   TIMESTAMPTZ NOT NULL,
  channel     TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('sms', 'email')),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(remind_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id, created_at DESC);

DROP TRIGGER IF EXISTS reminders_updated_at ON reminders;
CREATE TRIGGER reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reminders_select_own" ON reminders;
CREATE POLICY "reminders_select_own" ON reminders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "reminders_insert_own" ON reminders;
CREATE POLICY "reminders_insert_own" ON reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "reminders_update_own" ON reminders;
CREATE POLICY "reminders_update_own" ON reminders FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "reminders_delete_own" ON reminders;
CREATE POLICY "reminders_delete_own" ON reminders FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Meeting prep deduplication
-- =============================================
CREATE TABLE IF NOT EXISTS meeting_prep_sent (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id    TEXT NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_id)
);
i 