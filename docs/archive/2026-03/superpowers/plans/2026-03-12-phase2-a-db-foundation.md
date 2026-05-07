# Phase 2 — Plan A: DB-Foundation

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle neuen Datenbanktabellen für das Phase-2-System anlegen — Projekte, Workspaces (Karten-basiert), Agenten-Zuweisungen, Transformationen, Templates, Org/Dept-Wissen, Feeds.

**Architecture:** Vier Migrationen (030–033) legen die Tabellen in logischen Gruppen an. Jede Migration ist eigenständig pushbar. RLS wird direkt mitdefiniert. `departments` und `department_members` (ex workspaces/workspace_members) bleiben unberührt. `organization_settings` existiert bereits (Migration 007), `dept_settings` wird in 032 ergänzt.

**Tech Stack:** PostgreSQL via Supabase CLI (`supabase db push`), Row Level Security, `supabaseAdmin` für alle Queries (bypasses RLS)

**Wichtig für alle Tasks:**
- Arbeitsverzeichnis: `C:/Users/timmr/tropen OS`
- Push-Befehl: `cd "/c/Users/timmr/tropen OS" && supabase db push`
- `workspace_id` in `department_members`/`conversations` = ID eines `departments`-Eintrags (historischer Spaltenname)
- Neue Tabellen: kein `tropen_`-Präfix
- **APPEND ONLY** (`project_memory`, `card_history`, `feed_processing_log`): NUR SELECT + INSERT Policies — niemals UPDATE/DELETE Policy anlegen
- Alle Schreiboperationen auf APPEND ONLY Tabellen laufen über `supabaseAdmin` (bypasses RLS)

**Tabellen die in späteren Plänen kommen:**
- `workspace_messages`, `operators`, `operator_results` → Plan C (Chat & Card Engine)

**Referenz:** `docs/tropen-os-architektur.md`, `CLAUDE.md` → "Phase 2 — tropen_ System"

---

## Chunk 1: Projekte-Tabellen (Migration 030)

### Task 1: Migration 030 — Projekte-Schema

**Files:**
- Create: `supabase/migrations/030_projects_schema.sql`

**Schema-Übersicht:**
- `projects`: Smarte Projektordner mit Gedächtnis
- `project_participants`: Wer hat Zugang zu welchem Projekt
- `project_knowledge`: Dateien, Notizen, Links im Projekt
- `project_memory`: Gedächtnis-Einträge **(APPEND ONLY — nur SELECT + INSERT Policies)**

- [ ] **Step 1: Migration-Datei anlegen**

Erstelle `supabase/migrations/030_projects_schema.sql`:

```sql
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
```

- [ ] **Step 2: Migration pushen**

```bash
cd "/c/Users/timmr/tropen OS" && supabase db push
```

Erwartete Ausgabe:
```
Applying migration 030_projects_schema.sql...
Finished supabase db push.
```

- [ ] **Step 3: Tabellen verifizieren (Supabase Dashboard → Table Editor)**

- `projects` (id, department_id, title, goal, instructions, meta, created_by, created_at, updated_at, deleted_at)
- `project_participants` (project_id, user_id, role, joined_at)
- `project_knowledge` (id, project_id, type, title, content, url, file_path, file_size, created_by, created_at, updated_at)
- `project_memory` (id, project_id, type, content, source_conversation_id, importance, tags, frozen, created_at)
- `conversations.project_id` hat FK auf `projects.id` (Dashboard → conversations → Foreign Keys prüfen)

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add supabase/migrations/030_projects_schema.sql
git commit -m "feat(db): add projects, project_memory, project_knowledge, project_participants tables"
```

---

## Chunk 2: Workspaces + Karten-System (Migration 031)

### Task 2: Migration 031 — Workspaces-Schema (Karten-basiert)

**Files:**
- Create: `supabase/migrations/031_workspaces_schema.sql`

**Schema-Übersicht:**
- `workspaces`: Karten-basierte Arbeitsbereiche (der Name ist jetzt frei)
- `workspace_participants`: Zugangskontrolle
- `cards`: Karten im Workspace (Input/Process/Output)
- `card_history`: Änderungshistorie **(APPEND ONLY)**
- `connections`: Graph-Kanten zwischen Karten
- `knowledge_entries`: Akkumuliertes Wissen im Workspace
- `outcomes`: Fertige Outputs

**Hinweis:** `workspace_messages`, `operators`, `operator_results` → folgen in Plan C

- [ ] **Step 1: Migration-Datei anlegen**

Erstelle `supabase/migrations/031_workspaces_schema.sql`:

```sql
-- 031_workspaces_schema.sql
-- Workspaces: Karten-basierte Arbeitsbereiche (neues Feature)
-- "workspaces" ist jetzt frei (ex-workspaces → departments umbenannt).
-- workspace_messages, operators, operator_results folgen in Migration 035 (Plan C).

