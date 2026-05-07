# Capability + Outcome System — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the DB + API + Logic foundation for Capabilities (what Toro does) and Outcomes (what comes out) — the routing layer that replaces Dify for Chat, Workspace, Agents, and Feeds.

**Architecture:** Two migrations (039 = main system, 040 = cards extension), one resolver module with pure business logic, six API routes. The `outcomes` name conflict (031 = workspace-scoped) is resolved by renaming the old table to `workspace_outcomes` in 039 before creating the system-level `outcomes`.

**Tech Stack:** Supabase (supabaseAdmin), Zod, Next.js App Router API routes, TypeScript strict mode, Jest/Vitest unit tests.

---

## Conflict Resolution (decide before touching code)

| Conflict | Decision |
|----------|----------|
| `outcomes` table (031) workspace-scoped, name collision | Rename → `workspace_outcomes` in migration 039 (DO $$ RENAME guard) |
| Migration numbers 035/036 taken | Use `20260317000039_capability_outcome_system.sql` + `20260317000040_cards_capability.sql` |
| `model_catalog.cost_per_1k_input` (not EUR-suffixed) | Reuse existing columns as EUR costs; skip separate EUR columns |
| `model_catalog.api_model_id` exists from 038 | Use as FK reference target for capability seed data |

---

## File Map

### New Files
| Path | Responsibility |
|------|---------------|
| `supabase/migrations/20260317000039_capability_outcome_system.sql` | Rename outcomes→workspace_outcomes; create capabilities, outcomes (system), capability_outcomes, capability_org_settings, user_capability_settings; extend model_catalog; seed 10 capabilities (incl. Guided) + outcomes + combos + models; create guided_workflows/options/settings tables (empty — seed in 041) |
| `supabase/migrations/20260317000040_cards_capability.sql` | Add capability_id, outcome_id, sources, last_run_at, next_run_at to cards |
| `src/lib/capability-resolver.ts` | resolveWorkflow(), getValidOutcomes(), getDefaultOutcome(), resolveCardType() |
| `src/lib/capability-resolver.unit.test.ts` | Unit tests for resolver (mock supabaseAdmin) |
| `src/lib/validators/capabilities.ts` | Zod schemas: ResolveWorkflowInput, PatchSettingsInput, PatchOrgSettingsInput |
| `src/app/api/capabilities/route.ts` | GET /api/capabilities |
| `src/app/api/capabilities/[id]/outcomes/route.ts` | GET /api/capabilities/[id]/outcomes |
| `src/app/api/capabilities/resolve/route.ts` | POST /api/capabilities/resolve |
| `src/app/api/capabilities/settings/route.ts` | PATCH /api/capabilities/settings |
| `src/app/api/capabilities/org-settings/route.ts` | GET + PATCH /api/capabilities/org-settings |

### Modified Files
| Path | Change |
|------|--------|
| `CLAUDE.md` | Add rows to migrations table; add Capability + Outcome System section |

---

## Chunk 0: schema.ts vorher aufräumen (vor Migration 039)

### Task 0: Drizzle schema.ts — outcomes umbenennen + system-level outcomes hinzufügen

**Warum zuerst:** Migration 039 benennt `outcomes` → `workspace_outcomes` und legt eine neue
system-level `outcomes` Tabelle an. Ohne diesen Schritt ist `schema.ts` nach der Migration stale —
`pgTable('outcomes', ...)` zeigt dann auf eine nicht mehr existierende Tabelle.

**Files:**
- Modify: `src/db/schema.ts`

Aktuelle Stellen (alle müssen angefasst werden):
- `export const outcomes = pgTable('outcomes', {...})` → umbenennen
- `outcomesRelations` → umbenennen
- `workspacesRelations: outcomes: many(outcomes)` → aktualisieren
- `export type Outcome` + `OutcomeInsert` → umbenennen

- [ ] **Step 1: outcomes → workspaceOutcomes umbenennen**

In `src/db/schema.ts`:

```typescript
// ALT:
export const outcomes = pgTable('outcomes', {
  id: uuid('id').primaryKey()...,
  workspaceId: uuid('workspace_id')...,
  type: outcomeTypeEnum('type')...,
  title: varchar('title', { length: 255 })...,
  // ... alle bestehenden Felder
})

// NEU: Tabelle heißt jetzt workspace_outcomes in der DB
export const workspaceOutcomes = pgTable('workspace_outcomes', {
  id: uuid('id').primaryKey()...,
  workspaceId: uuid('workspace_id')...,
  type: outcomeTypeEnum('type')...,
  title: varchar('title', { length: 255 })...,
  // ... alle bestehenden Felder unverändert
})
```

- [ ] **Step 2: System-level outcomes Tabelle hinzufügen**

Nach dem `workspaceOutcomes` Block einfügen:

```typescript
// ---------------------------------------------------------------------------
// outcomes (system-level — Output-Typen: Text, Tabelle, Report, ...)
// Hinweis: workspace-scoped Outcomes → workspaceOutcomes (oben)
// ---------------------------------------------------------------------------
export const outcomes = pgTable('outcomes', {
  id:                    uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  label:                 varchar('label', { length: 100 }).notNull(),
  icon:                  varchar('icon', { length: 10 }).notNull(),
  description:           text('description'),
  outputType:            varchar('output_type', { length: 50 }).notNull().unique(),
  cardType:              varchar('card_type', { length: 50 }).notNull(),
  systemPromptInjection: text('system_prompt_injection'),
  isActive:              boolean('is_active').notNull().default(true),
  sortOrder:             integer('sort_order').notNull().default(0),
})

export type SystemOutcome = typeof outcomes.$inferSelect
export type SystemOutcomeInsert = typeof outcomes.$inferInsert
```

- [ ] **Step 3: Relations + Typen aktualisieren**

```typescript
// ALT:
export const outcomesRelations = relations(outcomes, ({ one }) => ({
  workspace: one(workspaces, { fields: [outcomes.workspaceId], references: [workspaces.id] }),
}))

// NEU:
export const workspaceOutcomesRelations = relations(workspaceOutcomes, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceOutcomes.workspaceId], references: [workspaces.id] }),
}))

// In workspacesRelations:
// ALT: outcomes: many(outcomes)
// NEU: workspaceOutcomes: many(workspaceOutcomes)
```

```typescript
// ALT:
export type Outcome = typeof outcomes.$inferSelect
export type OutcomeInsert = typeof outcomes.$inferInsert

// NEU (workspace-scoped):
export type WorkspaceOutcome = typeof workspaceOutcomes.$inferSelect
export type WorkspaceOutcomeInsert = typeof workspaceOutcomes.$inferInsert
// (SystemOutcome + SystemOutcomeInsert bereits in Step 2 angelegt)
```

- [ ] **Step 4: TypeScript check**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit
```

Expected: keine Fehler. Falls `Outcome`/`OutcomeInsert` noch irgendwo importiert werden → Fehler auflösen.

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/db/schema.ts
git commit -m "refactor: rename schema.ts outcomes → workspaceOutcomes, add system-level outcomes type"
```

