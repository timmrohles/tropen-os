-- 20260319000058_cards_meta_backfill.sql
-- Ensure meta column exists on cards table.
-- Idempotent: ADD COLUMN IF NOT EXISTS guard.
-- Needed because CREATE TABLE IF NOT EXISTS in 031_workspaces_schema.sql
-- was a no-op if the table already existed without this column.

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}';
