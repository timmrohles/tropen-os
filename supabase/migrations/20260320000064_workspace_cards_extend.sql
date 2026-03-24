-- Migration: Workspace Umbau — Rahmen-Visualisierung
-- Adds source tracking to cards and project linkage to workspaces.
-- NOTE: cards.status already exists with (draft, ready, stale, processing, error).
--       We use 'ready' as the "completed/done" proxy in progress calculations.

-- ─── workspaces: project linkage ─────────────────────────────────────────────
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workspaces_project_id ON workspaces(project_id)
  WHERE project_id IS NOT NULL;

-- ─── cards: artifact source tracking ─────────────────────────────────────────
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('manual', 'chat_artifact')) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cards_source_conversation
  ON cards(source_conversation_id)
  WHERE source_conversation_id IS NOT NULL;
