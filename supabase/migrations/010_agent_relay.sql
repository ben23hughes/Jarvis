-- Agent sessions: tracks connected local agents per user
CREATE TABLE IF NOT EXISTS agent_sessions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key  TEXT NOT NULL,
  cwd      TEXT,
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent tasks: relay queue between Jarvis chat and the local agent
CREATE TABLE IF NOT EXISTS agent_tasks (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool      TEXT NOT NULL,
  input     JSONB NOT NULL DEFAULT '{}',
  status    TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed')),
  result    JSONB,
  error     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_tasks_user_status ON agent_tasks (user_id, status, created_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_agent_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_tasks_updated_at
  BEFORE UPDATE ON agent_tasks
  FOR EACH ROW EXECUTE FUNCTION update_agent_tasks_updated_at();

-- RLS: users can only see their own rows
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own agent session" ON agent_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own agent tasks" ON agent_tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