-- ── Workspaces ───────────────────────────────────────────────────────────────
CREATE TABLE public.workspaces (
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

CREATE INDEX workspaces_department_id_idx ON public.workspaces(department_id);

-- ── Workspace-Teilnehmer ─────────────────────────────────────────────────────
CREATE TABLE public.workspace_participants (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- ── Karten ───────────────────────────────────────────────────────────────────
CREATE TABLE public.cards (
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

CREATE INDEX cards_workspace_id_idx ON public.cards(workspace_id);

-- ── Karten-Historie (APPEND ONLY) ────────────────────────────────────────────
-- NIEMALS UPDATE oder DELETE — weder in Code noch in Policies!
CREATE TABLE public.card_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  field      TEXT NOT NULL,
  old_value  TEXT,
  new_value  TEXT,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- kein updated_at — APPEND ONLY
);

CREATE INDEX card_history_card_id_idx ON public.card_history(card_id);

-- ── Verbindungen (Graph-Kanten) ──────────────────────────────────────────────
CREATE TABLE public.connections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  from_card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  to_card_id   UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  label        TEXT,
  created_by   UUID NOT NULL REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_card_id, to_card_id)
);

CREATE INDEX connections_workspace_id_idx ON public.connections(workspace_id);

-- ── Wissens-Einträge ─────────────────────────────────────────────────────────
CREATE TABLE public.knowledge_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  source       TEXT NOT NULL CHECK (source IN ('card', 'conversation', 'import', 'summary')),
  source_id    UUID,  -- card_id oder conversation_id (polymorphisch, kein FK — intentional)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX knowledge_entries_workspace_id_idx ON public.knowledge_entries(workspace_id);

-- ── Outcomes ─────────────────────────────────────────────────────────────────
CREATE TABLE public.outcomes (
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
CREATE POLICY "workspaces_select" ON public.workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
    OR department_id IN (
      SELECT workspace_id FROM public.department_members WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "workspaces_insert" ON public.workspaces
  FOR INSERT WITH CHECK (
    department_id IN (
      SELECT workspace_id FROM public.department_members WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "workspaces_update" ON public.workspaces
  FOR UPDATE USING (
    id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );
CREATE POLICY "workspaces_delete" ON public.workspaces
  FOR DELETE USING (
    id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "workspace_participants_select" ON public.workspace_participants
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );
CREATE POLICY "workspace_participants_write" ON public.workspace_participants
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "cards_select" ON public.cards
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );
CREATE POLICY "cards_write" ON public.cards
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );
CREATE POLICY "cards_update" ON public.cards
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

-- card_history: NUR SELECT + INSERT (APPEND ONLY)
CREATE POLICY "card_history_select" ON public.card_history
  FOR SELECT USING (
    card_id IN (
      SELECT c.id FROM public.cards c
      WHERE c.workspace_id IN (
        SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid()
      )
    )
  );
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

CREATE POLICY "connections_select" ON public.connections
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );
CREATE POLICY "connections_write" ON public.connections
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );
CREATE POLICY "connections_delete" ON public.connections
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "knowledge_entries_select" ON public.knowledge_entries
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );
CREATE POLICY "knowledge_entries_insert" ON public.knowledge_entries
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "outcomes_select" ON public.outcomes
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );
CREATE POLICY "outcomes_write" ON public.outcomes
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid())
  );
