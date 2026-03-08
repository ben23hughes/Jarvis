-- =============================================
-- User Schedules
-- =============================================
CREATE TABLE IF NOT EXISTS user_schedules (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  prompt       TEXT NOT NULL,
  frequency    TEXT NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekdays', 'weekly')),
  hour         INTEGER NOT NULL DEFAULT 9 CHECK (hour >= 0 AND hour <= 23),
  minute       INTEGER NOT NULL DEFAULT 0 CHECK (minute >= 0 AND minute <= 59),
  day_of_week  INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sun, used for weekly
  channel      TEXT NOT NULL DEFAULT 'sms' CHECK (channel IN ('sms', 'email')),
  enabled      BOOLEAN NOT NULL DEFAULT true,
  last_run_at  TIMESTAMPTZ,
  next_run_at  TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_schedules_due
  ON user_schedules(next_run_at) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_user_schedules_user
  ON user_schedules(user_id, created_at DESC);

DROP TRIGGER IF EXISTS user_schedules_updated_at ON user_schedules;
CREATE TRIGGER user_schedules_updated_at
  BEFORE UPDATE ON user_schedules
  FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();

ALTER TABLE user_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schedules_select_own" ON user_schedules;
CREATE POLICY "schedules_select_own" ON user_schedules FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "schedules_insert_own" ON user_schedules;
CREATE POLICY "schedules_insert_own" ON user_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "schedules_update_own" ON user_schedules;
CREATE POLICY "schedules_update_own" ON user_schedules FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "schedules_delete_own" ON user_schedules;
CREATE POLICY "schedules_delete_own" ON user_schedules FOR DELETE USING (auth.uid() = user_id);
