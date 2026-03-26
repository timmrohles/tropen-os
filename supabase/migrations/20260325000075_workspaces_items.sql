-- Migration 075: workspace_items + workspaces columns
-- Workspaces become an org-level sharing layer for resources.

-- 1. Make department_id nullable (workspaces are now org-scoped, not dept-scoped)
ALTER TABLE workspaces ALTER COLUMN department_id DROP NOT NULL;

-- 2. Add new columns to workspaces
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS emoji VARCHAR(10),
  ADD COLUMN IF NOT EXISTS item_count INT NOT NULL DEFAULT 0;

-- 3. workspace_items: central table for linked resources
CREATE TABLE IF NOT EXISTS workspace_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID        NOT NULL,
  item_type       VARCHAR(30) NOT NULL CHECK (item_type IN ('conversation', 'artifact', 'project', 'feed_source', 'note')),
  item_id         UUID,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  meta            JSONB        NOT NULL DEFAULT '{}',
  added_by        UUID         REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE workspace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_items_select" ON workspace_items
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "workspace_items_insert" ON workspace_items
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "workspace_items_delete" ON workspace_items
  FOR DELETE USING (
    added_by = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 4. Keep item_count in sync
CREATE OR REPLACE FUNCTION fn_workspace_item_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE workspaces SET item_count = item_count + 1 WHERE id = NEW.workspace_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE workspaces SET item_count = GREATEST(item_count - 1, 0) WHERE id = OLD.workspace_id;
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspace_item_count ON workspace_items;
CREATE TRIGGER trg_workspace_item_count
  AFTER INSERT OR DELETE ON workspace_items
  FOR EACH ROW EXECUTE FUNCTION fn_workspace_item_count();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_items_workspace_id  ON workspace_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_items_org_id         ON workspace_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspace_items_item_type      ON workspace_items(item_type);
