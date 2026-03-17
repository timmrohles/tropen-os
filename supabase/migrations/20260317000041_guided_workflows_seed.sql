-- 20260317000041_guided_workflows_seed.sql
-- Guided Workflow System — Seed + capability_org_settings extension
-- Prerequisite: migration 039 (tables exist, empty)

BEGIN;

-- ============================================================
-- 1. Extend capability_org_settings for guided workflow control
-- ============================================================
ALTER TABLE public.capability_org_settings
  ADD COLUMN IF NOT EXISTS guided_workflows_enabled  BOOLEAN   NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS allowed_workflow_ids       UUID[]    DEFAULT NULL; -- NULL = alle erlaubt

-- ============================================================
-- 2. Seed: System Workflows
-- ============================================================
-- Idempotent: ON CONFLICT (scope, title) DO NOTHING (UNIQUE constraint added in 039).

INSERT INTO public.guided_workflows
  (scope, title, subtitle, trigger_keywords, trigger_contexts, is_active, sort_order)
VALUES
  -- Workflow 1: Gesprächseinstieg
  ('system', 'Wie kann ich helfen?',
   NULL, NULL,
   ARRAY['explicit','new_chat'], TRUE, 0),

  -- Workflow 2: Entscheidung treffen
  ('system', 'Wie sollen wir die Entscheidung angehen?',
   NULL, ARRAY['entscheidung','entscheide','vergleiche','besser','oder','variante','option'],
   ARRAY['new_chat'], TRUE, 1),

  -- Workflow 2a: Optionen strukturieren (nur via next_workflow_id erreichbar)
  ('system', 'Wie viele Optionen hast du?',
   NULL, NULL,
   ARRAY[]::TEXT[], TRUE, 2),

  -- Workflow 2b: Entscheidungsmatrix (nur via next_workflow_id erreichbar)
  ('system', 'Was sind deine wichtigsten Kriterien?',
   'Wähle bis zu 3', NULL,
   ARRAY[]::TEXT[], TRUE, 3),

  -- Workflow 3: Unsicherheit
  ('system', 'Kein Problem – wo stehst du gerade?',
   NULL, ARRAY['weiß nicht','keine ahnung','wo anfangen','überfordert','unklar','hilf mir'],
   ARRAY['new_chat'], TRUE, 4),

  -- Workflow 4: Neues Projekt
  ('system', 'Neues Projekt – womit fangen wir an?',
   NULL, NULL,
   ARRAY['new_project'], TRUE, 5),

  -- Workflow 5: Recherche vertiefen
  ('system', 'Recherche abgeschlossen – was als nächstes?',
   'Toro hat Informationen gefunden', NULL,
   ARRAY['after_search'], TRUE, 6)

ON CONFLICT (scope, title) DO NOTHING;

-- ============================================================
-- 3. Seed: Options per Workflow
-- ============================================================

-- ── Options: Workflow 1 (Gesprächseinstieg) ──────────────────
INSERT INTO public.guided_workflow_options
  (workflow_id, label, description, emoji, capability_id, outcome_id, sort_order, is_custom)
SELECT
  w.id,
  o.label,
  o.description,
  o.emoji,
  (SELECT id FROM public.capabilities WHERE capability_type = o.cap_type AND scope = 'system' LIMIT 1),
  (SELECT id FROM public.outcomes WHERE output_type = o.out_type LIMIT 1),
  o.sort_order,
  o.is_custom
FROM (SELECT id FROM public.guided_workflows WHERE title = 'Wie kann ich helfen?' AND scope = 'system' LIMIT 1) w,
(VALUES
  ('Etwas erarbeiten',    'Analyse, Entscheidung, Konzept entwickeln',           '🧠', 'reasoning',    'text',  0, FALSE),
  ('Etwas recherchieren', 'Aktuelle Infos, Fakten, Zahlen finden',               '🌐', 'search',       'text',  1, FALSE),
  ('Etwas schreiben',     'Text, E-Mail, Bericht formulieren',                   '✍️', 'writing',      'text',  2, FALSE),
  ('Daten auswerten',     'Zahlen, Tabellen, Grafiken erstellen',                '🔢', 'data',         'table', 3, FALSE),
  ('Zweite Meinung',      'Kritiker, Stratege oder Optimist befragen',           '👁', 'perspectives', 'text',  4, FALSE),
  ('Einfach loschatten',  'Kein geführter Weg – direkt antworten',              '💬', 'chat',         'text',  5, TRUE)
) AS o(label, description, emoji, cap_type, out_type, sort_order, is_custom)
ON CONFLICT (workflow_id, label) DO NOTHING;

