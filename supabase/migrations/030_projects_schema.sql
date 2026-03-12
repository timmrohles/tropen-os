-- 030_projects_schema.sql
-- Projekte: smarte Projektordner mit Gedächtnis
-- Ersetzt alte placeholder-`projects`-Tabelle (falls vorhanden, live oft nicht existent).

-- Alte FK auf projects droppen, dann Tabelle
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_project_id_fkey;

DROP TABLE IF EXISTS public.projects CASCADE;

-- ── Projekte ────────────────────────────────────────────────────────────────
CREATE TABLE public.projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  goal          TEXT,
  instructions  TEXT,
  meta          JSONB NOT NULL DEFAULT '{}',
  created_by    UUID NOT NULL REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX projects_department_id_idx ON public.projects(department_id);
CREATE INDEX projects_created_by_idx ON public.projects(created_by);

-- ── Projekt-Teilnehmer ───────────────────────────────────────────────────────
CREATE TABLE public.project_participants (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- ── Projekt-Wissen ───────────────────────────────────────────────────────────
CREATE TABLE public.project_knowledge (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('file', 'note', 'link')),
  title      TEXT NOT NULL,
  content    TEXT,       -- für type='note' (editierbar)
  url        TEXT,       -- für type='link'
  file_path  TEXT,       -- für type='file' (Supabase Storage Path)
  file_size  INTEGER,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX project_knowledge_project_id_idx ON public.project_knowledge(project_id);

-- ── Projekt-Gedächtnis (APPEND ONLY) ────────────────────────────────────────
-- NIEMALS UPDATE oder DELETE — weder in Code noch in Policies!
-- Alle Schreibzugriffe via supabaseAdmin (bypasses RLS).
CREATE TABLE public.project_memory (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type                   TEXT NOT NULL CHECK (type IN ('insight', 'decision', 'open_question', 'summary', 'fact')),
  content                TEXT NOT NULL,
  source_conversation_id UUID REFERENCES public.conversations(id),
  importance             TEXT NOT NULL DEFAULT 'medium' CHECK (importance IN ('high', 'medium', 'low')),
  tags                   TEXT[] NOT NULL DEFAULT '{}',
  frozen                 BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- kein updated_at — APPEND ONLY
);

CREATE INDEX project_memory_project_id_idx ON public.project_memory(project_id);
CREATE INDEX project_memory_type_idx ON public.project_memory(project_id, type);

-- ── conversations: FK zu projects neu herstellen ─────────────────────────────
-- ADD COLUMN IF NOT EXISTS fügt Spalte hinzu wenn noch nicht vorhanden.
-- FK-Constraint wird explizit neu angelegt (nach CASCADE-Drop oben).
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS project_id UUID;

-- Null out any orphaned project_id values left from old placeholder projects table
UPDATE public.conversations SET project_id = NULL WHERE project_id IS NOT NULL;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_memory ENABLE ROW LEVEL SECURITY;

-- projects: sichtbar für department_members (Entdeckung im Department)
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    department_id IN (
      SELECT workspace_id FROM public.department_members WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (
    department_id IN (
      SELECT workspace_id FROM public.department_members WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    department_id IN (
      SELECT workspace_id FROM public.department_members WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (
    created_by = auth.uid()
    OR department_id IN (
      SELECT workspace_id FROM public.department_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- project_participants: verwaltbar für project-Admins
CREATE POLICY "project_participants_select" ON public.project_participants
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.department_id IN (
        SELECT workspace_id FROM public.department_members WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "project_participants_write" ON public.project_participants
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- project_knowledge: sichtbar + schreibbar für project_participants
CREATE POLICY "project_knowledge_select" ON public.project_knowledge
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM public.project_participants WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "project_knowledge_write" ON public.project_knowledge
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_participants WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "project_knowledge_update" ON public.project_knowledge
  FOR UPDATE USING (
    project_id IN (
      SELECT project_id FROM public.project_participants WHERE user_id = auth.uid()
    )
  );

-- project_memory: NUR SELECT + INSERT (APPEND ONLY — kein UPDATE/DELETE)
CREATE POLICY "project_memory_select" ON public.project_memory
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM public.project_participants WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "project_memory_insert" ON public.project_memory
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_participants WHERE user_id = auth.uid()
    )
  );
-- KEIN UPDATE-Policy. KEIN DELETE-Policy. supabaseAdmin bypasses RLS wenn nötig.
