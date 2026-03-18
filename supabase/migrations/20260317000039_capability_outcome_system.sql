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

-- Seed / upsert models (ON CONFLICT on name)
-- Note: existing rows use name as display; api_model_id was added in 038.
-- We upsert by name to avoid duplicates.

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
  -- Mistral (prepared, inactive — aktivieren wenn EU-Hosting bestätigt)
  ('mistral-small-latest','Mistral Small',       'mistral',   'fast', 0.00020, 0.00060,   32000, TRUE,  FALSE,
   '["chat","translate","confidential"]',                'mistral-small-latest'),
  ('mistral-large-latest','Mistral Large',       'mistral',   'deep', 0.00200, 0.00600,   32000, TRUE,  FALSE,
   '["chat","reasoning","document","confidential"]',     'mistral-large-latest')
ON CONFLICT (name) DO UPDATE SET
  label           = EXCLUDED.label,
  context_window  = EXCLUDED.context_window,
  is_eu_hosted    = EXCLUDED.is_eu_hosted,
  capabilities    = EXCLUDED.capabilities,
  api_model_id    = COALESCE(model_catalog.api_model_id, EXCLUDED.api_model_id);
-- Note: is_active NOT overwritten — preserves manual activation state

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
  user_id              UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability_id        UUID    NOT NULL REFERENCES public.capabilities(id) ON DELETE CASCADE,
  selected_model_id    UUID    REFERENCES public.model_catalog(id) ON DELETE SET NULL,
  preferred_outcome_id UUID    REFERENCES public.outcomes(id) ON DELETE SET NULL,
  is_pinned            BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order           INTEGER NOT NULL DEFAULT 0,
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'guided_workflows_scope_title_key'
      AND table_name = 'guided_workflows'
  ) THEN
    ALTER TABLE public.guided_workflows ADD CONSTRAINT guided_workflows_scope_title_key UNIQUE (scope, title);
  END IF;
END;
$$;

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'guided_workflow_options_workflow_label_key'
      AND table_name = 'guided_workflow_options'
  ) THEN
    ALTER TABLE public.guided_workflow_options ADD CONSTRAINT guided_workflow_options_workflow_label_key UNIQUE (workflow_id, label);
  END IF;
END;
$$;

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