-- ── Options: Workflow 2 (Entscheidung treffen) ───────────────
INSERT INTO public.guided_workflow_options
  (workflow_id, label, description, emoji, next_workflow_id, capability_id, outcome_id, sort_order, is_custom)
SELECT
  w.id,
  o.label,
  o.description,
  o.emoji,
  CASE o.label
    WHEN 'Optionen strukturieren' THEN (SELECT id FROM public.guided_workflows WHERE title = 'Wie viele Optionen hast du?' AND scope='system' LIMIT 1)
    WHEN 'Entscheidungsmatrix'    THEN (SELECT id FROM public.guided_workflows WHERE title = 'Was sind deine wichtigsten Kriterien?' AND scope='system' LIMIT 1)
    ELSE NULL
  END,
  CASE WHEN o.cap_type IS NOT NULL THEN (SELECT id FROM public.capabilities WHERE capability_type = o.cap_type AND scope='system' LIMIT 1) ELSE NULL END,
  CASE WHEN o.out_type IS NOT NULL THEN (SELECT id FROM public.outcomes WHERE output_type = o.out_type LIMIT 1) ELSE NULL END,
  o.sort_order,
  o.is_custom
FROM (SELECT id FROM public.guided_workflows WHERE title = 'Wie sollen wir die Entscheidung angehen?' AND scope='system' LIMIT 1) w,
(VALUES
  ('Optionen strukturieren', 'Alle Varianten sauber auflisten',            '📋', NULL,          NULL,   0, FALSE),
  ('Entscheidungsmatrix',    'Optionen nach Kriterien bewerten',           '⚖️', NULL,          NULL,   1, FALSE),
  ('Perspektiven einholen',  'Kritiker + Stratege parallel befragen',      '👁', 'perspectives','text', 2, FALSE),
  ('Einfach besprechen',     'Kein geführter Weg',                        '💬', 'chat',        'text', 3, TRUE)
) AS o(label, description, emoji, cap_type, out_type, sort_order, is_custom)
ON CONFLICT (workflow_id, label) DO NOTHING;

-- ── Options: Workflow 2a (Optionen strukturieren) ────────────
INSERT INTO public.guided_workflow_options
  (workflow_id, label, description, emoji, capability_id, outcome_id, system_prompt, sort_order, is_custom)
SELECT
  w.id,
  o.label,
  o.description,
  o.emoji,
  (SELECT id FROM public.capabilities WHERE capability_type='reasoning' AND scope='system' LIMIT 1),
  (SELECT id FROM public.outcomes WHERE output_type='table' LIMIT 1),
  o.system_prompt,
  o.sort_order,
  FALSE
FROM (SELECT id FROM public.guided_workflows WHERE title = 'Wie viele Optionen hast du?' AND scope='system' LIMIT 1) w,
(VALUES
  ('2 Optionen',    'Direkter Pro/Contra-Vergleich',          '2️⃣',
   'Strukturiere genau 2 Optionen als Pro/Contra-Vergleich. Ausgabe als Tabelle.', 0),
  ('3–5 Optionen',  'Übersichtlicher Mehrfach-Vergleich',     '📊',
   'Strukturiere 3–5 Optionen übersichtlich. Ausgabe als Tabelle.', 1),
  ('Mehr als 5',    'Erst priorisieren, dann vergleichen',    '🎯',
   'Priorisiere zuerst auf die 3 wichtigsten Optionen, dann strukturieren. Ausgabe als Tabelle.', 2)
) AS o(label, description, emoji, system_prompt, sort_order)
ON CONFLICT (workflow_id, label) DO NOTHING;

-- ── Options: Workflow 2b (Entscheidungsmatrix) ───────────────
INSERT INTO public.guided_workflow_options
  (workflow_id, label, description, emoji, capability_id, outcome_id, sort_order, is_custom)
SELECT
  w.id,
  o.label,
  o.description,
  o.emoji,
  (SELECT id FROM public.capabilities WHERE capability_type='reasoning' AND scope='system' LIMIT 1),
  (SELECT id FROM public.outcomes WHERE output_type='table' LIMIT 1),
  o.sort_order,
  o.is_custom
