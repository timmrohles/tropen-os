-- 032_support_tables.sql
-- Support-Tabellen: Settings, Wissen, Agenten-Zuweisungen, Transformationen, Templates
-- organization_settings existiert bereits (Migration 007) — nur dept_settings ist neu.

-- ── Department-Einstellungen ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dept_settings (
  department_id   UUID PRIMARY KEY REFERENCES public.departments(id) ON DELETE CASCADE,
  -- Kontroll-Modus überschreibt org-weite Einstellungen (kann einschränken, nie lockern)
  allowed_models  TEXT[],        -- NULL = erbt von org
  budget_limit    NUMERIC(10,2), -- NULL = erbt von org
  meta            JSONB NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Org-Wissen ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_knowledge (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  control_mode    TEXT NOT NULL DEFAULT 'suggested' CHECK (control_mode IN ('locked', 'suggested', 'open')),
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS org_knowledge_org_id_idx ON public.org_knowledge(organization_id);

-- ── Department-Wissen ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dept_knowledge (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  control_mode  TEXT NOT NULL DEFAULT 'suggested' CHECK (control_mode IN ('locked', 'suggested', 'open')),
  created_by    UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dept_knowledge_dept_id_idx ON public.dept_knowledge(department_id);

-- ── Agenten-Zuweisungen ──────────────────────────────────────────────────────
-- agents-Tabelle existiert bereits (Migration 025)
CREATE TABLE IF NOT EXISTS public.agent_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  card_id      UUID REFERENCES public.cards(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT agent_assignments_target_check CHECK (
    project_id IS NOT NULL OR workspace_id IS NOT NULL OR card_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS agent_assignments_agent_id_idx ON public.agent_assignments(agent_id);
CREATE INDEX IF NOT EXISTS agent_assignments_project_id_idx ON public.agent_assignments(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS agent_assignments_workspace_id_idx ON public.agent_assignments(workspace_id) WHERE workspace_id IS NOT NULL;

-- ── Transformationen ─────────────────────────────────────────────────────────
-- Alle Schreibzugriffe via supabaseAdmin (Server-Action). Client liest nur.
-- source_id / target_id sind polymorphisch (project.id oder workspace.id) — kein DB-FK intentional.
CREATE TABLE IF NOT EXISTS public.transformations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type  TEXT NOT NULL CHECK (source_type IN ('project', 'workspace')),
  source_id    UUID NOT NULL,
  target_type  TEXT NOT NULL CHECK (target_type IN ('workspace', 'agent', 'feed')),
  target_id    UUID,  -- NULL bis abgeschlossen
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'failed')),
  meta         JSONB NOT NULL DEFAULT '{}',
  created_by   UUID NOT NULL REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS transformations_source_idx ON public.transformations(source_type, source_id);

-- ── Transformations-Links ────────────────────────────────────────────────────
-- Aktive Verbindungen nach Transformation. Schreiben nur via supabaseAdmin.
CREATE TABLE IF NOT EXISTS public.transformation_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('project', 'workspace')),
  source_id   UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('workspace', 'agent', 'feed')),
  target_id   UUID NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transformation_links_source_idx ON public.transformation_links(source_type, source_id);

-- ── Templates ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id), -- NULL = global
  type            TEXT NOT NULL CHECK (type IN ('project', 'workspace', 'agent')),
  name            TEXT NOT NULL,
  description     TEXT,
  fields          JSONB NOT NULL DEFAULT '[]',  -- [{key, label, type, required}]
  defaults        JSONB NOT NULL DEFAULT '{}',
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS templates_org_id_idx ON public.templates(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS templates_type_idx ON public.templates(type);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.dept_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dept_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transformation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- dept_settings: lesbar für dept_members, schreibbar für dept_admins
CREATE POLICY "dept_settings_select" ON public.dept_settings
  FOR SELECT USING (
    department_id IN (
      SELECT workspace_id FROM public.department_members WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "dept_settings_write" ON public.dept_settings
  FOR ALL USING (
    department_id IN (
      SELECT workspace_id FROM public.department_members
      WHERE user_id = auth.uid() AND role::TEXT = 'admin'
    )
  );

-- org_knowledge: lesbar für alle Org-Mitglieder, schreibbar für Admins
CREATE POLICY "org_knowledge_select" ON public.org_knowledge
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "org_knowledge_write" ON public.org_knowledge
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin')
    )
  );
CREATE POLICY "org_knowledge_update" ON public.org_knowledge
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin')
    )
  );

-- dept_knowledge: lesbar für dept_members, schreibbar für dept_admins
CREATE POLICY "dept_knowledge_select" ON public.dept_knowledge
  FOR SELECT USING (
    department_id IN (
      SELECT workspace_id FROM public.department_members WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "dept_knowledge_write" ON public.dept_knowledge
  FOR INSERT WITH CHECK (
    department_id IN (
      SELECT workspace_id FROM public.department_members
      WHERE user_id = auth.uid() AND role::TEXT = 'admin'
    )
  );
CREATE POLICY "dept_knowledge_update" ON public.dept_knowledge
  FOR UPDATE USING (
    department_id IN (
      SELECT workspace_id FROM public.department_members
      WHERE user_id = auth.uid() AND role::TEXT = 'admin'
    )
  );

-- agent_assignments: lesbar für dept_members
CREATE POLICY "agent_assignments_select" ON public.agent_assignments
  FOR SELECT USING (
    agent_id IN (
      SELECT a.id FROM public.agents a
      JOIN public.users u ON u.organization_id = a.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- transformations: lesbar für creator, Schreiben via supabaseAdmin
CREATE POLICY "transformations_select" ON public.transformations
  FOR SELECT USING (created_by = auth.uid());
-- Kein INSERT/UPDATE Policy — nur via supabaseAdmin (Server-Action)

-- transformation_links: nur lesbar für Org-Mitglieder, Schreiben via supabaseAdmin
CREATE POLICY "transformation_links_select" ON public.transformation_links
  FOR SELECT USING (TRUE);  -- org-übergreifend lesbar, Isolation via source_id
-- Kein INSERT/UPDATE Policy — nur via supabaseAdmin

-- templates: eigene Org + globale lesbar; schreibbar für Admins
CREATE POLICY "templates_select" ON public.templates
  FOR SELECT USING (
    is_public = TRUE
    OR organization_id IS NULL
    OR organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );
CREATE POLICY "templates_insert" ON public.templates
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