```

- [ ] **Step 2: Migration pushen**

```bash
cd "/c/Users/timmr/tropen OS" && supabase db push
```

- [ ] **Step 3: Tabellen verifizieren**

- `workspaces` (id, department_id, title, goal, meta, created_by, ...)
- `workspace_participants` (workspace_id, user_id, role, joined_at)
- `cards` (id, workspace_id, type, title, content, position, meta, created_by, ...)
- `card_history` (id, card_id, field, old_value, new_value, changed_by, created_at)
- `connections` (id, workspace_id, from_card_id, to_card_id, label, created_by, created_at)
- `knowledge_entries` (id, workspace_id, content, source, source_id, created_at)
- `outcomes` (id, workspace_id, title, content, type, created_by, created_at)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/031_workspaces_schema.sql
git commit -m "feat(db): add workspaces (card-based), cards, card_history, connections, knowledge_entries, outcomes"
```

---

## Chunk 3: Support-Tabellen (Migration 032)

### Task 3: Migration 032 — Transformationen, Templates, Org/Dept-Wissen, Agenten-Zuweisungen

**Files:**
- Create: `supabase/migrations/032_support_tables.sql`

**Schema-Übersicht:**
- `dept_settings`: Department-Einstellungen (ergänzt `organization_settings` die schon existiert)
- `org_knowledge` / `dept_knowledge`: Wissen mit Kontroll-Modus
- `agent_assignments`: Agenten zu Projekten/Workspaces/Karten
- `transformations`: Tracking Projekt→Workspace/Agent/Feed
- `transformation_links`: Aktive Verbindungen nach Transformation
- `templates`: Wiederverwendbare Vorlagen

- [ ] **Step 1: Migration-Datei anlegen**

Erstelle `supabase/migrations/032_support_tables.sql`:

```sql
-- 032_support_tables.sql
-- Support-Tabellen: Settings, Wissen, Agenten-Zuweisungen, Transformationen, Templates
-- organization_settings existiert bereits (Migration 007) — nur dept_settings ist neu.

-- ── Department-Einstellungen ─────────────────────────────────────────────────
CREATE TABLE public.dept_settings (
  department_id   UUID PRIMARY KEY REFERENCES public.departments(id) ON DELETE CASCADE,
  -- Kontroll-Modus überschreibt org-weite Einstellungen (kann einschränken, nie lockern)
  allowed_models  TEXT[],        -- NULL = erbt von org
  budget_limit    NUMERIC(10,2), -- NULL = erbt von org
  meta            JSONB NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Org-Wissen ───────────────────────────────────────────────────────────────
CREATE TABLE public.org_knowledge (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  control_mode    TEXT NOT NULL DEFAULT 'suggested' CHECK (control_mode IN ('locked', 'suggested', 'open')),
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX org_knowledge_org_id_idx ON public.org_knowledge(organization_id);

-- ── Department-Wissen ────────────────────────────────────────────────────────
CREATE TABLE public.dept_knowledge (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  control_mode  TEXT NOT NULL DEFAULT 'suggested' CHECK (control_mode IN ('locked', 'suggested', 'open')),
  created_by    UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX dept_knowledge_dept_id_idx ON public.dept_knowledge(department_id);

-- ── Agenten-Zuweisungen ──────────────────────────────────────────────────────
-- agents-Tabelle existiert bereits (Migration 025)
CREATE TABLE public.agent_assignments (
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

CREATE INDEX agent_assignments_agent_id_idx ON public.agent_assignments(agent_id);
CREATE INDEX agent_assignments_project_id_idx ON public.agent_assignments(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX agent_assignments_workspace_id_idx ON public.agent_assignments(workspace_id) WHERE workspace_id IS NOT NULL;

-- ── Transformationen ─────────────────────────────────────────────────────────
-- Alle Schreibzugriffe via supabaseAdmin (Server-Action). Client liest nur.
-- source_id / target_id sind polymorphisch (project.id oder workspace.id) — kein DB-FK intentional.
CREATE TABLE public.transformations (
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

CREATE INDEX transformations_source_idx ON public.transformations(source_type, source_id);

-- ── Transformations-Links ────────────────────────────────────────────────────
-- Aktive Verbindungen nach Transformation. Schreiben nur via supabaseAdmin.
CREATE TABLE public.transformation_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('project', 'workspace')),
  source_id   UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('workspace', 'agent', 'feed')),
  target_id   UUID NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX transformation_links_source_idx ON public.transformation_links(source_type, source_id);

-- ── Templates ────────────────────────────────────────────────────────────────
CREATE TABLE public.templates (
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

CREATE INDEX templates_org_id_idx ON public.templates(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX templates_type_idx ON public.templates(type);

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
      WHERE user_id = auth.uid() AND role = 'admin'
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
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
CREATE POLICY "dept_knowledge_update" ON public.dept_knowledge
  FOR UPDATE USING (
    department_id IN (
      SELECT workspace_id FROM public.department_members
      WHERE user_id = auth.uid() AND role = 'admin'
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
```