---

## Chunk 1: Migrations

### Task 1: Main Migration — Rename + New Tables + model_catalog extension

**Files:**
- Create: `supabase/migrations/20260317000039_capability_outcome_system.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- 20260317000039_capability_outcome_system.sql
-- Capability + Outcome System — Fundament für Chat, Workspace, Agenten, Feeds
-- Idempotent: IF NOT EXISTS + DO $$ guards on all DDL.

BEGIN;

-- ============================================================
-- 0. Rename workspace-scoped outcomes → workspace_outcomes
--    (031 created outcomes as a workspace result store — different concept)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'outcomes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'workspace_outcomes'
  ) THEN
    ALTER TABLE public.outcomes RENAME TO workspace_outcomes;
  END IF;
END;
$$;

-- ============================================================
-- 1. Extend model_catalog
-- ============================================================
ALTER TABLE public.model_catalog
  ADD COLUMN IF NOT EXISTS label           TEXT,
  ADD COLUMN IF NOT EXISTS context_window  INTEGER,
  ADD COLUMN IF NOT EXISTS is_eu_hosted    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS capabilities    JSONB   NOT NULL DEFAULT '[]';

-- Backfill label from name for existing rows
UPDATE public.model_catalog SET label = name WHERE label IS NULL;

-- Seed / upsert models (ON CONFLICT on api_model_id)
-- Note: existing rows use name as display; api_model_id was added in 038.
-- We upsert by api_model_id to avoid duplicates.

INSERT INTO public.model_catalog
  (name, label, provider, model_class, cost_per_1k_input, cost_per_1k_output,
   context_window, is_eu_hosted, is_active, capabilities, api_model_id)
VALUES
  -- Anthropic
  ('claude-haiku-4-5',    'Claude Haiku 4.5',   'anthropic', 'fast', 0.00080, 0.00400,  200000, FALSE, TRUE,
   '["chat","translate","writing","summarize"]',         'claude-haiku-4-5-20251001'),
  ('claude-sonnet-4-5',   'Claude Sonnet 4.5',  'anthropic', 'deep', 0.00300, 0.01500,  200000, FALSE, TRUE,
   '["chat","search","reasoning","document","writing","data","perspectives"]', 'claude-sonnet-4-20250514'),
  -- OpenAI
  ('gpt-4o-mini',         'GPT-4o Mini',        'openai',    'fast', 0.00015, 0.00060,  128000, FALSE, TRUE,
   '["chat","translate","writing"]',                     'gpt-4o-mini'),
  ('gpt-4o',              'GPT-4o',             'openai',    'deep', 0.00250, 0.01000,  128000, FALSE, TRUE,
   '["chat","search","reasoning","document","writing","data"]', 'gpt-4o'),
  -- Mistral (prepared, inactive)
  ('mistral-small-latest','Mistral Small',       'mistral',   'fast', 0.00020, 0.00060,   32000, TRUE,  FALSE,
   '["chat","translate","confidential"]',                'mistral-small-latest'),
  ('mistral-large-latest','Mistral Large',       'mistral',   'deep', 0.00200, 0.00600,   32000, TRUE,  FALSE,
   '["chat","reasoning","document","confidential"]',     'mistral-large-latest')
ON CONFLICT (name) DO UPDATE SET
  label           = EXCLUDED.label,
  context_window  = EXCLUDED.context_window,
  is_eu_hosted    = EXCLUDED.is_eu_hosted,
  is_active       = EXCLUDED.is_active,
  capabilities    = EXCLUDED.capabilities,
  api_model_id    = COALESCE(model_catalog.api_model_id, EXCLUDED.api_model_id);

-- ============================================================
-- 2. capabilities
-- ============================================================
CREATE TABLE IF NOT EXISTS public.capabilities (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scope                   TEXT        NOT NULL DEFAULT 'system'
                            CHECK (scope IN ('system','org','user')),
  organization_id         UUID        REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id                 UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  label                   TEXT        NOT NULL,
  icon                    TEXT        NOT NULL,
  description             TEXT,
  capability_type         TEXT        NOT NULL
                            CHECK (capability_type IN (
                              'chat','search','reasoning','perspectives',
                              'document','writing','data','translate','confidential','custom','guided'
                            )),
  default_model_id        UUID        REFERENCES public.model_catalog(id) ON DELETE SET NULL,
  system_prompt_injection TEXT,
  tools                   JSONB       NOT NULL DEFAULT '[]',
  requires_package        UUID        REFERENCES public.packages(id) ON DELETE SET NULL,
  is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order              INTEGER     NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capabilities_scope        ON public.capabilities (scope);
CREATE INDEX IF NOT EXISTS idx_capabilities_org_id       ON public.capabilities (organization_id);
CREATE INDEX IF NOT EXISTS idx_capabilities_type         ON public.capabilities (capability_type);
CREATE INDEX IF NOT EXISTS idx_capabilities_is_active    ON public.capabilities (is_active);

ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;

-- system capabilities visible to all authenticated users
DROP POLICY IF EXISTS "capabilities_select_system" ON public.capabilities;
CREATE POLICY "capabilities_select_system" ON public.capabilities
  FOR SELECT TO authenticated
  USING (
    scope = 'system'
    OR (scope = 'org' AND organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    ))
    OR (scope = 'user' AND user_id = auth.uid())
  );

-- only superadmin / service role can insert/update system capabilities (via supabaseAdmin)
DROP POLICY IF EXISTS "capabilities_write_own" ON public.capabilities;
CREATE POLICY "capabilities_write_own" ON public.capabilities
  FOR INSERT TO authenticated
  WITH CHECK (scope IN ('org','user') AND (
    (scope = 'org' AND organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    ))
    OR (scope = 'user' AND user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "capabilities_update_own" ON public.capabilities;
CREATE POLICY "capabilities_update_own" ON public.capabilities
  FOR UPDATE TO authenticated
  USING (scope IN ('org','user') AND (
    (scope = 'org' AND organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    ))
    OR (scope = 'user' AND user_id = auth.uid())
  ));

-- ============================================================
-- 3. outcomes (system-level — output format definitions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.outcomes (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  label                   TEXT        NOT NULL,
  icon                    TEXT        NOT NULL,
  description             TEXT,
  output_type             TEXT        NOT NULL UNIQUE
                            CHECK (output_type IN (
                              'text','table','chart','report',
                              'presentation','action_plan','email','code','score'
                            )),
  card_type               TEXT        NOT NULL
                            CHECK (card_type IN (
                              'text','table','chart','kanban','code'
                            )),
  system_prompt_injection TEXT,
  is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order              INTEGER     NOT NULL DEFAULT 0
);

ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "outcomes_select" ON public.outcomes;
CREATE POLICY "outcomes_select" ON public.outcomes
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 4. capability_outcomes (valid combinations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.capability_outcomes (
  capability_id   UUID    NOT NULL REFERENCES public.capabilities(id) ON DELETE CASCADE,
  outcome_id      UUID    NOT NULL REFERENCES public.outcomes(id) ON DELETE CASCADE,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  model_override  UUID    REFERENCES public.model_catalog(id) ON DELETE SET NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (capability_id, outcome_id)
);

CREATE INDEX IF NOT EXISTS idx_capability_outcomes_cap  ON public.capability_outcomes (capability_id);
CREATE INDEX IF NOT EXISTS idx_capability_outcomes_out  ON public.capability_outcomes (outcome_id);

ALTER TABLE public.capability_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "capability_outcomes_select" ON public.capability_outcomes;
CREATE POLICY "capability_outcomes_select" ON public.capability_outcomes
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 5. capability_org_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.capability_org_settings (
  organization_id   UUID    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  capability_id     UUID    NOT NULL REFERENCES public.capabilities(id) ON DELETE CASCADE,
  is_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  allowed_model_ids JSONB   NOT NULL DEFAULT '[]',
  default_model_id  UUID    REFERENCES public.model_catalog(id) ON DELETE SET NULL,
  user_can_override BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (organization_id, capability_id)
);

CREATE INDEX IF NOT EXISTS idx_cap_org_settings_org ON public.capability_org_settings (organization_id);

ALTER TABLE public.capability_org_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "capability_org_settings_select" ON public.capability_org_settings;
CREATE POLICY "capability_org_settings_select" ON public.capability_org_settings
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "capability_org_settings_write" ON public.capability_org_settings;
CREATE POLICY "capability_org_settings_write" ON public.capability_org_settings
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.users
    WHERE id = auth.uid() AND role IN ('owner','admin')
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.users
    WHERE id = auth.uid() AND role IN ('owner','admin')
  ));

-- ============================================================
-- 6. user_capability_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_capability_settings (
  user_id             UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability_id       UUID    NOT NULL REFERENCES public.capabilities(id) ON DELETE CASCADE,
  selected_model_id   UUID    REFERENCES public.model_catalog(id) ON DELETE SET NULL,
  preferred_outcome_id UUID   REFERENCES public.outcomes(id) ON DELETE SET NULL,
  is_pinned           BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, capability_id)
);

CREATE INDEX IF NOT EXISTS idx_user_cap_settings_user ON public.user_capability_settings (user_id);

ALTER TABLE public.user_capability_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_capability_settings_own" ON public.user_capability_settings;
CREATE POLICY "user_capability_settings_own" ON public.user_capability_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 7. Seed: System Outcomes
-- ============================================================
INSERT INTO public.outcomes (label, icon, description, output_type, card_type, system_prompt_injection, sort_order)
VALUES
  ('Text',          '📝', 'Freier Fließtext als Antwort',
   'text',          'text',    'Antworte als klar strukturierter Fließtext.', 0),
  ('Tabelle',       '📋', 'Strukturierte Tabelle mit Zeilen und Spalten',
   'table',         'table',   'Strukturiere deine Antwort als Markdown-Tabelle.', 1),
  ('Grafik',        '📊', 'Datenvisualisierung / Chart',
   'chart',         'chart',   'Gib Daten als JSON-Struktur aus, die für Chart.js geeignet ist.', 2),
  ('Report',        '📄', 'Ausführlicher, strukturierter Bericht',
   'report',        'text',    'Erstelle einen vollständigen Bericht mit Zusammenfassung, Hauptteil und Fazit.', 3),
  ('Präsentation',  '🖼️', 'Foliendeck-Struktur',
   'presentation',  'text',    'Strukturiere den Output als Präsentation mit Titel-Folien und Bullet-Points.', 4),
  ('Aktionsplan',   '✅', 'Priorisierte Aufgabenliste / Kanban',
   'action_plan',   'kanban',  'Erstelle einen priorisierten Aktionsplan mit klaren nächsten Schritten.', 5),
  ('E-Mail',        '✉️', 'Fertige E-Mail mit Betreff und Body',
   'email',         'text',    'Schreibe eine vollständige E-Mail mit Betreff, Anrede, Body und Grußformel.', 6),
  ('Code',          '💻', 'Quellcode oder technische Ausgabe',
   'code',          'code',    'Antworte ausschließlich mit Code. Füge kurze Kommentare für komplexe Stellen ein.', 7),
  ('Score',         '🎯', 'Bewertung mit Punktzahl und Begründung',
   'score',         'text',    'Gib eine Bewertung auf einer Skala von 0–100 mit Begründung aus.', 8)
ON CONFLICT (output_type) DO UPDATE SET
  label                   = EXCLUDED.label,
  icon                    = EXCLUDED.icon,
  system_prompt_injection = EXCLUDED.system_prompt_injection,
  sort_order              = EXCLUDED.sort_order;

-- ============================================================
-- 8. Seed: System Capabilities
-- ============================================================
-- Helper: resolve model UUID by api_model_id
-- We insert capabilities referencing model_catalog by api_model_id subquery.

INSERT INTO public.capabilities
  (scope, label, icon, description, capability_type, default_model_id,
   system_prompt_injection, tools, is_active, sort_order)
VALUES
  ('system', 'Standard',     '⚡', 'Allgemeiner Chat mit Toro',
   'chat',
   (SELECT id FROM public.model_catalog WHERE api_model_id = 'claude-haiku-4-5-20251001' LIMIT 1),
   'Du bist Toro, ein hilfreicher KI-Assistent. Antworte präzise und klar.',
   '[]', TRUE, 0),

  ('system', 'Recherche',    '🌐', 'Web-Recherche und Quellen-Auswertung',
   'search',
   (SELECT id FROM public.model_catalog WHERE api_model_id = 'claude-sonnet-4-20250514' LIMIT 1),
   'Du bist ein Recherche-Experte. Analysiere Quellen kritisch und zitiere relevante Informationen.',
   '["web_search"]', TRUE, 1),

  ('system', 'Reasoning',    '🧠', 'Tiefes analytisches Denken und Schlussfolgerungen',
   'reasoning',
   (SELECT id FROM public.model_catalog WHERE api_model_id = 'claude-sonnet-4-20250514' LIMIT 1),
   'Du bist ein analytischer Denker. Zeige deinen Gedankengang Schritt für Schritt.',
   '[]', TRUE, 2),

  ('system', 'Perspectives', '👁', 'Mehrere Perspektiven auf eine Frage',
   'perspectives',
   NULL, -- multi-model, no single default
   'Betrachte die Frage aus mindestens 3 verschiedenen Perspektiven. Sei ausgewogen.',
   '[]', TRUE, 3),

  ('system', 'Dokument',     '📄', 'Dokumente lesen, zusammenfassen und analysieren',
   'document',
   (SELECT id FROM public.model_catalog WHERE api_model_id = 'claude-sonnet-4-20250514' LIMIT 1),
   'Du analysierst Dokumente präzise. Extrahiere Kernaussagen und strukturiere deine Antwort.',
   '[]', TRUE, 4),

  ('system', 'Schreiben',    '✍️', 'Texte verfassen, überarbeiten und verbessern',
   'writing',
   (SELECT id FROM public.model_catalog WHERE api_model_id = 'claude-sonnet-4-20250514' LIMIT 1),
   'Du bist ein erfahrener Texter. Schreibe klar, prägnant und zielgruppengerecht.',
   '[]', TRUE, 5),

  ('system', 'Daten & Tabellen', '🔢', 'Daten analysieren, vergleichen und visualisieren',
   'data',
   (SELECT id FROM public.model_catalog WHERE api_model_id = 'claude-sonnet-4-20250514' LIMIT 1),
   'Analysiere Daten strukturiert. Nutze Tabellen und Zahlen für Präzision.',
   '[]', TRUE, 6),

  ('system', 'Übersetzen',   '🌍', 'Texte in andere Sprachen übersetzen',
   'translate',
   (SELECT id FROM public.model_catalog WHERE api_model_id = 'claude-haiku-4-5-20251001' LIMIT 1),
   'Du bist ein professioneller Übersetzer. Übertrage Sinn und Stil, nicht nur Wörter.',
   '[]', TRUE, 7),

  ('system', 'Vertraulich',  '🔒', 'Datenschutzkonformer Modus — nur EU-Modelle',
   'confidential',
   NULL, -- EU-only: mistral, set when EU models active
   'Alle Daten werden vertraulich behandelt. Keine Daten verlassen die EU.',
   '[]', TRUE, 8),

  ('system', 'Guided',       '🧭', 'Geführter Entscheidungsweg – Toro schlägt Optionen vor, User steuert',
   'guided',
   (SELECT id FROM public.model_catalog WHERE api_model_id = 'claude-haiku-4-5-20251001' LIMIT 1),
   NULL, -- kein system_prompt_injection – der Workflow steuert den Prompt
   '[]', TRUE, 9)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. Seed: capability_outcomes (valid combinations)
-- ============================================================
-- Helper macro: insert combos for a given capability_type
-- We join capabilities + outcomes by type/output_type to get UUIDs.

INSERT INTO public.capability_outcomes (capability_id, outcome_id, is_default, sort_order)
SELECT
  c.id,
  o.id,
  (o.output_type = combo.default_out) AS is_default,
  combo.sort_order
FROM (VALUES
  -- (capability_type, output_type, default_out, sort_order)
  ('chat',        'text',         'text',   0),
  ('chat',        'email',        'text',   1),

  ('search',      'text',         'text',   0),
  ('search',      'table',        'text',   1),
  ('search',      'chart',        'text',   2),
  ('search',      'report',       'text',   3),

  ('reasoning',   'text',         'text',   0),
  ('reasoning',   'report',       'text',   1),
  ('reasoning',   'action_plan',  'text',   2),

  ('perspectives','text',         'text',   0),

  ('document',    'text',         'report', 0),
  ('document',    'table',        'report', 1),
  ('document',    'report',       'report', 2),
  ('document',    'presentation', 'report', 3),

  ('writing',     'text',         'text',   0),
  ('writing',     'email',        'text',   1),
  ('writing',     'report',       'text',   2),
  ('writing',     'presentation', 'text',   3),

  ('data',        'table',        'table',  0),
  ('data',        'chart',        'table',  1),
  ('data',        'report',       'table',  2),

  ('translate',   'text',         'text',   0),

  ('confidential','text',         'text',   0),
  ('confidential','report',       'text',   1),

  ('guided',      'text',         'text',   0)
) AS combo(cap_type, out_type, default_out, sort_order)
JOIN public.capabilities c ON c.capability_type = combo.cap_type AND c.scope = 'system'
JOIN public.outcomes      o ON o.output_type      = combo.out_type
ON CONFLICT (capability_id, outcome_id) DO UPDATE SET
  is_default = EXCLUDED.is_default,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- 10. Guided Workflow Tabellen (Schema — Seed folgt in Migration 041)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.guided_workflows (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scope            TEXT        NOT NULL DEFAULT 'system'
                                 CHECK (scope IN ('system','org','user')),
  organization_id  UUID        REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          UUID        REFERENCES public.users(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  subtitle         TEXT,
  trigger_keywords TEXT[],
  trigger_contexts TEXT[],
  package_id       TEXT,       -- loose ref to packages.slug; filled on package activation
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UNIQUE auf (scope, title): ermöglicht ON CONFLICT (scope, title) DO NOTHING in Seed-Migration 041
-- und verhindert doppelte System-Workflows bei Re-Runs.
ALTER TABLE public.guided_workflows
  ADD CONSTRAINT IF NOT EXISTS guided_workflows_scope_title_key UNIQUE (scope, title);

CREATE INDEX IF NOT EXISTS idx_guided_workflows_scope   ON public.guided_workflows (scope);
CREATE INDEX IF NOT EXISTS idx_guided_workflows_org_id  ON public.guided_workflows (organization_id);
CREATE INDEX IF NOT EXISTS idx_guided_workflows_active  ON public.guided_workflows (is_active);

CREATE TABLE IF NOT EXISTS public.guided_workflow_options (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id      UUID        NOT NULL REFERENCES public.guided_workflows(id) ON DELETE CASCADE,
  label            TEXT        NOT NULL,
  description      TEXT,
  emoji            TEXT,
  capability_id    UUID        REFERENCES public.capabilities(id) ON DELETE SET NULL,
  outcome_id       UUID        REFERENCES public.outcomes(id) ON DELETE SET NULL,
  next_workflow_id UUID        REFERENCES public.guided_workflows(id) ON DELETE SET NULL,
  system_prompt    TEXT,
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  is_custom        BOOLEAN     NOT NULL DEFAULT FALSE
);

-- UNIQUE auf (workflow_id, label): ermöglicht ON CONFLICT (workflow_id, label) DO NOTHING in 041.
-- Verhindert doppelte Options bei Re-Runs (UUID-PK allein würde jeden Insert als neu behandeln).
ALTER TABLE public.guided_workflow_options
  ADD CONSTRAINT IF NOT EXISTS guided_workflow_options_workflow_label_key UNIQUE (workflow_id, label);

CREATE INDEX IF NOT EXISTS idx_guided_options_workflow ON public.guided_workflow_options (workflow_id);

CREATE TABLE IF NOT EXISTS public.guided_workflow_settings (
  user_id             UUID    PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  guided_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  auto_trigger        BOOLEAN NOT NULL DEFAULT TRUE,
  new_project_trigger BOOLEAN NOT NULL DEFAULT TRUE
);

-- RLS
ALTER TABLE public.guided_workflows         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guided_workflow_options  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guided_workflow_settings ENABLE ROW LEVEL SECURITY;

-- guided_workflows: system visible to all; org to org members; user to self
DROP POLICY IF EXISTS "guided_workflows_select" ON public.guided_workflows;
CREATE POLICY "guided_workflows_select" ON public.guided_workflows
  FOR SELECT TO authenticated
  USING (
    scope = 'system'
    OR (scope = 'org' AND organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    ))
    OR (scope = 'user' AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "guided_workflows_write" ON public.guided_workflows;
CREATE POLICY "guided_workflows_write" ON public.guided_workflows
  FOR INSERT TO authenticated
  WITH CHECK (
    (scope = 'user' AND user_id = auth.uid())
    OR (scope = 'org' AND organization_id IN (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid() AND role IN ('owner','admin')
    ))
  );

DROP POLICY IF EXISTS "guided_workflows_update" ON public.guided_workflows;
CREATE POLICY "guided_workflows_update" ON public.guided_workflows
  FOR UPDATE TO authenticated
  USING (
    (scope = 'user' AND user_id = auth.uid())
    OR (scope = 'org' AND organization_id IN (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid() AND role IN ('owner','admin')
    ))
  );

-- guided_workflow_options: visible with parent workflow
DROP POLICY IF EXISTS "guided_options_select" ON public.guided_workflow_options;
CREATE POLICY "guided_options_select" ON public.guided_workflow_options
  FOR SELECT TO authenticated
  USING (
    workflow_id IN (
      SELECT id FROM public.guided_workflows
      WHERE scope = 'system'
         OR (scope = 'org' AND organization_id IN (
               SELECT organization_id FROM public.users WHERE id = auth.uid()
             ))
         OR (scope = 'user' AND user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "guided_options_write" ON public.guided_workflow_options;
CREATE POLICY "guided_options_write" ON public.guided_workflow_options
  FOR ALL TO authenticated
  USING (
    workflow_id IN (
      SELECT id FROM public.guided_workflows
      WHERE (scope = 'user' AND user_id = auth.uid())
         OR (scope = 'org' AND organization_id IN (
               SELECT organization_id FROM public.users
               WHERE id = auth.uid() AND role IN ('owner','admin')
             ))
    )
  );

-- guided_workflow_settings: own only
DROP POLICY IF EXISTS "guided_settings_own" ON public.guided_workflow_settings;
CREATE POLICY "guided_settings_own" ON public.guided_workflow_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
```

