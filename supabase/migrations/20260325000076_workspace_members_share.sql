-- Migration 076: workspace_members + share link columns

-- 1. Share-link columns on workspaces
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS share_token  VARCHAR(64),
  ADD COLUMN IF NOT EXISTS share_role   VARCHAR(20) NOT NULL DEFAULT 'viewer',
  ADD COLUMN IF NOT EXISTS share_active BOOLEAN     NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_share_token
  ON workspaces(share_token) WHERE share_token IS NOT NULL;

-- 2. workspace_members (NEW — separate from workspace_participants which serves the old canvas)
CREATE TABLE IF NOT EXISTS workspace_members (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID         NOT NULL,
  user_id         UUID         REFERENCES auth.users(id),
  email           VARCHAR(255),
  role            VARCHAR(20)  NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'member', 'viewer')),
  status          VARCHAR(20)  NOT NULL DEFAULT 'active'  CHECK (status IN ('active', 'pending', 'declined')),
  invited_by      UUID         REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  joined_at       TIMESTAMPTZ,
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "workspace_members_admin_write" ON workspace_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id      ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_org_id       ON workspace_members(organization_id);
