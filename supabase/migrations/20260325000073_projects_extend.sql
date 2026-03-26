-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 073 — Projects: emoji, context, documents, memory soft-delete
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add emoji + context to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS emoji   TEXT DEFAULT '📁',
  ADD COLUMN IF NOT EXISTS context TEXT;

-- 2. Migrate existing goal + instructions → context
UPDATE public.projects
SET context = TRIM(
  CONCAT_WS(E'\n\n',
    NULLIF(TRIM(COALESCE(goal, '')), ''),
    NULLIF(TRIM(COALESCE(instructions, '')), '')
  )
)
WHERE (goal IS NOT NULL OR instructions IS NOT NULL)
  AND context IS NULL;

-- 3. Add deleted_at to project_memory for soft-delete
ALTER TABLE public.project_memory
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update existing select policy to filter deleted entries
DROP POLICY IF EXISTS "project_memory_select" ON public.project_memory;
CREATE POLICY "project_memory_select" ON public.project_memory
  FOR SELECT USING (
    deleted_at IS NULL AND
    project_id IN (
      SELECT pp.project_id FROM public.project_participants pp
      WHERE pp.user_id = auth.uid()
    )
  );

-- 4. Create project_documents table
CREATE TABLE IF NOT EXISTS public.project_documents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID        NOT NULL,
  filename        TEXT        NOT NULL,
  storage_path    TEXT        NOT NULL,
  file_size       BIGINT,
  mime_type       TEXT,
  created_by      UUID        NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS project_documents_project_idx ON public.project_documents(project_id) WHERE deleted_at IS NULL;

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_documents_select" ON public.project_documents
  FOR SELECT USING (
    deleted_at IS NULL AND
    project_id IN (
      SELECT pp.project_id FROM public.project_participants pp
      WHERE pp.user_id = auth.uid()
    )
  );

CREATE POLICY "project_documents_insert" ON public.project_documents
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT pp.project_id FROM public.project_participants pp
      WHERE pp.user_id = auth.uid()
    )
  );

-- 5. Storage bucket for project documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-docs',
  'project-docs',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "project_docs_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-docs' AND auth.role() = 'authenticated'
  );

CREATE POLICY "project_docs_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-docs' AND auth.role() = 'authenticated'
  );

CREATE POLICY "project_docs_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-docs' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. View: projects with chat count + last chat
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