- [ ] **Step 2: Push the migration**

```bash
cd "/c/Users/timmr/tropen OS" && supabase db push
```

Expected: migration applies cleanly, no errors.

- [ ] **Step 3: Verify in Supabase Studio (or psql)**

Check that `outcomes` is gone (now `workspace_outcomes`), system `outcomes` table exists, `capabilities` has 10 rows (incl. Guided), `capability_outcomes` has 25+ rows, `model_catalog` has new columns, `guided_workflows`/`guided_workflow_options`/`guided_workflow_settings` tables exist (empty — seed kommt in Migration 041).

---

### Task 2: Cards Extension Migration

**Files:**
- Create: `supabase/migrations/20260317000040_cards_capability.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 20260317000040_cards_capability.sql
-- Add capability + outcome context to workspace cards
-- Idempotent: ADD COLUMN IF NOT EXISTS guards.

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS capability_id UUID REFERENCES public.capabilities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS outcome_id     UUID REFERENCES public.outcomes(id)      ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sources        JSONB,
  ADD COLUMN IF NOT EXISTS last_run_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_run_at    TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_cards_capability_id ON public.cards (capability_id);
CREATE INDEX IF NOT EXISTS idx_cards_outcome_id    ON public.cards (outcome_id);
CREATE INDEX IF NOT EXISTS idx_cards_next_run_at   ON public.cards (next_run_at) WHERE next_run_at IS NOT NULL;
```

