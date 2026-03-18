# Guided Workflows — Implementation Plan (Prompt 1b)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Guided Workflows — structured decision paths where Toro offers options and the user steers. No UI. DB schema, seed data, trigger engine, and API routes only.

**Prerequisite:** Plan 1 (Migration 039) must be deployed. Tables `guided_workflows`, `guided_workflow_options`, `guided_workflow_settings`, `capabilities` (incl. Guided 🧭), and `capability_org_settings` must exist.

**Architecture:** One seed migration (041), one pure TypeScript trigger/resolver engine (no LLM calls), six API routes. Workflows are max 3 levels deep. Every workflow always has an `is_custom: true` escape option.

**Tech Stack:** Supabase (supabaseAdmin), Zod, Next.js App Router, TypeScript strict mode, unit tests.

---

## Pre-flight: Ist-Zustand prüfen

Before writing any file:

- [ ] Verify `guided_workflows` table exists (from migration 039)
- [ ] Verify `guided_workflow_options` table exists
- [ ] Verify `guided_workflow_settings` table exists
- [ ] Verify `capabilities` has a row with `capability_type = 'guided'`
- [ ] Check `prompt_templates` for overlap (none expected — different concept)
- [ ] Check `capability_org_settings` columns — needs `guided_workflows_enabled` + `allowed_workflow_ids` added

---

## Conflict Analysis

| Item | Status | Decision |
|------|--------|----------|
| `guided_workflows` table | Created in 039, empty | Seed in 041 |
| `capability_org_settings` missing guided columns | Needs ALTER | Add in 041 |
| `prompt_templates` | Different concept — no overlap | No action |
| Migration number | 039+040 used | Use `20260317000041_guided_workflows_seed.sql` |

---

## File Map

### New Files
| Path | Responsibility |
|------|---------------|
| `supabase/migrations/20260317000041_guided_workflows_seed.sql` | Extend capability_org_settings + seed 5 system workflows + Marketing-Paket workflow |
| `src/lib/guided-workflow-engine.ts` | detectWorkflow(), resolveOption(), buildWorkflowPrompt() — no LLM, pure TS |
| `src/lib/guided-workflow-engine.unit.test.ts` | Unit tests for keyword detection + option resolution |
| `src/lib/validators/guided.ts` | Zod schemas for all guided API routes |
| `src/app/api/guided/detect/route.ts` | POST /api/guided/detect |
| `src/app/api/guided/workflows/route.ts` | GET + POST /api/guided/workflows |
| `src/app/api/guided/workflows/[id]/route.ts` | PATCH /api/guided/workflows/[id] |
| `src/app/api/guided/workflows/[id]/copy/route.ts` | POST /api/guided/workflows/[id]/copy |
| `src/app/api/guided/settings/route.ts` | PATCH /api/guided/settings |
| `src/app/api/guided/resolve/route.ts` | POST /api/guided/resolve |

### Modified Files
| Path | Change |
|------|--------|
| `CLAUDE.md` | Add guided workflow system to migrations + system description |

---

## Chunk 1: Migration — Seed + Schema Extension

### Task 1: Migration 041 — capability_org_settings extension + system workflow seed

**Files:**
- Create: `supabase/migrations/20260317000041_guided_workflows_seed.sql`

- [ ] **Step 1: Write the migration**

```sql
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
-- 2. Helper function: get capability UUID by type
-- ============================================================
-- Used inline via subqueries in seed below

-- ============================================================
-- 3. Seed: System Workflows
-- ============================================================
-- Idempotent: ON CONFLICT (scope, title) DO NOTHING (UNIQUE constraint added in 039).
-- Plain INSERTs — no CTE chain. Options inserts use title-lookup from these rows.

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
-- 4. Seed: Options per Workflow
-- ============================================================
-- We look up workflow IDs by title (stable, system-scoped, unique enough)
-- and capability IDs by capability_type.

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
-- 5. Seed: Marketing-Paket-Workflow (package_id: 'marketing')
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
-- 6. Seed-Assertion (Critical Issue 3 Fix)
-- ============================================================
-- Schlägt fehl wenn Workflows oder Options nicht korrekt geseedet wurden.
-- Verhindert stille 0-Row-Inserts durch fehlgeschlagene Title-Lookups.
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
    format('guided_workflows seed incomplete: expected ≥7 system workflows, got %s', wf_count);

  ASSERT opt_count >= 30,
    format('guided_workflow_options seed incomplete: expected ≥30 system options, got %s', opt_count);
END;
$$;

COMMIT;
```

