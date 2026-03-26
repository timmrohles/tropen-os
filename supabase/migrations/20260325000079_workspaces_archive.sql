-- Add archived_at to workspaces for soft-archive (reversible, separate from hard-delete)
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_workspaces_archived ON workspaces(organization_id, archived_at)
  WHERE archived_at IS NOT NULL AND deleted_at IS NULL;