FROM (SELECT id FROM public.guided_workflows WHERE title = 'Was sind deine wichtigsten Kriterien?' AND scope='system' LIMIT 1) w,
(VALUES
  ('Kosten',            'Monetärer Aufwand und Budget',       '💰', 0, FALSE),
  ('Zeit',              'Zeitaufwand und Deadlines',          '⏱️', 1, FALSE),
  ('Risiko',            'Unsicherheit und Abhängigkeiten',    '⚠️', 2, FALSE),
  ('Qualität',          'Ergebnisqualität und Standards',     '✨', 3, FALSE),
  ('Strat. Passung',    'Strategische Ausrichtung',           '🎯', 4, FALSE),
  ('Eigene Kriterien',  'Deine spezifischen Kriterien',       '✏️', 5, TRUE)
) AS o(label, description, emoji, sort_order, is_custom)
ON CONFLICT (workflow_id, label) DO NOTHING;

-- ── Options: Workflow 3 (Unsicherheit) ───────────────────────
INSERT INTO public.guided_workflow_options
  (workflow_id, label, description, emoji, next_workflow_id, capability_id, outcome_id, sort_order, is_custom)
SELECT
  w.id,
  o.label,
  o.description,
  o.emoji,
  CASE o.label
    WHEN 'Ich habe eine vage Idee' THEN (SELECT id FROM public.guided_workflows WHERE title='Wie kann ich helfen?' AND scope='system' LIMIT 1)
    ELSE NULL
  END,
  CASE WHEN o.cap_type IS NOT NULL THEN (SELECT id FROM public.capabilities WHERE capability_type=o.cap_type AND scope='system' LIMIT 1) ELSE NULL END,
  CASE WHEN o.out_type IS NOT NULL THEN (SELECT id FROM public.outcomes WHERE output_type=o.out_type LIMIT 1) ELSE NULL END,
  o.sort_order,
  o.is_custom
FROM (SELECT id FROM public.guided_workflows WHERE title = 'Kein Problem – wo stehst du gerade?' AND scope='system' LIMIT 1) w,
(VALUES
  ('Ich habe eine vage Idee',    'Toro hilft sie zu konkretisieren',     '💡', NULL,       NULL,          0, FALSE),
  ('Ich habe ein Problem',       'Toro hilft es zu strukturieren',       '🔧', 'reasoning','action_plan', 1, FALSE),
  ('Ich habe Informationen',     'Toro hilft sie auszuwerten',           '📄', 'document', 'report',      2, FALSE),
  ('Ich weiß wirklich nicht',    'Einfach erzählen – Toro hört zu',      '💬', 'chat',     'text',        3, TRUE)
) AS o(label, description, emoji, cap_type, out_type, sort_order, is_custom)
ON CONFLICT (workflow_id, label) DO NOTHING;

-- ── Options: Workflow 4 (Neues Projekt) ──────────────────────
INSERT INTO public.guided_workflow_options
  (workflow_id, label, description, emoji, next_workflow_id, capability_id, outcome_id, sort_order, is_custom)
SELECT
  w.id,
  o.label,
  o.description,
  o.emoji,
  CASE o.label
    WHEN 'Projekt strukturieren' THEN (SELECT id FROM public.guided_workflows WHERE title='Wie kann ich helfen?' AND scope='system' LIMIT 1)
    ELSE NULL
  END,
  CASE WHEN o.cap_type IS NOT NULL THEN (SELECT id FROM public.capabilities WHERE capability_type=o.cap_type AND scope='system' LIMIT 1) ELSE NULL END,
  CASE WHEN o.out_type IS NOT NULL THEN (SELECT id FROM public.outcomes WHERE output_type=o.out_type LIMIT 1) ELSE NULL END,
  o.sort_order,
  o.is_custom
FROM (SELECT id FROM public.guided_workflows WHERE title = 'Neues Projekt – womit fangen wir an?' AND scope='system' LIMIT 1) w,
(VALUES
  ('Projekt strukturieren',  'Ziele, Kontext und Wissenbasis aufbauen', '🗂️', NULL,       NULL,   0, FALSE),
  ('Wissensbasis befüllen',  'Dokumente hochladen und einlesen',        '📚', 'document', 'text', 1, FALSE),
  ('Einfach loschatten',     'Später strukturieren',                   '💬', 'chat',     'text', 2, TRUE)
) AS o(label, description, emoji, cap_type, out_type, sort_order, is_custom)
ON CONFLICT (workflow_id, label) DO NOTHING;