- [ ] **Step 2: Push**

```bash
cd "/c/Users/timmr/tropen OS" && supabase db push
```

- [ ] **Step 3: Commit migrations**

```bash
cd "/c/Users/timmr/tropen OS"
git add supabase/migrations/20260317000039_capability_outcome_system.sql
git add supabase/migrations/20260317000040_cards_capability.sql
git commit -m "feat: add Capability + Outcome System migrations (039, 040)"
```

---

## Chunk 2: Zod Validators

### Task 3: Capability Zod Schemas

**Files:**
- Create: `src/lib/validators/capabilities.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/lib/validators/capabilities.unit.test.ts
import { resolveWorkflowInputSchema, patchSettingsInputSchema } from './capabilities'

describe('resolveWorkflowInputSchema', () => {
  it('accepts valid input', () => {
    const result = resolveWorkflowInputSchema.safeParse({
      capability_id: '00000000-0000-0000-0000-000000000001',
      outcome_id:    '00000000-0000-0000-0000-000000000002',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing capability_id', () => {
    const result = resolveWorkflowInputSchema.safeParse({ outcome_id: 'abc' })
    expect(result.success).toBe(false)
  })

  it('accepts optional conversation_id', () => {
    const result = resolveWorkflowInputSchema.safeParse({
      capability_id:   '00000000-0000-0000-0000-000000000001',
      outcome_id:      '00000000-0000-0000-0000-000000000002',
      conversation_id: '00000000-0000-0000-0000-000000000003',
    })
    expect(result.success).toBe(true)
  })
})

describe('patchSettingsInputSchema', () => {
  it('accepts partial input', () => {
    const result = patchSettingsInputSchema.safeParse({
      capability_id: '00000000-0000-0000-0000-000000000001',
      is_pinned: true,
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm test src/lib/validators/capabilities.unit.test.ts
```