- [ ] **Step 2: Push the migration**

```bash
cd "/c/Users/timmr/tropen OS" && supabase db push
```

Expected: no errors.

- [ ] **Step 3: Verify**

Check: 6 workflows seeded (5 system + 1 marketing-paket), options per workflow correct, `capability_org_settings` has new columns.

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add supabase/migrations/20260317000041_guided_workflows_seed.sql
git commit -m "feat: seed guided workflows system (5 system + marketing-paket)"
```

---

## Chunk 2: Zod Validators + Types

### Task 2: Guided Zod Schemas

**Files:**
- Create: `src/lib/validators/guided.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/lib/validators/guided.unit.test.ts
import { detectInputSchema, resolveInputSchema, patchGuidedSettingsSchema } from './guided'

describe('detectInputSchema', () => {
  it('accepts valid new_chat context', () => {
    const r = detectInputSchema.safeParse({
      message: 'Ich weiß nicht wo ich anfangen soll',
      context: 'new_chat',
      userId: '00000000-0000-0000-0000-000000000001',
    })
    expect(r.success).toBe(true)
  })

  it('rejects short message', () => {
    const r = detectInputSchema.safeParse({
      message: 'hi',
      context: 'new_chat',
      userId: '00000000-0000-0000-0000-000000000001',
    })
    expect(r.success).toBe(false)
  })
})

