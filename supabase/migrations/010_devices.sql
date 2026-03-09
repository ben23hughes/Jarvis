-- Registered Jarvis Pi devices
CREATE TABLE IF NOT EXISTS devices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'My Pi',
  device_key    TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  last_seen_at  TIMESTAMPTZ,
  ip_address    TEXT,
  version       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages queued for delivery to a device (reminders, proactive pushes, etc.)
CREATE TABLE IF NOT EXISTS device_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id     UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  source        TEXT NOT NULL DEFAULT 'system', -- 'system' | 'reminder' | 'schedule' | 'user'
  delivered     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "devices_select_own" ON devices;
CREATE POLICY "devices_select_own" ON devices FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "devices_insert_own" ON devices;
CREATE POLICY "devices_insert_own" ON devices FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "devices_update_own" ON devices;
CREATE POLICY "devices_update_own" ON devices FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "devices_delete_own" ON devices;
CREATE POLICY "devices_delete_own" ON devices FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "device_messages_select_own" ON device_messages;
CREATE POLICY "device_messages_select_own" ON device_messages FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "device_messages_insert_own" ON device_messages;
CREATE POLICY "device_messages_insert_own" ON device_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