Expected: Module not found error.

- [ ] **Step 3: Implement validators**

```typescript
// src/lib/validators/capabilities.ts
import { z } from 'zod'

const uuidSchema = z.string().uuid()

export const resolveWorkflowInputSchema = z.object({
  capability_id:   uuidSchema,
  outcome_id:      uuidSchema,
  conversation_id: uuidSchema.optional(),
})
export type ResolveWorkflowInput = z.infer<typeof resolveWorkflowInputSchema>

export const patchSettingsInputSchema = z.object({
  capability_id:       uuidSchema,
  selected_model_id:   uuidSchema.optional().nullable(),
  preferred_outcome_id: uuidSchema.optional().nullable(),
  is_pinned:           z.boolean().optional(),
  sort_order:          z.number().int().min(0).optional(),
})
export type PatchSettingsInput = z.infer<typeof patchSettingsInputSchema>

export const patchOrgSettingsInputSchema = z.object({
  capability_id:     uuidSchema,
  is_enabled:        z.boolean().optional(),
  allowed_model_ids: z.array(uuidSchema).optional(),
  default_model_id:  uuidSchema.optional().nullable(),
  user_can_override: z.boolean().optional(),
})
export type PatchOrgSettingsInput = z.infer<typeof patchOrgSettingsInputSchema>
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm test src/lib/validators/capabilities.unit.test.ts
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/lib/validators/capabilities.ts src/lib/validators/capabilities.unit.test.ts
git commit -m "feat: add Capability + Outcome Zod validators"
```

---

## Chunk 3: Capability Resolver

### Task 4: Resolver Business Logic

