-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- OAuth tokens
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "oauth_tokens_select_own" ON oauth_tokens;
CREATE POLICY "oauth_tokens_select_own" ON oauth_tokens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "oauth_tokens_insert_own" ON oauth_tokens;
CREATE POLICY "oauth_tokens_insert_own" ON oauth_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "oauth_tokens_update_own" ON oauth_tokens;
CREATE POLICY "oauth_tokens_update_own" ON oauth_tokens
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "oauth_tokens_delete_own" ON oauth_tokens;
CREATE POLICY "oauth_tokens_delete_own" ON oauth_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Chat messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_own" ON chat_messages;
CREATE POLICY "chat_messages_select_own" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_messages_insert_own" ON chat_messages;
CREATE POLICY "chat_messages_insert_own" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
