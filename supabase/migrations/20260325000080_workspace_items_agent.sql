-- Migration 080: Update workspace_items.item_type constraint
-- Add 'agent' type, replace 'note' (note type removed from UI)

ALTER TABLE workspace_items
  DROP CONSTRAINT IF EXISTS workspace_items_item_type_check;

ALTER TABLE workspace_items
  ADD CONSTRAINT workspace_items_item_type_check
  CHECK (item_type IN ('conversation', 'artifact', 'project', 'feed_source', 'agent', 'note'));
-- Keep 'note' in constraint for backwards-compatibility with any existing rows