- [ ] **Step 2: Migration pushen**

```bash
cd "/c/Users/timmr/tropen OS" && supabase db push
```

- [ ] **Step 3: Tabellen verifizieren**

- `dept_settings`, `org_knowledge`, `dept_knowledge`
- `agent_assignments`, `transformations`, `transformation_links`
- `templates`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/032_support_tables.sql
git commit -m "feat(db): add dept_settings, org/dept knowledge, agent_assignments, transformations, templates"
```

---

## Chunk 4: Feed-Tabellen (Migration 033)

### Task 4: Migration 033 — Feed-Pipeline

**Files:**
- Create: `supabase/migrations/033_feed_tables.sql`

**Drei-Stufen-Pipeline:**
- Stage 1: regelbasiert, kein AI → `feed_items` anlegen
- Stage 2: Haiku scoring → `feed_items.score` setzen (max 300 Output-Tokens)
- Stage 3: Sonnet deep analysis → `feed_items.summary` setzen (max 10 Items/Batch)

**`feed_processing_log` ist APPEND ONLY** — NUR SELECT Policy für Clients, Schreiben via supabaseAdmin.

- [ ] **Step 1: Migration-Datei anlegen**

Erstelle `supabase/migrations/033_feed_tables.sql`:

```sql
-- 033_feed_tables.sql
-- Feed-Pipeline: Drei-Stufen-System (regelbasiert → Haiku → Sonnet)

-- ── Feed-Quellen ─────────────────────────────────────────────────────────────
CREATE TABLE public.feed_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('rss', 'web', 'api')),
  url             TEXT NOT NULL,
  sync_interval   INTEGER NOT NULL DEFAULT 60,  -- Minuten
  last_synced_at  TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  meta            JSONB NOT NULL DEFAULT '{}',
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX feed_sources_org_id_idx ON public.feed_sources(organization_id);

-- ── Feed-Schemas (Filter-Regeln) ─────────────────────────────────────────────
CREATE TABLE public.feed_schemas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  rules           JSONB NOT NULL DEFAULT '[]',  -- [{field, operator, value}]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Quelle ↔ Schema Zuordnung ────────────────────────────────────────────────
CREATE TABLE public.feed_source_schemas (
  feed_source_id UUID NOT NULL REFERENCES public.feed_sources(id) ON DELETE CASCADE,
  feed_schema_id UUID NOT NULL REFERENCES public.feed_schemas(id) ON DELETE CASCADE,
  PRIMARY KEY (feed_source_id, feed_schema_id)
);

-- ── Feed-Items ───────────────────────────────────────────────────────────────
CREATE TABLE public.feed_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_source_id UUID NOT NULL REFERENCES public.feed_sources(id) ON DELETE CASCADE,
  external_id    TEXT,  -- original ID/URL für Deduplizierung
  title          TEXT NOT NULL,
  url            TEXT,
  content        TEXT,
  summary        TEXT,         -- Stage 3: AI-generiert
  score          NUMERIC(3,2), -- Stage 2: Haiku-Score 0.00–1.00
  stage          INTEGER NOT NULL DEFAULT 1 CHECK (stage IN (1, 2, 3)),
  published_at   TIMESTAMPTZ,
  fetched_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (feed_source_id, external_id)
);

CREATE INDEX feed_items_source_id_idx ON public.feed_items(feed_source_id);
CREATE INDEX feed_items_score_idx ON public.feed_items(score) WHERE score IS NOT NULL;

-- ── Verarbeitungs-Log (APPEND ONLY) ─────────────────────────────────────────
-- NUR via supabaseAdmin schreibbar (Server-Side / Edge Function).
-- Clients können nur lesen (Admins).
CREATE TABLE public.feed_processing_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_source_id  UUID NOT NULL REFERENCES public.feed_sources(id) ON DELETE CASCADE,
  stage           INTEGER NOT NULL CHECK (stage IN (1, 2, 3)),
  items_processed INTEGER NOT NULL DEFAULT 0,
  tokens_used     INTEGER,
  cost_eur        NUMERIC(8,6),
  status          TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- kein updated_at — APPEND ONLY
);