**Files:**
- Create: `src/lib/capability-resolver.ts`
- Create: `src/lib/capability-resolver.unit.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/capability-resolver.unit.test.ts
import { jest } from '@jest/globals'

// Mock supabaseAdmin before importing resolver
const mockSelect   = jest.fn()
const mockEq       = jest.fn()
const mockSingle   = jest.fn()
const mockIn       = jest.fn()
const mockOrder    = jest.fn()

jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq:     mockEq.mockReturnValue({
          single: mockSingle,
          in:     mockIn,
        }),
        in:     mockIn,
        order:  mockOrder,
      }),
    }),
  },
}))

import {
  resolveWorkflow,
  getValidOutcomes,
  getDefaultOutcome,
  resolveCardType,
} from './capability-resolver'

const CAP_ID = '00000000-0000-0000-0000-000000000001'
const OUT_ID = '00000000-0000-0000-0000-000000000002'
const USER_ID = '00000000-0000-0000-0000-000000000003'
const ORG_ID  = '00000000-0000-0000-0000-000000000004'
const MODEL_ID = '00000000-0000-0000-0000-000000000005'

const mockCapability = {
  id: CAP_ID,
  capability_type: 'search',
  label: 'Recherche',
  system_prompt_injection: 'Du bist Recherche-Experte.',
  tools: ['web_search'],
  default_model_id: MODEL_ID,
}

const mockOutcome = {
  id: OUT_ID,
  output_type: 'text',
  card_type: 'text',
  system_prompt_injection: 'Antworte als Fließtext.',
}

const mockModel = {
  id: MODEL_ID,
  name: 'claude-sonnet-4-5',
  api_model_id: 'claude-sonnet-4-20250514',
  provider: 'anthropic',
  cost_per_1k_input: 0.003,
  cost_per_1k_output: 0.015,
  context_window: 200000,
}

describe('resolveCardType', () => {
  it('returns text for text output_type', () => {
    expect(resolveCardType('text')).toBe('text')
  })
  it('returns kanban for action_plan', () => {
    expect(resolveCardType('action_plan')).toBe('kanban')
  })
  it('returns code for code', () => {
    expect(resolveCardType('code')).toBe('code')
  })
})

describe('resolveWorkflow', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    // Default: no org settings, no user settings
    mockSingle.mockResolvedValue({ data: null, error: null })
  })

  it('returns correct plan for basic capability + outcome', async () => {
    const { supabaseAdmin } = await import('@/lib/supabase-admin')
    const fromMock = supabaseAdmin.from as jest.Mock

    // Capability query
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockCapability, error: null }) }) })
    })
    // Outcome query
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockOutcome, error: null }) }) })
    })
    // Model query
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockModel, error: null }) }) })
    })
    // Org settings (null)
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) })
    })
    // User settings (null)
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) })
    })

    const plan = await resolveWorkflow(CAP_ID, OUT_ID, USER_ID, ORG_ID)
    expect(plan.model_id).toBe('claude-sonnet-4-20250514')
    expect(plan.provider).toBe('anthropic')
    expect(plan.tools).toContain('web_search')
    expect(plan.system_prompt).toContain('Du bist Recherche-Experte.')
    expect(plan.system_prompt).toContain('Antworte als Fließtext.')
    expect(plan.card_type).toBe('text')
    expect(plan.budget_ok).toBe(true)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm test src/lib/capability-resolver.unit.test.ts
```

Expected: Module not found.

- [ ] **Step 3: Implement the resolver**

```typescript
// src/lib/capability-resolver.ts
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('capability-resolver')

// card_type is statically derivable from output_type — no DB query needed
const OUTPUT_TO_CARD: Record<string, string> = {
  text:          'text',
  table:         'table',
  chart:         'chart',
  report:        'text',
  presentation:  'text',
  action_plan:   'kanban',
  email:         'text',
  code:          'code',
  score:         'text',
}

export function resolveCardType(outputType: string): string {
  return OUTPUT_TO_CARD[outputType] ?? 'text'
}

export interface WorkflowPlan {
  available:         boolean
  /** Reason if available = false. 'no_eu_model' = Confidential capability, no active EU model yet */
  unavailable_reason?: 'no_eu_model' | 'no_model_configured'
  /** The api_model_id string — what you pass to Anthropic/OpenAI SDK */
  model_id:          string
  provider:          string
  system_prompt:     string
  tools:             string[]
  card_type:         string
  /** Estimated cost per 1k output tokens in EUR */
  estimated_cost_per_1k: number
  budget_ok:         boolean
  /** Internal UUIDs for logging */
  capability_id:     string
  outcome_id:        string
  resolved_model_uuid: string
}

export async function resolveWorkflow(
  capabilityId: string,
  outcomeId:    string,
  userId:       string,
  orgId:        string,
): Promise<WorkflowPlan> {
  // 1. Load capability
  const { data: cap, error: capErr } = await supabaseAdmin
    .from('capabilities')
    .select('id, capability_type, label, system_prompt_injection, tools, default_model_id')
    .eq('id', capabilityId)
    .single()

  if (capErr || !cap) {
    log.error('capability not found', { capabilityId, capErr })
    throw new Error(`Capability not found: ${capabilityId}`)
  }

  // 2. Load outcome
  const { data: out, error: outErr } = await supabaseAdmin
    .from('outcomes')
    .select('id, output_type, card_type, system_prompt_injection')
    .eq('id', outcomeId)
    .single()

  if (outErr || !out) {
    log.error('outcome not found', { outcomeId, outErr })
    throw new Error(`Outcome not found: ${outcomeId}`)
  }

  // 3. Determine model: user pref > org override > capability default
  let resolvedModelUuid: string | null = cap.default_model_id ?? null

  // 3a. Org settings
  const { data: orgSettings } = await supabaseAdmin
    .from('capability_org_settings')
    .select('default_model_id, allowed_model_ids, user_can_override, is_enabled')
    .eq('organization_id', orgId)
    .eq('capability_id', capabilityId)
    .single()

  if (orgSettings?.default_model_id) {
    resolvedModelUuid = orgSettings.default_model_id
  }

  // 3b. User settings (only if org allows override)
  const userCanOverride = orgSettings?.user_can_override ?? true
  if (userCanOverride) {
    const { data: userSettings } = await supabaseAdmin
      .from('user_capability_settings')
      .select('selected_model_id')
      .eq('user_id', userId)
      .eq('capability_id', capabilityId)
      .single()

    if (userSettings?.selected_model_id) {
      // Validate against org allowed list if restricted
      const allowed: string[] = orgSettings?.allowed_model_ids ?? []
      if (allowed.length === 0 || allowed.includes(userSettings.selected_model_id)) {
        resolvedModelUuid = userSettings.selected_model_id
      }
    }
  }

  // 4. Load model details — graceful fallback for capabilities without active model
  // (e.g. Confidential: default_model_id = NULL until EU models are activated)
  if (!resolvedModelUuid) {
    log.warn('no model resolved — capability unavailable', { capabilityId })
    return {
      available:           false,
      unavailable_reason:  'no_eu_model' as const,
      model_id:            '',
      provider:            '',
      system_prompt:       '',
      tools:               [],
      card_type:           resolveCardType(out.output_type),
      estimated_cost_per_1k: 0,
      budget_ok:           false,
      capability_id:       capabilityId,
      outcome_id:          outcomeId,
      resolved_model_uuid: '',
    }
  }

  const { data: model, error: modelErr } = await supabaseAdmin
    .from('model_catalog')
    .select('id, name, api_model_id, provider, cost_per_1k_input, cost_per_1k_output, context_window')
    .eq('id', resolvedModelUuid)
    .single()

  if (modelErr || !model) {
    log.error('model not found', { resolvedModelUuid, modelErr })
    throw new Error(`Model not found: ${resolvedModelUuid}`)
  }

  // 5. Build combined system prompt
  const parts = [
    cap.system_prompt_injection,
    out.system_prompt_injection,
  ].filter(Boolean)
  const systemPrompt = parts.join('\n\n')

  // 6. Tools (from capability)
  const tools: string[] = Array.isArray(cap.tools) ? cap.tools : []

  // 7. Cost estimate (output costs dominate)
  const estimatedCostPer1k = model.cost_per_1k_output ?? 0

  return {
    available:             true,
    model_id:              model.api_model_id ?? model.name,
    provider:              model.provider,
    system_prompt:         systemPrompt,
    tools,
    card_type:             resolveCardType(out.output_type),
    estimated_cost_per_1k: estimatedCostPer1k,
    budget_ok:             true, // TODO(timm): wire into budget_limit check from org settings
    capability_id:         capabilityId,
    outcome_id:            outcomeId,
    resolved_model_uuid:   resolvedModelUuid,
  }
}

export async function getValidOutcomes(capabilityId: string) {
  const { data, error } = await supabaseAdmin
    .from('capability_outcomes')
    .select('outcome_id, is_default, sort_order, outcomes(id, label, icon, output_type, card_type)')
    .eq('capability_id', capabilityId)
    .order('sort_order')

  if (error) {
    log.error('getValidOutcomes failed', { capabilityId, error })
    throw new Error('Failed to load valid outcomes')
  }
  return data ?? []
}

export async function getDefaultOutcome(capabilityId: string) {
  const { data, error } = await supabaseAdmin
    .from('capability_outcomes')
    .select('outcome_id, outcomes(id, label, icon, output_type, card_type)')
    .eq('capability_id', capabilityId)
    .eq('is_default', true)
    .single()

  if (error || !data) {
    log.error('getDefaultOutcome failed', { capabilityId, error })
    return null
  }
  return data
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm test src/lib/capability-resolver.unit.test.ts
```