describe('resolveInputSchema', () => {
  it('accepts valid input', () => {
    const r = resolveInputSchema.safeParse({
      workflowId: '00000000-0000-0000-0000-000000000001',
      optionId:   '00000000-0000-0000-0000-000000000002',
    })
    expect(r.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm test src/lib/validators/guided.unit.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// src/lib/validators/guided.ts
import { z } from 'zod'

const uuid = z.string().uuid()

export const WorkflowContext = z.enum([
  'new_chat',
  'new_project',
  'after_search',
  'explicit',
])
export type WorkflowContextType = z.infer<typeof WorkflowContext>

export const detectInputSchema = z.object({
  message:        z.string().min(10),
  context:        WorkflowContext,
  userId:         uuid,
  projectId:      uuid.optional(),
  conversationId: uuid.optional(),
})
export type DetectInput = z.infer<typeof detectInputSchema>

export const resolveInputSchema = z.object({
  workflowId:         uuid,
  optionId:           uuid,
  previousSelections: z.array(uuid).optional().default([]),
  conversationId:     uuid.optional(),
})
export type ResolveInput = z.infer<typeof resolveInputSchema>

export const patchGuidedSettingsSchema = z.object({
  guided_enabled:      z.boolean().optional(),
  auto_trigger:        z.boolean().optional(),
  new_project_trigger: z.boolean().optional(),
})
export type PatchGuidedSettings = z.infer<typeof patchGuidedSettingsSchema>

export const createWorkflowSchema = z.object({
  title:            z.string().min(1).max(200),
  subtitle:         z.string().max(200).optional(),
  trigger_keywords: z.array(z.string()).optional(),
  trigger_contexts: z.array(WorkflowContext).optional(),
  is_active:        z.boolean().optional().default(true),
  sort_order:       z.number().int().min(0).optional().default(0),
})
export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>

export const patchWorkflowSchema = createWorkflowSchema.partial()
export type PatchWorkflowInput = z.infer<typeof patchWorkflowSchema>
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm test src/lib/validators/guided.unit.test.ts
```

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/lib/validators/guided.ts src/lib/validators/guided.unit.test.ts
git commit -m "feat: add Guided Workflow Zod validators"
```

---

## Chunk 3: Guided Workflow Engine

### Task 3: Trigger Detection + Option Resolver

**Files:**
- Create: `src/lib/guided-workflow-engine.ts`
- Create: `src/lib/guided-workflow-engine.unit.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/guided-workflow-engine.unit.test.ts
import { jest } from '@jest/globals'

// Mock supabaseAdmin
jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: jest.fn() },
}))

import {
  scoreKeywords,
  detectWorkflow,
  buildWorkflowPrompt,
} from './guided-workflow-engine'

describe('scoreKeywords', () => {
  it('returns 0 for no match', () => {
    expect(scoreKeywords('Hallo Welt', ['entscheidung'])).toBe(0)
  })

  it('returns positive score for exact match', () => {
    expect(scoreKeywords('Ich muss eine Entscheidung treffen', ['entscheidung'])).toBeGreaterThan(0)
  })

  it('is case-insensitive', () => {
    expect(scoreKeywords('ENTSCHEIDUNG', ['entscheidung'])).toBeGreaterThan(0)
  })

  it('scores higher for multiple keyword matches', () => {
    const score1 = scoreKeywords('ich muss entscheide', ['entscheidung','entscheide'])
    const score2 = scoreKeywords('ich entscheide', ['entscheidung','entscheide'])
    expect(score1).toBeGreaterThanOrEqual(score2)
  })
})

describe('buildWorkflowPrompt', () => {
  it('combines workflow + capability + outcome injections', () => {
    const result = buildWorkflowPrompt({
      workflowSystemPrompt: 'Workflow: Analyse.',
      capabilityInjection:  'Du bist Analyst.',
      outcomeInjection:     'Ausgabe als Tabelle.',
      previousSelections:   [],
    })
    expect(result).toContain('Workflow: Analyse.')
    expect(result).toContain('Du bist Analyst.')
    expect(result).toContain('Ausgabe als Tabelle.')
  })

  it('includes previous selections context', () => {
    const result = buildWorkflowPrompt({
      workflowSystemPrompt: 'X',
      capabilityInjection:  'Y',
      outcomeInjection:     'Z',
      previousSelections:   ['Kosten', 'Zeit'],
    })
    expect(result).toContain('Kosten')
    expect(result).toContain('Zeit')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm test src/lib/guided-workflow-engine.unit.test.ts
```

- [ ] **Step 3: Implement the engine**

```typescript
// src/lib/guided-workflow-engine.ts
import { supabaseAdmin } from '@/lib/supabase-admin'
import { resolveWorkflow } from '@/lib/capability-resolver'
import { createLogger } from '@/lib/logger'
import type { WorkflowContextType } from '@/lib/validators/guided'

const log = createLogger('guided-workflow-engine')

// ── Pure helpers (no DB, no LLM) ─────────────────────────────────────────────

/**
 * Score how well a message matches a keyword list.
 * Returns 0 if no match. Higher = better.
 * No LLM, no regex complexity — just case-insensitive substring matching.
 */
export function scoreKeywords(message: string, keywords: string[]): number {
  if (!keywords.length) return 0
  const lower = message.toLowerCase()
  return keywords.reduce((score, kw) => {
    return lower.includes(kw.toLowerCase()) ? score + 1 : score
  }, 0)
}

export interface WorkflowPromptInput {
  workflowSystemPrompt: string | null
  capabilityInjection:  string | null
  outcomeInjection:     string | null
  previousSelections:   string[]
}

/**
 * Build the combined system prompt from workflow + capability + outcome injections.
 * Called after the user completes all workflow steps.
 */
export function buildWorkflowPrompt(input: WorkflowPromptInput): string {
  const parts: string[] = []

  if (input.capabilityInjection)  parts.push(input.capabilityInjection)
  if (input.workflowSystemPrompt) parts.push(input.workflowSystemPrompt)
  if (input.outcomeInjection)     parts.push(input.outcomeInjection)

  if (input.previousSelections.length > 0) {
    parts.push(
      `Kontext aus Benutzerauswahl: ${input.previousSelections.join(', ')}.`
    )
  }

  return parts.join('\n\n')
}

// ── DB-backed detection ───────────────────────────────────────────────────────

export interface WorkflowDetectionInput {
  message:        string
  context:        WorkflowContextType
  userId:         string
  projectId?:     string
  conversationId?: string
}

export interface GuidedWorkflow {
  id:               string
  title:            string
  subtitle:         string | null
  trigger_contexts: string[]
  options:          GuidedWorkflowOption[]
}

export interface GuidedWorkflowOption {
  id:              string
  label:           string
  description:     string | null
  emoji:           string | null
  capability_id:   string | null
  outcome_id:      string | null
  next_workflow_id: string | null
  system_prompt:   string | null
  sort_order:      number
  is_custom:       boolean
}

/**
 * Detect which guided workflow (if any) should be shown for this input.
 * No LLM calls — pure keyword matching + context rules.
 * Returns null if:
 *   - user has guided_enabled = false
 *   - no workflow matches
 *   - message is too short (< 10 chars, enforced by caller/Zod)
 */
export async function detectWorkflow(
  input: WorkflowDetectionInput
): Promise<GuidedWorkflow | null> {
  // 1. Check user settings
  const { data: settings } = await supabaseAdmin
    .from('guided_workflow_settings')
    .select('guided_enabled, auto_trigger, new_project_trigger')
    .eq('user_id', input.userId)
    .single()

  if (settings?.guided_enabled === false) return null
  if (input.context === 'new_project' && settings?.new_project_trigger === false) return null
  if (input.context !== 'explicit' && settings?.auto_trigger === false) return null

  // 2. Load candidate workflows (system + org for this user)
  const { data: workflows, error } = await supabaseAdmin
    .from('guided_workflows')
    .select('id, title, subtitle, trigger_keywords, trigger_contexts, scope, is_active')
    .eq('is_active', true)
    .in('scope', ['system', 'org'])
    .order('sort_order')

  if (error || !workflows?.length) return null

  // 3. Find best match
  let bestWorkflow: typeof workflows[0] | null = null
  let bestScore = -1

  for (const wf of workflows) {
    const contexts: string[] = wf.trigger_contexts ?? []
    if (!contexts.includes(input.context)) continue

    // explicit context → always return Workflow 1 (Gesprächseinstieg)
    if (input.context === 'explicit') {
      bestWorkflow = wf
      break
    }

    // context-only triggers (new_project, after_search) → first match wins
    if (['new_project', 'after_search'].includes(input.context)) {
      bestWorkflow = wf
      break
    }

    // new_chat → keyword scoring
    const keywords: string[] = wf.trigger_keywords ?? []
    if (keywords.length === 0) {
      // no-keyword workflow = fallback, low priority
      if (bestScore < 0) {
        bestWorkflow = wf
        bestScore = 0
      }
      continue
    }

    const score = scoreKeywords(input.message, keywords)
    if (score > bestScore) {
      bestScore = score
      bestWorkflow = wf
    }
  }

  if (!bestWorkflow) return null

  // 4. Load options for matched workflow
  const { data: options } = await supabaseAdmin
    .from('guided_workflow_options')
    .select('id, label, description, emoji, capability_id, outcome_id, next_workflow_id, system_prompt, sort_order, is_custom')
    .eq('workflow_id', bestWorkflow.id)
    .order('sort_order')

  return {
    id:               bestWorkflow.id,
    title:            bestWorkflow.title,
    subtitle:         bestWorkflow.subtitle ?? null,
    trigger_contexts: bestWorkflow.trigger_contexts ?? [],
    options:          options ?? [],
  }
}

// ── Option Resolution ─────────────────────────────────────────────────────────

export type ResolveOptionResult =
  | { type: 'next_workflow'; workflow: GuidedWorkflow }
  | { type: 'capability_plan'; plan: Awaited<ReturnType<typeof resolveWorkflow>> }
  | { type: 'custom_input' }
  | { type: 'save_artifact' }

/**
 * Resolve what happens when user picks an option.
 * - next_workflow_id → load next workflow
 * - capability_id + outcome_id → call capability resolver
 * - is_custom → return custom_input signal
 * - special label "In Wissenbasis speichern" → save_artifact
 */
export async function resolveOption(
  workflowId: string,
  optionId:   string,
  userId:     string,
  orgId:      string,
): Promise<ResolveOptionResult> {
  const { data: option, error } = await supabaseAdmin
    .from('guided_workflow_options')
    .select('*')
    .eq('id', optionId)
    .eq('workflow_id', workflowId)
    .single()

  if (error || !option) {
    log.error('option not found', { workflowId, optionId })
    throw new Error('Option not found')
  }

  if (option.is_custom) return { type: 'custom_input' }

  // Special: artifact save action
  if (option.label === 'In Wissenbasis speichern') return { type: 'save_artifact' }

  if (option.next_workflow_id) {
    const { data: nextWf } = await supabaseAdmin
      .from('guided_workflows')
      .select('id, title, subtitle, trigger_contexts')
      .eq('id', option.next_workflow_id)
      .single()

    if (!nextWf) throw new Error('Next workflow not found')

    const { data: nextOptions } = await supabaseAdmin
      .from('guided_workflow_options')
      .select('id, label, description, emoji, capability_id, outcome_id, next_workflow_id, system_prompt, sort_order, is_custom')
      .eq('workflow_id', nextWf.id)
      .order('sort_order')

    return {
      type: 'next_workflow',
      workflow: {
        id:               nextWf.id,
        title:            nextWf.title,
        subtitle:         nextWf.subtitle ?? null,
        trigger_contexts: nextWf.trigger_contexts ?? [],
        options:          nextOptions ?? [],
      },
    }
  }

  if (option.capability_id && option.outcome_id) {
    const plan = await resolveWorkflow(
      option.capability_id,
      option.outcome_id,
      userId,
      orgId,
    )
    // Merge option-specific system_prompt into plan
    if (option.system_prompt) {
      plan.system_prompt = [option.system_prompt, plan.system_prompt]
        .filter(Boolean)
        .join('\n\n')
    }
    return { type: 'capability_plan', plan }
  }

  // Fallback
  return { type: 'custom_input' }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm test src/lib/guided-workflow-engine.unit.test.ts
```

Expected: scoreKeywords (4 tests) + buildWorkflowPrompt (2 tests) all pass.

- [ ] **Step 5: TypeScript check**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/lib/guided-workflow-engine.ts src/lib/guided-workflow-engine.unit.test.ts
git commit -m "feat: add GuidedWorkflowEngine — detectWorkflow, resolveOption, buildWorkflowPrompt"
```

---

## Chunk 4: API Routes

### Task 4: POST /api/guided/detect

**Files:**
- Create: `src/app/api/guided/detect/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/guided/detect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { detectWorkflow } from '@/lib/guided-workflow-engine'
import { detectInputSchema } from '@/lib/validators/guided'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/guided/detect')

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = detectInputSchema.safeParse({ ...body, userId: user.id })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const workflow = await detectWorkflow(parsed.data)
    // null = no workflow triggered (normal — caller just shows empty chat)
    return NextResponse.json({ workflow })
  } catch (err) {
    log.error('detect failed', { err })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

### Task 5: GET + POST /api/guided/workflows

**Files:**
- Create: `src/app/api/guided/workflows/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/guided/workflows/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createWorkflowSchema } from '@/lib/validators/guided'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/guided/workflows')

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const { data: workflows, error } = await supabaseAdmin
    .from('guided_workflows')
    .select(`
      id, scope, title, subtitle, trigger_keywords, trigger_contexts,
      package_id, is_active, sort_order,
      guided_workflow_options (
        id, label, description, emoji, capability_id, outcome_id,
        next_workflow_id, system_prompt, sort_order, is_custom
      )
    `)
    .or(
      `scope.eq.system,and(scope.eq.org,organization_id.eq.${me?.organization_id}),and(scope.eq.user,user_id.eq.${user.id})`
    )
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    log.error('workflows query failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(workflows ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createWorkflowSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('guided_workflows')
    .insert({
      ...parsed.data,
      scope:   'user',
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    log.error('create workflow failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

---

### Task 6: PATCH + copy /api/guided/workflows/[id]

**Files:**
- Create: `src/app/api/guided/workflows/[id]/route.ts`
- Create: `src/app/api/guided/workflows/[id]/copy/route.ts`

- [ ] **Step 1: PATCH route**

```typescript
// src/app/api/guided/workflows/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { patchWorkflowSchema } from '@/lib/validators/guided'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/guided/workflows/[id]')

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = patchWorkflowSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: me } = await supabaseAdmin
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  // Verify ownership: user-scope OR org_admin for org-scope
  const { data: wf } = await supabaseAdmin
    .from('guided_workflows')
    .select('scope, user_id, organization_id')
    .eq('id', id)
    .single()

  if (!wf) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const canEdit =
    (wf.scope === 'user' && wf.user_id === user.id) ||
    (wf.scope === 'org' &&
      wf.organization_id === me?.organization_id &&
      ['owner', 'admin'].includes(me?.role ?? ''))

  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('guided_workflows')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    log.error('update workflow failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

- [ ] **Step 2: Copy route**

```typescript
// src/app/api/guided/workflows/[id]/copy/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/guided/workflows/[id]/copy')

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Load source workflow + options
  const { data: source } = await supabaseAdmin
    .from('guided_workflows')
    .select('*, guided_workflow_options(*)')
    .eq('id', id)
    .single()

  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Copy as user-scope
  const { id: _srcId, created_at, updated_at, scope, user_id, organization_id, ...rest } = source
  const { data: copy, error } = await supabaseAdmin
    .from('guided_workflows')
    .insert({ ...rest, scope: 'user', user_id: user.id, title: `Kopie von ${source.title}` })
    .select()
    .single()

  if (error || !copy) {
    log.error('copy workflow failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  // Copy options
  const options = (source.guided_workflow_options ?? []).map(
    ({ id: _oid, workflow_id: _wid, ...opt }: Record<string, unknown>) => ({
      ...opt,
      workflow_id: copy.id,
    })
  )

  if (options.length) {
    await supabaseAdmin.from('guided_workflow_options').insert(options)
  }

  return NextResponse.json(copy, { status: 201 })
}
```

---

### Task 7: PATCH /api/guided/settings

**Files:**
- Create: `src/app/api/guided/settings/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/guided/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { patchGuidedSettingsSchema } from '@/lib/validators/guided'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/guided/settings')

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = patchGuidedSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('guided_workflow_settings')
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    log.error('upsert guided settings failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

---

### Task 8: POST /api/guided/resolve

**Files:**
- Create: `src/app/api/guided/resolve/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/guided/resolve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { resolveOption, buildWorkflowPrompt } from '@/lib/guided-workflow-engine'
import { resolveInputSchema } from '@/lib/validators/guided'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/guided/resolve')

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = resolveInputSchema.safeParse(body)
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
    const result = await resolveOption(
      parsed.data.workflowId,
      parsed.data.optionId,
      user.id,
      me.organization_id,
    )

    // If capability_plan: also build the combined system prompt
    if (result.type === 'capability_plan') {
      // Load previous selection labels for context building
      const previousSelections: string[] = []
      // (could be enriched by looking up option labels from previousSelections IDs)

      const systemPrompt = buildWorkflowPrompt({
        workflowSystemPrompt: null, // embedded in plan.system_prompt already
        capabilityInjection:  null, // already in plan
        outcomeInjection:     null, // already in plan
        previousSelections,
      })

      return NextResponse.json({
        type:         result.type,
        plan:         result.plan,
        system_prompt: result.plan.system_prompt,
      })
    }

    return NextResponse.json(result)
  } catch (err) {
    log.error('resolve failed', { err })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: TypeScript check for all routes**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit
```

- [ ] **Step 3: Commit all API routes**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/app/api/guided/
git commit -m "feat: add Guided Workflow API routes — detect, workflows CRUD, settings, resolve"
```

---

## Chunk 5: CLAUDE.md Update

### Task 9: Update CLAUDE.md

- [ ] **Step 1: Add to migrations table**

```markdown
| 20260317000041_guided_workflows_seed.sql | Guided Workflows: 5 System-Workflows + Marketing-Paket geseedet; capability_org_settings um guided_workflows_enabled + allowed_workflow_ids erweitert |
```

- [ ] **Step 2: Add Guided Workflow subsection under Capability + Outcome System**

In CLAUDE.md, under the Capability + Outcome System section, add:

```markdown
### Guided Workflows (Stand 2026-03-17)

Guided Workflows bieten strukturierte Entscheidungswege: Toro schlägt Optionen vor, User steuert.

| Datei | Inhalt |
|-------|--------|
| `src/lib/guided-workflow-engine.ts` | `detectWorkflow()`, `resolveOption()`, `buildWorkflowPrompt()` |
| `src/lib/validators/guided.ts` | Zod-Schemas für Guided-API-Routes |
| `src/app/api/guided/detect/route.ts` | POST — Workflow-Erkennung via Keywords + Context |
| `src/app/api/guided/workflows/route.ts` | GET + POST — Workflows für User |
| `src/app/api/guided/resolve/route.ts` | POST — Option auflösen → nächster Schritt |
| `src/app/api/guided/settings/route.ts` | PATCH — User schaltet Guided Workflows ein/aus |

**Regeln:**
- `detectWorkflow()` macht **keinen** LLM-Call — reine Keyword-Logik
- Maximal 3 Verschachtelungsebenen (next_workflow_id Chain)
- Jeder Workflow hat immer eine `is_custom: true` Option als Escape
- `guided_enabled = false` überschreibt alles — keine Ausnahmen
```

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md — Guided Workflows documented"
```

---

## Definition of Done Checklist

- [ ] Migration 041 deployed ohne Fehler
- [ ] 5 System-Workflows + Marketing-Paket-Workflow geseedet
- [ ] Alle Workflows haben korrekte Options incl. `is_custom: true` Escape
- [ ] `capability_org_settings` hat `guided_workflows_enabled` + `allowed_workflow_ids`
- [ ] `scoreKeywords()` Unit-Tests grün
- [ ] `buildWorkflowPrompt()` Unit-Tests grün
- [ ] `pnpm exec tsc --noEmit` sauber
- [ ] POST /api/guided/detect gibt Workflow oder null zurück
- [ ] POST /api/guided/resolve führt durch Verschachtelung (next_workflow)
- [ ] POST /api/guided/resolve gibt capability_plan zurück wenn Endpunkt erreicht
- [ ] PATCH /api/guided/settings speichert User-Präferenz
- [ ] CLAUDE.md aktualisiert
