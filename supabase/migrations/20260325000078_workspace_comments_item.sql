-- Add item_id to workspace_comments for per-item comment threads (Variante B)
-- NULL = workspace-level comment, NOT NULL = comment on a specific workspace item

ALTER TABLE workspace_comments
  ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES workspace_items(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ws_comments_item ON workspace_comments(item_id)
  WHERE item_id IS NOT NULL;