Expected: resolveCardType tests pass (3); resolveWorkflow test may need mock tuning — iterate until green.

- [ ] **Step 5: TypeScript check**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/lib/capability-resolver.ts src/lib/capability-resolver.unit.test.ts
git commit -m "feat: add CapabilityResolver — resolveWorkflow, getValidOutcomes, resolveCardType"
```

---

## Chunk 4: API Routes

### Task 5: GET /api/capabilities

**Files:**
- Create: `src/app/api/capabilities/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/capabilities/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/capabilities')

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!me?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // Load all system + org capabilities
  const { data: capabilities, error } = await supabaseAdmin
    .from('capabilities')
    .select(`
      id, scope, label, icon, description, capability_type,
      system_prompt_injection, tools, is_active, sort_order,
      default_model_id,
      model_catalog:default_model_id (id, label, api_model_id, provider)
    `)
    .in('scope', ['system', 'org'])
    .or(`organization_id.is.null,organization_id.eq.${me.organization_id}`)
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    log.error('capabilities query failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  // Load org settings to filter disabled capabilities
  const { data: orgSettings } = await supabaseAdmin
    .from('capability_org_settings')
    .select('capability_id, is_enabled, allowed_model_ids, default_model_id, user_can_override')
    .eq('organization_id', me.organization_id)

  const disabledIds = new Set(
    (orgSettings ?? [])
      .filter(s => !s.is_enabled)
      .map(s => s.capability_id)
  )

  // Load user settings
  const { data: userSettings } = await supabaseAdmin
    .from('user_capability_settings')
    .select('capability_id, selected_model_id, preferred_outcome_id, is_pinned, sort_order')
    .eq('user_id', user.id)

  const userSettingsMap = new Map(
    (userSettings ?? []).map(s => [s.capability_id, s])
  )

  // Load valid outcomes per capability
  const capIds = (capabilities ?? []).map(c => c.id)
  const { data: combos } = await supabaseAdmin
    .from('capability_outcomes')
    .select('capability_id, outcome_id, is_default, sort_order, outcomes(id, label, icon, output_type, card_type)')
    .in('capability_id', capIds)
    .order('sort_order')

  const combosByCapId = new Map<string, typeof combos>()
  for (const combo of combos ?? []) {
    const arr = combosByCapId.get(combo.capability_id) ?? []
    arr.push(combo)
    combosByCapId.set(combo.capability_id, arr)
  }

  const result = (capabilities ?? [])
    .filter(c => !disabledIds.has(c.id))
    .map(c => {
      const uSettings = userSettingsMap.get(c.id)
      const orgSetting = (orgSettings ?? []).find(s => s.capability_id === c.id)
      return {
        ...c,
        valid_outcomes:         combosByCapId.get(c.id) ?? [],
        user_is_pinned:         uSettings?.is_pinned ?? false,
        user_selected_model_id: uSettings?.selected_model_id ?? null,
        preferred_outcome_id:   uSettings?.preferred_outcome_id ?? null,
        org_default_model_id:   orgSetting?.default_model_id ?? null,
        user_can_override:      orgSetting?.user_can_override ?? true,
      }
    })

  return NextResponse.json(result)
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit
```

- [ ] **Step 3: Manual smoke test** (after migration is applied)

```bash
# With a valid session cookie or via Supabase API
curl http://localhost:3000/api/capabilities
# Expect: JSON array with 9 capabilities, each with valid_outcomes array
```

---

### Task 6: GET /api/capabilities/[id]/outcomes

**Files:**
- Create: `src/app/api/capabilities/[id]/outcomes/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/capabilities/[id]/outcomes/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getValidOutcomes } from '@/lib/capability-resolver'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const outcomes = await getValidOutcomes(id)
    return NextResponse.json(outcomes)
  } catch (err) {
    return NextResponse.json({ error: 'Not found or internal error' }, { status: 404 })
  }
}
```

---

### Task 7: POST /api/capabilities/resolve

**Files:**
- Create: `src/app/api/capabilities/resolve/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/capabilities/resolve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { resolveWorkflow } from '@/lib/capability-resolver'
import { resolveWorkflowInputSchema } from '@/lib/validators/capabilities'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/capabilities/resolve')

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = resolveWorkflowInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: me } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!me?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  try {
    const plan = await resolveWorkflow(
      parsed.data.capability_id,
      parsed.data.outcome_id,
      user.id,
      me.organization_id,
    )
    // Graceful unavailable (e.g. Confidential without active EU model)
    if (!plan.available) {
      return NextResponse.json(
        { error: 'capability_unavailable', reason: plan.unavailable_reason },
        { status: 422 }
      )
    }
    return NextResponse.json(plan)
  } catch (err) {
    log.error('resolveWorkflow failed', { err })
    return NextResponse.json({ error: 'Failed to resolve workflow' }, { status: 500 })
  }
}
```

---

### Task 8: PATCH /api/capabilities/settings

**Files:**
- Create: `src/app/api/capabilities/settings/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/capabilities/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { patchSettingsInputSchema } from '@/lib/validators/capabilities'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/capabilities/settings')

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = patchSettingsInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { capability_id, ...rest } = parsed.data

  const { data, error } = await supabaseAdmin
    .from('user_capability_settings')
    .upsert({
      user_id: user.id,
      capability_id,
      ...rest,
    }, { onConflict: 'user_id,capability_id' })
    .select()
    .single()

  if (error) {
    log.error('upsert user_capability_settings failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

---

### Task 9: GET + PATCH /api/capabilities/org-settings

**Files:**
- Create: `src/app/api/capabilities/org-settings/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/capabilities/org-settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { patchOrgSettingsInputSchema } from '@/lib/validators/capabilities'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/capabilities/org-settings')

async function requireOrgAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: me } = await supabaseAdmin
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!me || !['owner', 'admin'].includes(me.role)) return null
  return { user, me }
}

export async function GET() {
  const auth = await requireOrgAdmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('capability_org_settings')
    .select(`
      capability_id, is_enabled, allowed_model_ids,
      default_model_id, user_can_override,
      capabilities(id, label, icon, capability_type)
    `)
    .eq('organization_id', auth.me.organization_id)
    .order('capability_id')

  if (error) {
    log.error('org-settings query failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const auth = await requireOrgAdmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = patchOrgSettingsInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { capability_id, ...rest } = parsed.data

  const { data, error } = await supabaseAdmin
    .from('capability_org_settings')
    .upsert({
      organization_id: auth.me.organization_id,
      capability_id,
      ...rest,
    }, { onConflict: 'organization_id,capability_id' })
    .select()
    .single()

  if (error) {
    log.error('upsert org settings failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

- [ ] **Step 2: TypeScript check for all routes**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit all API routes**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/app/api/capabilities/
git add src/lib/validators/capabilities.ts
git commit -m "feat: add Capability API routes — GET list, resolve, user settings, org settings"
```

---

## Chunk 5: CLAUDE.md Update

### Task 10: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add migrations to table in CLAUDE.md**

Find the section `Letzte relevante Migrationen` and add:

```markdown
| 20260317000039_capability_outcome_system.sql | capabilities, outcomes (system), capability_outcomes, capability_org_settings, user_capability_settings; model_catalog extended; workspace outcomes renamed |
| 20260317000040_cards_capability.sql | cards: capability_id, outcome_id, sources, last_run_at, next_run_at |
```

- [ ] **Step 2: Add Capability + Outcome System section to CLAUDE.md**

Append after the migrations section:

```markdown
## Capability + Outcome System (Stand 2026-03-17)

### Konzept
Capabilities beschreiben **womit Toro arbeitet** (Recherche, Reasoning, Schreiben...).
Outcomes beschreiben **was rauskommen soll** (Text, Tabelle, Report...).
Zusammen ergeben sie einen vollständigen, vorhersehbaren Workflow-Plan.

### Key Files
| Datei | Inhalt |
|-------|--------|
| `src/lib/capability-resolver.ts` | `resolveWorkflow()`, `getValidOutcomes()`, `resolveCardType()` |
| `src/lib/validators/capabilities.ts` | Zod-Schemas für alle Capability-API-Routes |
| `src/app/api/capabilities/route.ts` | GET — alle Capabilities für den User |
| `src/app/api/capabilities/[id]/outcomes/route.ts` | GET — gültige Outcomes einer Capability |
| `src/app/api/capabilities/resolve/route.ts` | POST — Workflow-Plan auflösen (vor LLM-Call) |
| `src/app/api/capabilities/settings/route.ts` | PATCH — User-Präferenz speichern |
| `src/app/api/capabilities/org-settings/route.ts` | GET + PATCH — Org-Admin-Konfiguration |

### DB-Tabellen
| Tabelle | Zweck |
|---------|-------|
| `capabilities` | System/Org/User Capabilities (scope) |
| `outcomes` | System-Level Output-Typen (Text, Tabelle, Report...) |
| `capability_outcomes` | Gültige Kombinationen mit Default-Markierung |
| `capability_org_settings` | Org-Admin: aktivieren/deaktivieren, Modell-Einschränkungen |
| `user_capability_settings` | User-Präferenz: Modell, Pinning, bevorzugter Outcome |
| `workspace_outcomes` | Umbenannt aus `outcomes` (031) — workspace-scoped Ergebnisse |

### resolveWorkflow() — Modell-Auflösung (Priorität)
1. User-Präferenz (`user_capability_settings.selected_model_id`) — wenn `user_can_override = true`
2. Org-Default (`capability_org_settings.default_model_id`)
3. Capability-Default (`capabilities.default_model_id`)

### Wichtig
- `workspace_outcomes` (031) ≠ `outcomes` (039) — komplett verschiedene Konzepte
- Capabilities mit `scope='system'` nur via `supabaseAdmin` schreibbar (kein RLS-INSERT für authenticated)
- `card_type` auf `cards` wird automatisch aus `outcomes.card_type` befüllt via `resolveCardType()`
```

- [ ] **Step 3: Commit CLAUDE.md**

```bash
cd "/c/Users/timmr/tropen OS"
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md — Capability + Outcome System documented"
```

---

## Definition of Done Checklist

- [ ] Migration 039 deployed ohne Fehler
- [ ] `workspace_outcomes` existiert (umbenannt aus 031 `outcomes`)
- [ ] `capabilities` hat 10 System-Capabilities als Seed (incl. Guided 🧭)
- [ ] `outcomes` (system) hat 9 Einträge
- [ ] `capability_outcomes` hat 25+ gültige Kombinationen
- [ ] `guided_workflows`, `guided_workflow_options`, `guided_workflow_settings` Tabellen existieren (leer)
- [ ] `model_catalog` hat `label`, `context_window`, `is_eu_hosted`, `capabilities` Spalten
- [ ] Migration 040 deployed: `cards` hat `capability_id`, `outcome_id`, `sources`, `last_run_at`, `next_run_at`
- [ ] `resolveCardType()` Unit-Tests grün
- [ ] `resolveWorkflow()` Unit-Test grün
- [ ] `pnpm exec tsc --noEmit` sauber
- [ ] GET /api/capabilities gibt korrekte Liste zurück (9 Einträge)
- [ ] POST /api/capabilities/resolve gibt WorkflowPlan zurück
- [ ] CLAUDE.md aktualisiert
