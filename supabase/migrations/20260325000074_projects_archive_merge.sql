-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 074 — Projects: archived_at + merge support
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add archived_at to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 2. Allow content edits on project_memory (remove append-only restriction for content)
-- The deleted_at pattern already allows soft-delete; we now also allow content UPDATE
-- via a new policy. No schema change needed — we just document that UPDATE is allowed
-- for content+importance fields by owners via the API (supabaseAdmin bypasses RLS).

-- Update projects_with_stats view to include archived_at
CREATE OR REPLACE VIEW public.projects_with_stats AS
SELECT
  p.*,
  COUNT(DISTINCT c.id)::INT  AS chat_count,
  MAX(c.created_at)          AS last_chat_at
FROM public.projects p
LEFT JOIN public.conversations c
  ON c.project_id = p.id AND c.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id;
