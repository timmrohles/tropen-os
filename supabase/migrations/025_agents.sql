-- Agenten-System Phase 1
CREATE TABLE IF NOT EXISTS agents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  system_prompt   TEXT,
  visibility      TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'org')),
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_select" ON agents
  FOR SELECT USING (
    user_id = auth.uid()
    OR (visibility = 'org' AND organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "agents_insert" ON agents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "agents_update" ON agents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "agents_delete" ON agents
  FOR DELETE USING (user_id = auth.uid());