-- ── Distributionen (Feed → Workspace/Projekt) ────────────────────────────────
-- target_id verweist auf workspace.id oder project.id (polymorphisch — kein DB-FK intentional)
CREATE TABLE public.feed_distributions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_source_id UUID NOT NULL REFERENCES public.feed_sources(id) ON DELETE CASCADE,
  target_type    TEXT NOT NULL CHECK (target_type IN ('workspace', 'project')),
  target_id      UUID NOT NULL,
  min_score      NUMERIC(3,2) NOT NULL DEFAULT 0.70,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (feed_source_id, target_type, target_id)
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.feed_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_source_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_processing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_sources_select" ON public.feed_sources
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "feed_sources_write" ON public.feed_sources
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin')
    )
  );
CREATE POLICY "feed_sources_update" ON public.feed_sources
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin')
    )
  );

CREATE POLICY "feed_schemas_select" ON public.feed_schemas
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "feed_source_schemas_select" ON public.feed_source_schemas
  FOR SELECT USING (TRUE);

CREATE POLICY "feed_items_select" ON public.feed_items
  FOR SELECT USING (
    feed_source_id IN (
      SELECT fs.id FROM public.feed_sources fs
      JOIN public.users u ON u.organization_id = fs.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- feed_processing_log: NUR SELECT für Admins (APPEND ONLY — kein INSERT Policy für Clients)
-- Schreiben ausschließlich via supabaseAdmin in Edge Functions.
CREATE POLICY "feed_processing_log_select" ON public.feed_processing_log
  FOR SELECT USING (
    feed_source_id IN (
      SELECT fs.id FROM public.feed_sources fs
      JOIN public.users u ON u.organization_id = fs.organization_id
      WHERE u.id = auth.uid() AND u.role IN ('owner', 'admin', 'superadmin')
    )
  );
-- KEIN INSERT/UPDATE/DELETE Policy für Clients.

CREATE POLICY "feed_distributions_select" ON public.feed_distributions
  FOR SELECT USING (TRUE);
```

- [ ] **Step 2: Migration pushen**

```bash
cd "/c/Users/timmr/tropen OS" && supabase db push
```

- [ ] **Step 3: Tabellen verifizieren**

- `feed_sources`, `feed_schemas`, `feed_source_schemas`
- `feed_items`, `feed_processing_log`, `feed_distributions`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/033_feed_tables.sql
git commit -m "feat(db): add feed pipeline tables (sources, items, processing_log, distributions)"
```

---

## Chunk 5: CLAUDE.md aktualisieren

### Task 5: Migrations-Übersicht nachziehen

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Migrations-Tabelle in CLAUDE.md ergänzen**

In `CLAUDE.md` unter "Migrations-Übersicht" am Ende der Tabelle ergänzen:

```markdown
| 030_projects_schema.sql | projects, project_participants, project_knowledge, project_memory (APPEND ONLY) |
| 031_workspaces_schema.sql | workspaces (Karten-basiert), workspace_participants, cards, card_history (APPEND ONLY), connections, knowledge_entries, outcomes |
| 032_support_tables.sql | dept_settings, org_knowledge, dept_knowledge, agent_assignments, transformations, transformation_links, templates |
| 033_feed_tables.sql | feed_sources, feed_schemas, feed_source_schemas, feed_items, feed_processing_log (APPEND ONLY), feed_distributions |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with migrations 030-033"
```

---

## Abschluss

Nach Plan A sind alle DB-Tabellen live. Plan B (Projekte CRUD + Gedächtnis + Context-Awareness) kann direkt starten.

**Nächste Pläne:**
1. `2026-03-12-phase2-b-projects-crud.md` — Projekt-API, CRUD, Gedächtnis-Extraktion, Context-Window-Anzeige
2. `2026-03-12-phase2-c-workspaces-cards.md` — Workspace + Card Engine + Connection Graph + workspace_messages/operators
3. `2026-03-12-phase2-d-chat-context.md` — Chat-Integration (Projekt-Kontext-Injection, Memory-Warnung)
4. `2026-03-12-phase2-e-transformations.md` — Transformations-Engine
5. `2026-03-12-phase2-f-ui.md` — UI (Projekte + Workspaces)
6. `2026-03-12-phase2-g-feeds.md` — Feed-Pipeline
