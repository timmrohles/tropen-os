-- 031_workspaces_schema.sql
-- Workspaces: Karten-basierte Arbeitsbereiche (neues Feature)
-- "workspaces" ist jetzt frei (ex-workspaces → departments umbenannt).
-- workspace_messages, operators, operator_results folgen in Migration 035 (Plan C).
-- Idempotent: IF NOT EXISTS guards on all DDL.

-- ── Workspaces ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  goal          TEXT,
  meta          JSONB NOT NULL DEFAULT '{}',
  created_by    UUID NOT NULL REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS workspaces_department_id_idx ON public.workspaces(department_id);

-- ── Workspace-Teilnehmer ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_participants (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS workspace_participants_user_id_idx ON public.workspace_participants(user_id);

-- ── Karten ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('input', 'process', 'output')),
  title        TEXT NOT NULL,
  content      TEXT,
  position     JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  meta         JSONB NOT NULL DEFAULT '{}',
  created_by   UUID NOT NULL REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS cards_workspace_id_idx ON public.cards(workspace_id);

-- ── Karten-Historie (APPEND ONLY) ────────────────────────────────────────────
-- NIEMALS UPDATE oder DELETE — weder in Code noch in Policies!
CREATE TABLE IF NOT EXISTS public.card_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  field      TEXT NOT NULL,
  old_value  TEXT,
  new_value  TEXT,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- kein updated_at — APPEND ONLY
);

CREATE INDEX IF NOT EXISTS card_history_card_id_idx ON public.card_history(card_id);

-- ── Verbindungen (Graph-Kanten) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.connections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  from_card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  to_card_id   UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  label        TEXT,
  created_by   UUID NOT NULL REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_card_id, to_card_id)
);

CREATE INDEX IF NOT EXISTS connections_workspace_id_idx ON public.connections(workspace_id);

-- ── Wissens-Einträge ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  source       TEXT NOT NULL CHECK (source IN ('card', 'conversation', 'import', 'summary')),
  source_id    UUID,  -- card_id oder conversation_id (polymorphisch, kein FK — intentional)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS knowledge_entries_workspace_id_idx ON public.knowledge_entries(workspace_id);

-- ── Outcomes ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outcomes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT,
  type         TEXT NOT NULL DEFAULT 'document' CHECK (type IN ('document', 'code', 'data', 'other')),
  created_by   UUID NOT NULL REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;

-- workspaces: Discovery für alle department_members; Schreiben nur für Teilnehmer
-- Hinweis: OR-Klausel (department_id) ist gewollt — jeder im Department kann Workspaces sehen
DROP POLICY IF EXISTS "workspaces_select" ON public.workspaces;
CREATE POLICY "workspaces_select" ON public.workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
    OR department_id IN (
      SELECT workspace_id FROM public.department_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspaces_insert" ON public.workspaces;
CREATE POLICY "workspaces_insert" ON public.workspaces
  FOR INSERT WITH CHECK (
    department_id IN (
      SELECT workspace_id FROM public.department_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
  );

DROP POLICY IF EXISTS "workspaces_update" ON public.workspaces;
CREATE POLICY "workspaces_update" ON public.workspaces
  FOR UPDATE USING (
    id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "workspaces_delete" ON public.workspaces;
CREATE POLICY "workspaces_delete" ON public.workspaces
  FOR DELETE USING (
    id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid() AND role::TEXT = 'admin'
    )
  );

DROP POLICY IF EXISTS "workspace_participants_select" ON public.workspace_participants;
CREATE POLICY "workspace_participants_select" ON public.workspace_participants
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "workspace_participants_write" ON public.workspace_participants;
CREATE POLICY "workspace_participants_write" ON public.workspace_participants
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid() AND role::TEXT = 'admin'
    )
  );

DROP POLICY IF EXISTS "cards_select" ON public.cards;
CREATE POLICY "cards_select" ON public.cards
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "cards_write" ON public.cards;
CREATE POLICY "cards_write" ON public.cards
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "cards_update" ON public.cards;
CREATE POLICY "cards_update" ON public.cards
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

-- card_history: NUR SELECT + INSERT (APPEND ONLY)
DROP POLICY IF EXISTS "card_history_select" ON public.card_history;
CREATE POLICY "card_history_select" ON public.card_history
  FOR SELECT USING (
    card_id IN (
      SELECT c.id FROM public.cards c
      WHERE c.workspace_id IN (
        SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "card_history_insert" ON public.card_history;
CREATE POLICY "card_history_insert" ON public.card_history
  FOR INSERT WITH CHECK (
    card_id IN (
      SELECT c.id FROM public.cards c
      WHERE c.workspace_id IN (
        SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid()
      )
    )
  );
-- KEIN UPDATE-Policy. KEIN DELETE-Policy.

DROP POLICY IF EXISTS "connections_select" ON public.connections;
CREATE POLICY "connections_select" ON public.connections
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "connections_write" ON public.connections;
CREATE POLICY "connections_write" ON public.connections
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "connections_delete" ON public.connections;
CREATE POLICY "connections_delete" ON public.connections
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "knowledge_entries_select" ON public.knowledge_entries;
CREATE POLICY "knowledge_entries_select" ON public.knowledge_entries
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "knowledge_entries_insert" ON public.knowledge_entries;
CREATE POLICY "knowledge_entries_insert" ON public.knowledge_entries
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "outcomes_select" ON public.outcomes;
CREATE POLICY "outcomes_select" ON public.outcomes
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "outcomes_write" ON public.outcomes;
CREATE POLICY "outcomes_write" ON public.outcomes
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );
