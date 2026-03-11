-- Impersonation Sessions
CREATE TABLE impersonation_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  superadmin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_email  TEXT NOT NULL,
  target_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ticket_ref    TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User can see their own sessions
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User sees own impersonation sessions"
  ON impersonation_sessions FOR SELECT
  USING (target_user_id = auth.uid());

-- Support access toggle in user_preferences
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS support_access_enabled BOOLEAN NOT NULL DEFAULT TRUE;