-- ── Options: Workflow 5 (Recherche vertiefen) ────────────────
INSERT INTO public.guided_workflow_options
  (workflow_id, label, description, emoji, capability_id, outcome_id, sort_order, is_custom)
SELECT
  w.id,
  o.label,
  o.description,
  o.emoji,
  CASE WHEN o.cap_type IS NOT NULL THEN (SELECT id FROM public.capabilities WHERE capability_type=o.cap_type AND scope='system' LIMIT 1) ELSE NULL END,
  CASE WHEN o.out_type IS NOT NULL THEN (SELECT id FROM public.outcomes WHERE output_type=o.out_type LIMIT 1) ELSE NULL END,
  o.sort_order,
  o.is_custom
FROM (SELECT id FROM public.guided_workflows WHERE title = 'Recherche abgeschlossen – was als nächstes?' AND scope='system' LIMIT 1) w,
(VALUES
  ('Report erstellen',         'Zusammenfassung als Bericht',   '📄', 'writing', 'report', 0, FALSE),
  ('Als Tabelle strukturieren','Daten tabellarisch ordnen',     '📋', 'data',    'table',  1, FALSE),
  ('Grafik erstellen',         'Daten visualisieren',           '📊', 'data',    'chart',  2, FALSE),
  ('In Wissenbasis speichern', 'Artefakt direkt speichern',     '💾', NULL,      NULL,     3, FALSE),
  ('Fertig',                   'Keine weitere Verarbeitung',    '✅', 'chat',    'text',   4, TRUE)
) AS o(label, description, emoji, cap_type, out_type, sort_order, is_custom)
ON CONFLICT (workflow_id, label) DO NOTHING;

-- ============================================================
-- 4. Seed: Marketing-Paket-Workflow (package_id: 'marketing')
-- ============================================================
INSERT INTO public.guided_workflows
  (scope, title, subtitle, trigger_keywords, trigger_contexts, package_id, is_active, sort_order)
VALUES (
  'system',
  'Kampagne planen',
  'Marketing-Paket',
  ARRAY['kampagne','campaign','marketing','launch'],
  ARRAY['new_chat'],
  'marketing',
  TRUE, 10
)
ON CONFLICT (scope, title) DO NOTHING;

INSERT INTO public.guided_workflow_options
  (workflow_id, label, description, emoji, capability_id, outcome_id, sort_order, is_custom)
SELECT
  w.id,
  o.label,
  o.description,
  o.emoji,
  (SELECT id FROM public.capabilities WHERE capability_type='reasoning' AND scope='system' LIMIT 1),
  (SELECT id FROM public.outcomes WHERE output_type='text' LIMIT 1),
  o.sort_order,
  o.is_custom
FROM (SELECT id FROM public.guided_workflows WHERE title='Kampagne planen' AND scope='system' LIMIT 1) w,
(VALUES
  ('Kampagnen-Briefing erstellen', 'Campaign Planner Agent aktivieren',  '🎯', 0, FALSE),
  ('Zielgruppe definieren',        'Brand Voice Writer Agent aktivieren', '👥', 1, FALSE),
  ('Kanäle auswählen',             'Social Adapter Agent aktivieren',    '📱', 2, FALSE),
  ('Einfach besprechen',           'Keine geführte Route',              '💬', 3, TRUE)
) AS o(label, description, emoji, sort_order, is_custom)
ON CONFLICT (workflow_id, label) DO NOTHING;

-- ============================================================
-- 5. Seed-Assertion
-- ============================================================
DO $$
DECLARE
  wf_count  INTEGER;
  opt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO wf_count
  FROM public.guided_workflows
  WHERE scope = 'system';

  SELECT COUNT(*) INTO opt_count
  FROM public.guided_workflow_options gwo
  JOIN public.guided_workflows gw ON gwo.workflow_id = gw.id
  WHERE gw.scope = 'system';

  ASSERT wf_count >= 7,
    format('guided_workflows seed incomplete: expected >=7 system workflows, got %s', wf_count);

  ASSERT opt_count >= 30,
    format('guided_workflow_options seed incomplete: expected >=30 system options, got %s', opt_count);
END;
$$;

COMMIT;
