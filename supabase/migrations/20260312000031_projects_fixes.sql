-- 030b_projects_fixes.sql
-- Fixes for 030_projects_schema.sql:
-- 1. projects_update: restrict to project participants or dept admins
-- 2. projects_insert: block viewer-role members
-- 3. project_knowledge_update: restrict to admin/member (not viewer)
-- 4. Add missing index on project_participants(user_id)
-- 5. Add missing partial index on conversations(project_id)
-- 6. Remove redundant project_memory_project_id_idx

-- ── Fix policies ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    id IN (SELECT project_id FROM public.project_participants WHERE user_id = auth.uid())
    OR department_id IN (
      SELECT workspace_id FROM public.department_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (
    department_id IN (
      SELECT workspace_id FROM public.department_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
  );

DROP POLICY IF EXISTS "project_knowledge_update" ON public.project_knowledge;
CREATE POLICY "project_knowledge_update" ON public.project_knowledge
  FOR UPDATE USING (
    project_id IN (
      SELECT project_id FROM public.project_participants
      WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
  );

-- ── Add missing indexes ───────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS project_participants_user_id_idx ON public.project_participants(user_id);

CREATE INDEX IF NOT EXISTS conversations_project_id_idx ON public.conversations(project_id) WHERE project_id IS NOT NULL;

-- ── Remove redundant index ────────────────────────────────────────────────────
-- project_memory_project_id_idx is redundant: the composite index
-- project_memory_type_idx ON (project_id, type) already covers project_id-only queries.

DROP INDEX IF EXISTS public.project_memory_project_id_idx;
