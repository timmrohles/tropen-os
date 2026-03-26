-- Migration 077: workspace_comments + comment_count

-- 1. comment_count on workspaces
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS comment_count INT NOT NULL DEFAULT 0;

-- 2. workspace_comments
CREATE TABLE IF NOT EXISTS workspace_comments (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID,
  item_id         UUID         REFERENCES workspace_items(id) ON DELETE SET NULL,
  user_id         UUID         REFERENCES auth.users(id),
  guest_name      VARCHAR(100),
  content         TEXT         NOT NULL,
  parent_id       UUID         REFERENCES workspace_comments(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

ALTER TABLE workspace_comments ENABLE ROW LEVEL SECURITY;

-- Members of the org can see + write comments; external users can if share is active
CREATE POLICY "workspace_comments_select" ON workspace_comments
  FOR SELECT USING (
    deleted_at IS NULL AND (
      organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
      OR workspace_id IN (SELECT id FROM workspaces WHERE share_active = true)
    )
  );

CREATE POLICY "workspace_comments_insert" ON workspace_comments
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    OR workspace_id IN (SELECT id FROM workspaces WHERE share_active = true)
  );

CREATE POLICY "workspace_comments_delete_own" ON workspace_comments
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "workspace_comments_softdelete" ON workspace_comments
  FOR UPDATE USING (user_id = auth.uid());

-- 3. Keep comment_count in sync
CREATE OR REPLACE FUNCTION fn_workspace_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    UPDATE workspaces SET comment_count = comment_count + 1 WHERE id = NEW.workspace_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE workspaces SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = NEW.workspace_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspace_comment_count ON workspace_comments;
CREATE TRIGGER trg_workspace_comment_count
  AFTER INSERT OR UPDATE ON workspace_comments
  FOR EACH ROW EXECUTE FUNCTION fn_workspace_comment_count();

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_comments_workspace_id ON workspace_comments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_comments_item_id      ON workspace_comments(item_id);
CREATE INDEX IF NOT EXISTS idx_workspace_comments_parent_id    ON workspace_comments(parent_id);
