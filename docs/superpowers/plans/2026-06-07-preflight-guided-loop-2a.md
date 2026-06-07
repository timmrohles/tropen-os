# Pre-Flight Scheibe 2a — Geführter Loop + verzögerte Generierung — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Analyse erzeugt kein Startpaket mehr; der Nutzer klärt die roten Lücken (übernehmen/anpassen/parken), Entscheidungen werden persistiert, und das Startpaket entsteht erst nach Erreichen des Mindeststandards aus diesen Entscheidungen.

**Architecture:** Engine-Split (`analyzePreflight` ohne Generierung + `generateStartpaket(…, decisions)`); Entscheidungen + Startpaket als JSONB am Projekt; neue Routen für decisions (PATCH) + generate (POST mit Gate); Loop-UI auf der Detail-Seite.

**Tech Stack:** TypeScript · Zod · Vitest · Supabase (`supabaseAdmin`) · AI SDK (`generateObject`) · Next.js Client Components · Phosphor Icons.

**Spec:** `docs/superpowers/specs/2026-06-07-preflight-guided-loop-2a-design.md` · **ADR-030**

**Branch:** gestapelt auf `claude/preflight-premises-v2`. Worktree-Root: `C:/Users/timmr/tropenOS/.claude/worktrees/preflight`. `pnpm` von dort. Einzeltest: `pnpm exec vitest run <pfad>`.

---

## File Structure

- `src/lib/preflight/types.ts` — +`Decision`/`DecisionChoice`/`DecisionMap`, +`isMinStandardMet`
- `src/lib/validators/preflight.ts` — +`decisionBody`
- `src/lib/preflight/run.ts` — +`analyzePreflight`, `runPreflight` entfernt (im Routen-Task), Audit-Block raus
- `src/lib/preflight/generate.ts` — `generateStartpaket(…, decisions)` + Migration-Audit intern
- `supabase/migrations/20260607000001_preflight_decisions_startpaket.sql` — +2 Spalten
- `src/app/api/preflight/analyze/route.ts` + `…/projects/[id]/runs/route.ts` — `analyzePreflight`, result ohne startpaket
- `src/app/api/preflight/projects/[id]/decisions/route.ts` — **neu** PATCH
- `src/app/api/preflight/projects/[id]/generate/route.ts` — **neu** POST
- `src/app/api/preflight/projects/[id]/route.ts` — GET liefert decisions + startpaket
- `…/preflight/_components/GapCard.tsx` — interaktiv (Entscheidung)
- `…/preflight/_components/PreflightResult.tsx` — Loop (Fortschritt + gated Generierung)
- `…/preflight/[id]/page.tsx` — Verdrahtung
- `…/preflight/_components/ArtifactBrowser.tsx` — Prop `startpaket`

---

## Task 1: Decision-Typen + isMinStandardMet

**Files:**
- Modify: `src/lib/preflight/types.ts`
- Test: `src/lib/preflight/__tests__/min-standard.unit.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { isMinStandardMet } from '../types'
import type { GapList, DecisionMap } from '../types'

const gaps = (redIds: string[]): GapList => ({
  red: redIds.map(id => ({ id, domain: 'D', frage: 'f', warum: 'w', default: 'd', kosten: 'red' })),
  yellow: [{ id: 'Y1', domain: 'D', frage: 'f', warum: 'w', default: 'd', kosten: 'yellow' }],
  decidedCount: 0, naCount: 0,
})

describe('isMinStandardMet', () => {
  it('false wenn eine rote Lücke ohne Entscheidung', () => {
    expect(isMinStandardMet(gaps(['A', 'B']), { A: { choice: 'default' } } as DecisionMap)).toBe(false)
  })
  it('true wenn alle roten entschieden oder geparkt', () => {
    const d: DecisionMap = { A: { choice: 'default' }, B: { choice: 'parked' } }
    expect(isMinStandardMet(gaps(['A', 'B']), d)).toBe(true)
  })
  it('gelbe Lücken sind egal', () => {
    expect(isMinStandardMet(gaps([]), {})).toBe(true)
  })
})
```

- [ ] **Step 2: Run — muss fehlschlagen**

Run: `pnpm exec vitest run src/lib/preflight/__tests__/min-standard.unit.test.ts`
Expected: FAIL (`isMinStandardMet`/`DecisionMap` nicht exportiert).

- [ ] **Step 3: Typen + Helper** — in `src/lib/preflight/types.ts` am Dateiende anfügen:

```typescript
export type DecisionChoice = 'default' | 'custom' | 'parked'
export interface Decision { choice: DecisionChoice; value?: string }
export type DecisionMap = Record<string, Decision>

/** Mindeststandard erreicht: jede offene rote Lücke hat eine Entscheidung. */
export function isMinStandardMet(gaps: GapList, decisions: DecisionMap): boolean {
  return gaps.red.every(g => decisions[g.id] !== undefined)
}
```

- [ ] **Step 4: Run — muss bestehen** → `pnpm exec vitest run src/lib/preflight/__tests__/min-standard.unit.test.ts` (3 grün)

- [ ] **Step 5: Typecheck + Commit**

```bash
pnpm typecheck
git add src/lib/preflight/types.ts src/lib/preflight/__tests__/min-standard.unit.test.ts
git commit -m "feat(preflight): Decision-Typen + isMinStandardMet"
```

---

## Task 2: Validator decisionBody

**Files:**
- Modify: `src/lib/validators/preflight.ts`
- Test: `src/lib/validators/__tests__/preflight.unit.test.ts`

- [ ] **Step 1: Failing test ergänzen**

```typescript
import { decisionBody } from '../preflight'

describe('decisionBody', () => {
  it('akzeptiert default/custom/parked', () => {
    expect(decisionBody.safeParse({ nodeId: 'A1', choice: 'default' }).success).toBe(true)
    expect(decisionBody.safeParse({ nodeId: 'A1', choice: 'custom', value: 'x' }).success).toBe(true)
    expect(decisionBody.safeParse({ nodeId: 'A1', choice: 'parked' }).success).toBe(true)
  })
  it('lehnt unbekannte choice ab', () => {
    expect(decisionBody.safeParse({ nodeId: 'A1', choice: 'foo' }).success).toBe(false)
  })
  it('lehnt leere nodeId ab', () => {
    expect(decisionBody.safeParse({ nodeId: '', choice: 'default' }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run — muss fehlschlagen** → `pnpm exec vitest run src/lib/validators/__tests__/preflight.unit.test.ts`

- [ ] **Step 3: Schema** — in `src/lib/validators/preflight.ts` anfügen:

```typescript
export const decisionBody = z.object({
  nodeId: z.string().min(1),
  choice: z.enum(['default', 'custom', 'parked']),
  value: z.string().optional(),
})
```

- [ ] **Step 4: Run — muss bestehen** → `pnpm exec vitest run src/lib/validators/__tests__/preflight.unit.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/preflight.ts src/lib/validators/__tests__/preflight.unit.test.ts
git commit -m "feat(preflight): decisionBody validator"
```

---

## Task 3: Migration (decisions + startpaket Spalten)

**Files:**
- Create: `supabase/migrations/20260607000001_preflight_decisions_startpaket.sql`

- [ ] **Step 1: Migrationsdatei schreiben**

```sql
-- 20260607000001_preflight_decisions_startpaket.sql
-- Scheibe 2a: Entscheidungen + generiertes Startpaket am Projekt (verzögerte Generierung).
ALTER TABLE preflight_projects ADD COLUMN decisions JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE preflight_projects ADD COLUMN startpaket JSONB;
```

- [ ] **Step 2: Committen (Git zuerst)**

```bash
git add supabase/migrations/20260607000001_preflight_decisions_startpaket.sql
git commit -m "feat(preflight): Migration decisions + startpaket am Projekt"
```

- [ ] **Step 3: Anwendung dem Controller melden**

Report im Abschluss: „Migration-Datei committet, bitte Controller wendet `20260607000001` auf die DB an (MCP `apply_migration`) + gleicht History an." (Der Controller, nicht der Implementer, wendet auf die geteilte DB an.)

---

## Task 4: Engine-Split (analyzePreflight + generateStartpaket mit decisions)

**Files:**
- Modify: `src/lib/preflight/run.ts`
- Modify: `src/lib/preflight/generate.ts`
- Test: `src/lib/preflight/__tests__/analyze-preflight.unit.test.ts`
- Modify Test: `src/lib/preflight/__tests__/generate.unit.test.ts`

- [ ] **Step 1: generate.ts — decisions-Param + Audit intern**

Ersetze in `src/lib/preflight/generate.ts` die Imports + Funktion `generateStartpaket`:

Import-Zeile ergänzen:
```typescript
import { auditMigrationSql } from './migration-audit'
import type { NodeAnalysis, Startpaket, PreflightPivots, DecisionMap } from './types'
```

`buildSystemPrompt` lassen. `generateStartpaket` ersetzen durch:
```typescript
export async function generateStartpaket(
  text: string,
  analysis: NodeAnalysis[],
  pivots: PreflightPivots,
  decisions: DecisionMap = {},
): Promise<Startpaket> {
  const analysisText = analysis
    .map((n) => `${n.id}: ${n.status}${n.evidence ? ` (${n.evidence})` : ''}`)
    .join('\n')

  const decisionsText = Object.entries(decisions)
    .map(([nodeId, d]) =>
      d.choice === 'parked'
        ? `${nodeId}: BEWUSST GEPARKT (offen lassen, nicht erfinden)`
        : `${nodeId}: ENTSCHIEDEN — ${d.value ?? ''}`,
    )
    .join('\n')

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: SCHEMA,
    system: buildSystemPrompt(pivots),
    prompt: `KNOTENANALYSE:\n${analysisText || '(keine Analyse vorhanden)'}\n\n---\nNUTZER-ENTSCHEIDUNGEN (verbindlich berücksichtigen):\n${decisionsText || '(keine)'}\n\n---\nDESIGN-DOKUMENT:\n${text}\n\n---\nErzeuge decisionLog, conventionsContent, envExample und (falls Datenmodell vorhanden) migrationSql. Übernimm die Nutzer-Entscheidungen wörtlich; geparkte Punkte bleiben offen.`,
  })

  const startpaket: Startpaket = {
    decisionLog: object.decisionLog,
    conventions: { filename: CONVENTIONS_FILENAME[pivots.buildTool], content: object.conventionsContent },
    envExample: object.envExample,
  }
  if (object.migrationSql) {
    startpaket.migrationDraft = { sql: object.migrationSql, warnings: await auditMigrationSql(object.migrationSql) }
  }
  return startpaket
}
```

- [ ] **Step 2: run.ts — analyzePreflight hinzufügen, Audit-Block raus**

Ersetze `src/lib/preflight/run.ts` vollständig durch:
```typescript
// src/lib/preflight/run.ts
import { normalizeInput } from './ingest'
import { analyzeInput } from './analyze'
import { buildGapList } from './gaps'
import type { PreflightPivots, GapList, ResultSummary, NodeAnalysis } from './types'

/** Deterministische Heuristik: ist der Input zu knapp für eine fundierte Analyse? */
export function isThinInput(normalizedText: string, gaps: Pick<GapList, 'decidedCount'>): boolean {
  return normalizedText.trim().length < 280 || gaps.decidedCount <= 2
}

/** Analyse-Phase: Lücken ohne Startpaket (Generierung folgt separat nach Entscheidungen). */
export async function analyzePreflight(
  raw: string,
  pivots: PreflightPivots,
): Promise<{ summary: ResultSummary; gaps: GapList; nodes: NodeAnalysis[] }> {
  const text = normalizeInput(raw)
  const { nodes, projectLabel } = await analyzeInput(text, pivots)
  const gaps = buildGapList(nodes)
  const thin = isThinInput(text, gaps)
  const headline =
    gaps.red.length > 0
      ? `${gaps.red.length} Dinge solltest du zuerst entscheiden — fang oben an.`
      : 'Keine Blocker — du kannst loslegen.'
  return { summary: { projectLabel, headline, thin }, gaps, nodes }
}
```
(`runPreflight` + die Audit-/generate-Imports entfallen — Aufrufer wechseln in Task 5.)

- [ ] **Step 3: generate-Test anpassen** — in `src/lib/preflight/__tests__/generate.unit.test.ts`: prüfen, dass der Aufruf weiter ohne 4. Argument funktioniert (Default `{}`). Falls der Test `generateStartpaket(TEXT, NODES, PIVOTS)` aufruft, bleibt er gültig. Einen Test ergänzen:

```typescript
it('referenziert Nutzer-Entscheidungen im Prompt', async () => {
  // generateObject ist im Test gemockt; prüfe via Spy, dass der Prompt die Entscheidung enthält.
  // Falls der bestehende Test generateObject mockt: erweitere die Assertion um die decisions.
})
```
Hinweis Implementer: Schau, wie `generate.unit.test.ts` `generateObject` mockt; ergänze eine Assertion, dass bei `generateStartpaket(TEXT, NODES, PIVOTS, { A1: { choice: 'custom', value: 'org_id sofort' } })` der übergebene `prompt` den String `org_id sofort` enthält. Wenn der Mock den Prompt nicht zugänglich macht, lass diesen Zusatztest weg und halte nur den bestehenden grün.

- [ ] **Step 4: analyzePreflight-Test (neu)**

```typescript
import { describe, it, expect, vi } from 'vitest'
vi.mock('@/lib/llm/anthropic', () => ({ anthropic: () => 'model' }))
vi.mock('../analyze', () => ({ analyzeInput: vi.fn().mockResolvedValue({ nodes: [{ id: 'D1', status: 'open' }], projectLabel: 'LMS' }) }))
vi.mock('../gaps', () => ({ buildGapList: vi.fn().mockReturnValue({ red: [{ id: 'D1' }], yellow: [], decidedCount: 1, naCount: 0 }) }))

import { analyzePreflight } from '../run'

it('gibt summary+gaps+nodes ohne startpaket', async () => {
  const r = await analyzePreflight('Ein hinreichend langes Konzept '.repeat(20), { buildTool: 'cursor' } as never)
  expect(r).toHaveProperty('summary')
  expect(r).toHaveProperty('gaps')
  expect(r).toHaveProperty('nodes')
  expect(r).not.toHaveProperty('startpaket')
})
```

- [ ] **Step 5: Tests + Typecheck**

Run: `pnpm exec vitest run src/lib/preflight/__tests__/analyze-preflight.unit.test.ts src/lib/preflight/__tests__/generate.unit.test.ts`
Expected: grün.
Run: `pnpm typecheck` → es werden jetzt Fehler in `analyze/route.ts` + `runs/route.ts` erscheinen (rufen `runPreflight` auf, das es nicht mehr gibt). **Das ist erwartet** und wird in Task 5 behoben — als DONE_WITH_CONCERNS melden mit genau diesen zwei Dateien.

- [ ] **Step 6: Commit**

```bash
git add src/lib/preflight/run.ts src/lib/preflight/generate.ts src/lib/preflight/__tests__/analyze-preflight.unit.test.ts src/lib/preflight/__tests__/generate.unit.test.ts
git commit -m "feat(preflight): analyzePreflight + generateStartpaket(decisions) + Audit intern"
```

---

## Task 5: Routen analyze + runs auf analyzePreflight umstellen

**Files:**
- Modify: `src/app/api/preflight/analyze/route.ts`
- Modify: `src/app/api/preflight/projects/[id]/runs/route.ts`
- Modify Test: `src/app/api/preflight/__tests__/analyze.unit.test.ts`

- [ ] **Step 1: analyze-Route** — ersetze in `src/app/api/preflight/analyze/route.ts`:
  - Import `import { runPreflight } from '@/lib/preflight/run'` → `import { analyzePreflight } from '@/lib/preflight/run'`
  - Den Aufruf `result = await runPreflight(input, pivots)` → `result = await analyzePreflight(input, pivots)`
  - Beim Run-Insert `result` (jetzt `{ summary, gaps, nodes }`) unverändert speichern.
  - `red_count`/`name`-Logik nutzt `result.summary.projectLabel` + `result.gaps.red.length` — bleibt gültig.

- [ ] **Step 2: runs-Route** — analog `runPreflight` → `analyzePreflight` in `src/app/api/preflight/projects/[id]/runs/route.ts`; `result = { summary, gaps, nodes }` im Run speichern; `red_count = result.gaps.red.length` bleibt.

- [ ] **Step 3: analyze-Test anpassen** — in `src/app/api/preflight/__tests__/analyze.unit.test.ts`: Mock `vi.mock('@/lib/preflight/run', () => ({ analyzePreflight: vi.fn() }))` (statt `runPreflight`), `FAKE_RESULT` ohne `startpaket` (nur `{ summary, gaps, nodes: [] }`), und der Mock-Default `mockRunPreflight` → `mockAnalyzePreflight = vi.mocked(analyzePreflight)`. Assertions, die `body.result.gaps` prüfen, bleiben.

- [ ] **Step 4: Tests + Typecheck**

Run: `pnpm exec vitest run src/app/api/preflight/__tests__/analyze.unit.test.ts`
Run: `pnpm typecheck` → jetzt **grün** (runPreflight-Aufrufer entfernt).

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/preflight/analyze/route.ts" "src/app/api/preflight/projects/[id]/runs/route.ts" src/app/api/preflight/__tests__/analyze.unit.test.ts
git commit -m "feat(preflight): analyze/runs-Routen nutzen analyzePreflight (kein Startpaket)"
```

---

## Task 6: decisions-Route (PATCH)

**Files:**
- Create: `src/app/api/preflight/projects/[id]/decisions/route.ts`
- Test: `src/app/api/preflight/__tests__/decisions.unit.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/lib/api/projects', () => ({ getAuthUser: vi.fn() }))
vi.mock('@/lib/api/preflight', () => ({ getPreflightProjectForUser: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { PATCH } from '../projects/[id]/decisions/route'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { supabaseAdmin } from '@/lib/supabase-admin'

const mockAuth = vi.mocked(getAuthUser)
const mockAccess = vi.mocked(getPreflightProjectForUser)
const mockAdmin = vi.mocked(supabaseAdmin)
const USER = { id: 'u1', organization_id: 'org1', role: 'member' }
const ctx = { params: Promise.resolve({ id: 'p1' }) }
const req = (b: unknown) => new Request('http://x/api/preflight/projects/p1/decisions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })

describe('PATCH decisions', () => {
  beforeEach(() => vi.clearAllMocks())
  it('404 ohne Zugriff', async () => {
    mockAuth.mockResolvedValue(USER); mockAccess.mockResolvedValue(null)
    expect((await PATCH(req({ nodeId: 'A1', choice: 'default' }), ctx)).status).toBe(404)
  })
  it('setzt Entscheidung + gibt decisions zurück', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue({ id: 'p1', organization_id: 'org1', name: 'x', pivots: {}, latest_run_id: 'r1' } as never)
    const single = vi.fn().mockResolvedValue({ data: { decisions: {} }, error: null })
    const updEq = vi.fn().mockResolvedValue({ data: null, error: null })
    mockAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single }) }),
      update: vi.fn().mockReturnValue({ eq: updEq }),
    }) as never
    const res = await PATCH(req({ nodeId: 'A1', choice: 'custom', value: 'org_id' }), ctx)
    expect(res.status).toBe(200)
    expect((await res.json()).decisions.A1).toEqual({ choice: 'custom', value: 'org_id' })
  })
  it('400 bei ungültiger choice', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue({ id: 'p1', organization_id: 'org1' } as never)
    expect((await PATCH(req({ nodeId: 'A1', choice: 'foo' }), ctx)).status).toBe(400)
  })
})
```

- [ ] **Step 2: Run — muss fehlschlagen** → `pnpm exec vitest run src/app/api/preflight/__tests__/decisions.unit.test.ts`

- [ ] **Step 3: Route**

```typescript
// src/app/api/preflight/projects/[id]/decisions/route.ts
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { decisionBody } from '@/lib/validators/preflight'
import { apiError } from '@/lib/api-error'
import type { DecisionMap } from '@/lib/preflight/types'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await getPreflightProjectForUser(id, me)
  if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error: validationError } = await validateBody(req, decisionBody)
  if (validationError) return validationError

  const { data: row, error: readErr } = await supabaseAdmin
    .from('preflight_projects').select('decisions').eq('id', id).single()
  if (readErr) return apiError(readErr)

  const decisions: DecisionMap = { ...(row?.decisions ?? {}) }
  decisions[data.nodeId] = data.choice === 'parked'
    ? { choice: 'parked' }
    : { choice: data.choice, value: data.value }

  const { error: updErr } = await supabaseAdmin
    .from('preflight_projects')
    .update({ decisions, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (updErr) return apiError(updErr)

  return NextResponse.json({ decisions })
}
```

- [ ] **Step 4: Run — muss bestehen** → `pnpm exec vitest run src/app/api/preflight/__tests__/decisions.unit.test.ts` (3 grün)

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/preflight/projects/[id]/decisions/route.ts" src/app/api/preflight/__tests__/decisions.unit.test.ts
git commit -m "feat(preflight): PATCH decisions route"
```

---

## Task 7: generate-Route (POST mit Gate)

**Files:**
- Create: `src/app/api/preflight/projects/[id]/generate/route.ts`
- Test: `src/app/api/preflight/__tests__/generate-route.unit.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/lib/api/projects', () => ({ getAuthUser: vi.fn() }))
vi.mock('@/lib/api/preflight', () => ({ getPreflightProjectForUser: vi.fn() }))
vi.mock('@/lib/budget', () => ({ checkBudget: vi.fn(), budgetExhaustedResponse: vi.fn(() => new Response('{}', { status: 402 })) }))
vi.mock('@/lib/preflight/generate', () => ({ generateStartpaket: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { POST } from '../projects/[id]/generate/route'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { checkBudget } from '@/lib/budget'
import { generateStartpaket } from '@/lib/preflight/generate'
import { supabaseAdmin } from '@/lib/supabase-admin'

const mAuth = vi.mocked(getAuthUser), mAccess = vi.mocked(getPreflightProjectForUser), mBudget = vi.mocked(checkBudget), mGen = vi.mocked(generateStartpaket), mAdmin = vi.mocked(supabaseAdmin)
const USER = { id: 'u1', organization_id: 'org1', role: 'member' }
const ctx = { params: Promise.resolve({ id: 'p1' }) }
const req = () => new Request('http://x', { method: 'POST' })

// Projekt mit latest_run_id + decisions; Run mit gaps/nodes/input_text
function wire(decisions: unknown, redIds: string[]) {
  mAccess.mockResolvedValue({ id: 'p1', organization_id: 'org1', latest_run_id: 'r1', pivots: { buildTool: 'cursor' }, decisions } as never)
  const runSingle = vi.fn().mockResolvedValue({ data: { result: { gaps: { red: redIds.map(id => ({ id })), yellow: [], decidedCount: 0, naCount: 0 }, nodes: [] }, input_text: 'konzept' } }, error: null })
  const updEq = vi.fn().mockResolvedValue({ data: null, error: null })
  mAdmin.from = vi.fn((t: string) => t === 'preflight_runs'
    ? { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: runSingle }) }) }
    : { update: vi.fn().mockReturnValue({ eq: updEq }) }) as never
  return { updEq }
}

describe('POST generate', () => {
  beforeEach(() => vi.clearAllMocks())
  it('409 wenn Mindeststandard nicht erreicht', async () => {
    mAuth.mockResolvedValue(USER); mBudget.mockResolvedValue({ allowed: true })
    wire({}, ['A1'])  // rote Lücke A1 ohne Entscheidung
    const res = await POST(req(), ctx)
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('MIN_STANDARD_NOT_MET')
  })
  it('200 + startpaket wenn Gate erreicht', async () => {
    mAuth.mockResolvedValue(USER); mBudget.mockResolvedValue({ allowed: true })
    mGen.mockResolvedValue({ decisionLog: '', conventions: { filename: '.cursorrules', content: '' }, envExample: '' } as never)
    const { updEq } = wire({ A1: { choice: 'default' } }, ['A1'])
    const res = await POST(req(), ctx)
    expect(res.status).toBe(200)
    expect((await res.json()).startpaket).toBeDefined()
    expect(updEq).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run — muss fehlschlagen** → `pnpm exec vitest run src/app/api/preflight/__tests__/generate-route.unit.test.ts`

- [ ] **Step 3: Route**

```typescript
// src/app/api/preflight/projects/[id]/generate/route.ts
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateStartpaket } from '@/lib/preflight/generate'
import { isMinStandardMet, normalizePivots } from '@/lib/preflight/types'
import type { DecisionMap, GapList, NodeAnalysis } from '@/lib/preflight/types'
import { apiError } from '@/lib/api-error'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:preflight:generate')

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await getPreflightProjectForUser(id, me)
  if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (!project.latest_run_id) return NextResponse.json({ error: 'Noch keine Analyse' }, { status: 409 })

  const { data: run, error: runErr } = await supabaseAdmin
    .from('preflight_runs').select('result, input_text').eq('id', project.latest_run_id).single()
  if (runErr) return apiError(runErr)

  const result = run?.result as { gaps: GapList; nodes: NodeAnalysis[] }
  const decisions = (project.decisions ?? {}) as DecisionMap

  if (!isMinStandardMet(result.gaps, decisions)) {
    return NextResponse.json({ error: 'Mindeststandard nicht erreicht', code: 'MIN_STANDARD_NOT_MET' }, { status: 409 })
  }

  const budget = await checkBudget(me.organization_id, 'preflight', null)
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  let startpaket
  try {
    startpaket = await generateStartpaket(run!.input_text, result.nodes ?? [], normalizePivots(project.pivots as never), decisions)
  } catch (err) {
    logger.error('generateStartpaket failed', { err })
    return NextResponse.json({ error: 'Generierung fehlgeschlagen', code: 'GENERATE_ERROR' }, { status: 500 })
  }

  const { error: updErr } = await supabaseAdmin
    .from('preflight_projects').update({ startpaket, updated_at: new Date().toISOString() }).eq('id', id)
  if (updErr) return apiError(updErr)

  return NextResponse.json({ startpaket })
}
```

- [ ] **Step 4: Run — muss bestehen** → `pnpm exec vitest run src/app/api/preflight/__tests__/generate-route.unit.test.ts`

- [ ] **Step 5: Typecheck + Commit**

```bash
pnpm typecheck
git add "src/app/api/preflight/projects/[id]/generate/route.ts" src/app/api/preflight/__tests__/generate-route.unit.test.ts
git commit -m "feat(preflight): POST generate route (Gate + Startpaket am Projekt)"
```

---

## Task 8: detail-GET liefert decisions + startpaket

**Files:**
- Modify: `src/app/api/preflight/projects/[id]/route.ts`
- Modify Test: `src/app/api/preflight/__tests__/project-id.unit.test.ts`

- [ ] **Step 1: GET erweitern** — in `src/app/api/preflight/projects/[id]/route.ts`, GET-Handler: zusätzlich `decisions` + `startpaket` des Projekts laden und mit Fallback zurückgeben.

`getPreflightProjectForUser` liefert das Projekt (nutze dessen `decisions`, falls vorhanden — sonst per Select nachladen). Da der Helper aktuell `decisions/startpaket` nicht selektiert, lade sie hier explizit:

Ersetze den Run-Lade-Block + Rückgabe durch:
```typescript
  let result: unknown = null
  let input = ''
  if (project.latest_run_id) {
    const { data: run, error } = await supabaseAdmin
      .from('preflight_runs').select('result, input_text').eq('id', project.latest_run_id).single()
    if (error) return apiError(error)
    result = run?.result ?? null
    input = run?.input_text ?? ''
  }

  const { data: extra } = await supabaseAdmin
    .from('preflight_projects').select('decisions, startpaket').eq('id', id).single()
  const decisions = extra?.decisions ?? {}
  // Fallback: altes Startpaket lag im Run (CRUD-Scheibe)
  const runStartpaket = (result as { startpaket?: unknown } | null)?.startpaket ?? null
  const startpaket = extra?.startpaket ?? runStartpaket

  return NextResponse.json({ id: project.id, name: project.name, pivots: project.pivots, input, decisions, startpaket, result })
```

- [ ] **Step 2: Test anpassen** — in `src/app/api/preflight/__tests__/project-id.unit.test.ts`, GET-Happy-Path: der zweite `from('preflight_projects').select('decisions, startpaket')`-Aufruf muss gemockt werden. Erweitere den `mockAdmin.from`-Mock so, dass er für `preflight_runs` den Run und für `preflight_projects` `{ decisions: {}, startpaket: null }` liefert; assertiere `body.decisions` + `body.startpaket` vorhanden (kann null sein).

- [ ] **Step 3: Test + Typecheck**

Run: `pnpm exec vitest run src/app/api/preflight/__tests__/project-id.unit.test.ts`
Run: `pnpm typecheck` → grün.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/preflight/projects/[id]/route.ts" src/app/api/preflight/__tests__/project-id.unit.test.ts
git commit -m "feat(preflight): detail-GET liefert decisions + startpaket (Fallback)"
```

---

## Task 9: GapCard interaktiv (Entscheidung pro Lücke)

**Files:**
- Modify: `src/app/[locale]/(app)/preflight/_components/GapCard.tsx`

Kein Verhaltenstest (UI). Gate = `pnpm typecheck` + `pnpm lint:design`.

- [ ] **Step 1: `GapCard` um Entscheidungs-Props erweitern** — ersetze die `GapCard`-Funktion (Signatur + done-State) so, dass sie eine Entscheidung anzeigt/setzt. Vollständige neue `GapCard`:

```tsx
export function GapCard({ gap, decision, onDecision }: {
  gap: Gap
  decision?: Decision
  onDecision: (nodeId: string, choice: DecisionChoice, value?: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(gap.action ?? gap.default)
  const isRed = gap.kosten === 'red'
  const suggestion = gap.action ?? gap.default
  const resolved = decision !== undefined

  if (resolved && !editing) {
    const label = decision!.choice === 'parked' ? 'geparkt' : (decision!.value || suggestion)
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', marginBottom: 8,
        borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-cool)', opacity: 0.85 }}>
        <span style={{ color: decision!.choice === 'parked' ? 'var(--text-tertiary)' : 'var(--teal)', flexShrink: 0 }}>
          {decision!.choice === 'parked' ? '⏸' : '✓'}
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
          <b style={{ color: 'var(--text-primary)' }}>{gap.frage}</b> — {label}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditVal(decision!.value ?? suggestion); setEditing(true) }}>Ändern</button>
      </div>
    )
  }

  return (
    <div style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)',
      borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: isRed ? 'var(--error)' : 'var(--status-risky)',
      borderRadius: '0 8px 8px 0', background: 'var(--bg-surface)', marginBottom: 8, padding: '12px 14px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {gap.domain} · {isRed ? '🔴 Blocker' : '🟡 Optional'}
      </div>
      <p style={{ margin: '3px 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{gap.frage}</p>

      <div style={{ background: 'var(--surface-cool)', borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)' }}>KI-VORSCHLAG</span>
        {editing ? (
          <textarea autoFocus value={editVal} onChange={e => setEditVal(e.target.value)} rows={2}
            style={{ width: '100%', marginTop: 4, fontSize: 13, fontFamily: 'inherit', border: '1px solid var(--accent)', borderRadius: 4, padding: '4px 6px', resize: 'vertical' }} />
        ) : (
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{suggestion}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {editing ? (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => { onDecision(gap.id, 'custom', editVal.trim()); setEditing(false) }}>Speichern</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Abbrechen</button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onDecision(gap.id, 'default', suggestion)}>Übernehmen</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditVal(suggestion); setEditing(true) }}>Anpassen</button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--text-tertiary)' }} onClick={() => onDecision(gap.id, 'parked')}>Parken</button>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Imports + GapsSection anpassen** — oben in `GapCard.tsx`:
```typescript
import { useState } from 'react'
import type { Gap, Decision, DecisionChoice, GapList } from '@/lib/preflight/types'
```
(Entferne nicht mehr genutzte Icon-Importe.) `GapsSection` durchreichen lassen — ersetze die Signatur:
```tsx
export function GapsSection({ gaps, decisions, onDecision }: {
  gaps: GapList
  decisions: Record<string, Decision>
  onDecision: (nodeId: string, choice: DecisionChoice, value?: string) => void
}) {
  const items = [...gaps.red, ...gaps.yellow]
  if (items.length === 0) return <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Keine offenen Lücken.</p>
  return (
    <div style={{ marginBottom: 16 }}>
      {items.map(g => <GapCard key={g.id} gap={g} decision={decisions[g.id]} onDecision={onDecision} />)}
    </div>
  )
}
```

- [ ] **Step 3: Typecheck (erwartet noch rot wegen PreflightResult-Aufruf)**

Run: `pnpm typecheck` → Fehler in `PreflightResult.tsx` (ruft `GapsSection` ohne `decisions/onDecision`). **Erwartet** → Task 10. Als DONE_WITH_CONCERNS melden (Datei: PreflightResult.tsx).

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/preflight/_components/GapCard.tsx"
git commit -m "feat(preflight): GapCard interaktiv (übernehmen/anpassen/parken)"
```

---

## Task 10: PreflightResult → Loop + Detail-Verdrahtung + ArtifactBrowser-Prop

**Files:**
- Modify: `src/app/[locale]/(app)/preflight/_components/ArtifactBrowser.tsx`
- Modify: `src/app/[locale]/(app)/preflight/_components/PreflightResult.tsx`
- Modify: `src/app/[locale]/(app)/preflight/[id]/page.tsx`

- [ ] **Step 1: ArtifactBrowser nimmt `startpaket` statt `result`** — in `ArtifactBrowser.tsx`: Prop-Signatur `{ result }` → `{ startpaket }`; `deriveFiles(result)` → `deriveFiles(startpaket)` und intern `const sp = startpaket` (statt `result.startpaket`). Den „Alle als Prompt"-Button: `buildDecisionPrompt` braucht das volle Result — entferne diesen Footer-Button in 2a (kommt mit Roadmap/Scheibe 4 zurück), damit `ArtifactBrowser` nur vom `Startpaket` abhängt. Signatur:
```tsx
export function ArtifactBrowser({ startpaket }: { startpaket: Startpaket }) {
  const files = useMemo(() => deriveFiles(startpaket), [startpaket])
  // … Rest unverändert, nur der Footer-„Alle als Prompt"-Block entfällt …
}
function deriveFiles(sp: Startpaket): FileEntry[] { /* wie bisher, nutzt sp.conventions/decisionLog/envExample/migrationDraft */ }
```
Import `Startpaket` aus `@/lib/preflight/types`; `buildDecisionPrompt`-Import entfernen.

- [ ] **Step 2: PreflightResult → Loop** — ersetze `PreflightResult.tsx` vollständig:

```tsx
'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Warning, CheckCircle, Info } from '@phosphor-icons/react'
import type { GapList, DecisionMap, DecisionChoice, ResultSummary, Startpaket } from '@/lib/preflight/types'
import { isMinStandardMet } from '@/lib/preflight/types'
import { GapsSection } from './GapCard'

const ArtifactBrowser = dynamic(() => import('./ArtifactBrowser').then(m => m.ArtifactBrowser), { ssr: false })

interface Props {
  summary: ResultSummary
  gaps: GapList
  decisions: DecisionMap
  startpaket: Startpaket | null
  onDecision: (nodeId: string, choice: DecisionChoice, value?: string) => void
  onGenerate: () => void
  generating: boolean
}

export function PreflightResult({ summary, gaps, decisions, startpaket, onDecision, onGenerate, generating }: Props) {
  const total = gaps.red.length
  const done = useMemo(() => gaps.red.filter(g => decisions[g.id] !== undefined).length, [gaps.red, decisions])
  const met = isMinStandardMet(gaps, decisions)
  const remaining = total - done

  return (
    <div style={{ marginTop: 8 }}>
      {summary.thin && (
        <div style={{ display: 'flex', gap: 10, padding: '14px 18px', marginBottom: 20, borderRadius: 8, background: 'rgba(229,160,0,0.10)', border: '1px solid var(--status-risky)' }}>
          <Warning size={18} weight="fill" color="var(--status-risky)" aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Dein Konzept ist knapp — kläre die roten Punkte, dann wird das Startpaket konkret.</p>
        </div>
      )}

      {/* Fortschritt zum Mindeststandard */}
      {total > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
            <span>MINDESTSTANDARD</span><span>{done} / {total} rote Lücken</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-tint)', overflow: 'hidden' }}>
            <div style={{ width: `${total ? (done / total) * 100 : 100}%`, height: '100%', background: 'var(--teal)', transition: 'width 200ms' }} />
          </div>
        </div>
      )}

      <GapsSection gaps={gaps} decisions={decisions} onDecision={onDecision} />

      {/* Gated Generierung */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" disabled={!met || generating} onClick={onGenerate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {generating ? 'Generiere …' : startpaket ? 'Neu generieren' : 'Startpaket erstellen'}
        </button>
        {!met && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>noch {remaining} rote {remaining === 1 ? 'Lücke' : 'Lücken'} offen</span>}
        {met && !startpaket && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--teal)' }}><CheckCircle size={14} weight="fill" />Mindeststandard erreicht</span>}
      </div>

      {/* Startpaket (nach Generierung) */}
      {startpaket && (
        <div style={{ marginTop: 20 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', marginBottom: 12 }}>
            <span style={{ width: 28, height: 1, background: 'rgba(45,122,80,0.3)' }} />Dein Startpaket
          </span>
          <ArtifactBrowser startpaket={startpaket} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 24, padding: '12px 16px', borderRadius: 8, background: 'var(--surface-cool)', border: '1px solid var(--border)' }}>
        <Info size={16} weight="bold" color="var(--text-tertiary)" style={{ flexShrink: 0 }} aria-hidden="true" />
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          <b style={{ color: 'var(--text-secondary)' }}>Gut beurteilbar:</b> Architektur, Konventionen, Sicherheit &amp; rechtliche Trigger. <b style={{ color: 'var(--text-secondary)' }}>Grenzen:</b> keine Rechtsberatung, kein Markt-/Geschäftsmodell-Urteil, sieht nur was im Konzept steht.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Detail-Seite verdrahten** — in `[id]/page.tsx`: `PreflightProjectDetail`-Typ + State um `decisions`/`startpaket` erweitern, Handler `onDecision` (PATCH, optimistisch) + `onGenerate` (POST) ergänzen und an `PreflightResult` geben. Ersetze den `PreflightResult`-Aufruf + ergänze State/Handler:

```tsx
// State ergänzen:
const [generating, setGenerating] = useState(false)

// Nach load(): detail enthält jetzt decisions + startpaket (GET liefert sie).
// onDecision:
const onDecision = useCallback(async (nodeId: string, choice: 'default'|'custom'|'parked', value?: string) => {
  setDetail(d => d ? { ...d, decisions: { ...d.decisions, [nodeId]: choice === 'parked' ? { choice } : { choice, value } } } : d)
  await fetch(`/api/preflight/projects/${id}/decisions`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nodeId, choice, value }) })
}, [id])

const onGenerate = useCallback(async () => {
  setGenerating(true)
  try {
    const res = await fetch(`/api/preflight/projects/${id}/generate`, { method: 'POST' })
    if (res.ok) { const j = await res.json() as { startpaket: unknown }; setDetail(d => d ? { ...d, startpaket: j.startpaket as never } : d) }
  } finally { setGenerating(false) }
}, [id])

// Render:
{detail
  ? <PreflightResult summary={detail.result.summary} gaps={detail.result.gaps} decisions={detail.decisions}
      startpaket={detail.startpaket} onDecision={onDecision} onGenerate={onGenerate} generating={generating} />
  : <p style={{ color: 'var(--text-tertiary)', marginTop: 24 }}>Lädt …</p>}
```

Den `PreflightProjectDetail`-Typ in `types.ts` erweitern: `+ decisions: DecisionMap` `+ startpaket: Startpaket | null` und `result` ist `{ summary, gaps }` (nodes server-intern). Passe `result`-Nutzung an (kein `startpaket` mehr im result).

- [ ] **Step 4: Typecheck + lint:design**

Run: `pnpm typecheck && pnpm lint:design` → grün.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(app)/preflight/_components/ArtifactBrowser.tsx" "src/app/[locale]/(app)/preflight/_components/PreflightResult.tsx" "src/app/[locale]/(app)/preflight/[id]/page.tsx" src/lib/preflight/types.ts
git commit -m "feat(preflight): Loop-UI (Fortschritt + gated Generierung) + Detail-Verdrahtung"
```

---

## Task 11: Gesamt-Verifikation

- [ ] **Step 1: Alle Preflight-Tests** → `pnpm exec vitest run src/lib/preflight src/lib/validators src/app/api/preflight` → grün.
- [ ] **Step 2: Lints** → `pnpm typecheck && pnpm lint && pnpm lint:design` → keine Fehler.
- [ ] **Step 3: Dev-Server + visueller Sweep** — `pnpm dev`, `http://localhost:3001/de/preflight` (DevTools „Disable cache"):
  - Analyse → Detail zeigt **Loop** (kein sofortiges Startpaket), Fortschrittsbalken.
  - 🔴-Lücke: Übernehmen / Anpassen (inline, speichert custom) / Parken → Karte klappt zu, Fortschritt steigt.
  - „Startpaket erstellen" disabled bis alle roten geklärt/geparkt → dann aktiv → erzeugt Startpaket → Repo-Browser erscheint.
  - Reload: Entscheidungen + Startpaket bleiben (persistiert).
  - Alt-Projekt (CRUD): altes Startpaket via Fallback sichtbar.
- [ ] **Step 4: Abschluss-Commit (falls Sweep-Korrekturen)** → `git add -A && git commit -m "fix(preflight): 2a visueller Sweep"`

---

## Self-Review (vom Plan-Autor)

- **Spec-Abdeckung:** Typen+Gate (T1), Validator (T2), Migration (T3), Engine-Split (T4), analyze/runs (T5), decisions-Route (T6), generate-Route+Gate (T7), detail-GET (T8), GapCard interaktiv (T9), Loop-UI+Verdrahtung+ArtifactBrowser (T10), Verifikation (T11). ✔ Bewusst draußen (2b/3/4): On-Ramp-Interview, diskutieren-Chat, Roadmap, „alle als Prompt" (mit Roadmap zurück). ✔
- **Platzhalter:** keine — echter Code/Befehle. ✔
- **Typ-Konsistenz:** `Decision`/`DecisionMap`/`isMinStandardMet` (T1) konsistent in Validator (T2), generate (T4), Routen (T6–T8), UI (T9–T10); `analyzePreflight`-Return `{summary,gaps,nodes}` (T4) in T5 gespeichert, in T7 (generate) + T10 (UI) gelesen; `generateStartpaket(text,nodes,pivots,decisions)` (T4) so in T7 aufgerufen; `ArtifactBrowser({startpaket})` (T10) konsistent. ✔
- **Transient-Rot bewusst:** T4 lässt analyze/runs-Routen kurz rot (runPreflight weg) → T5 fixt; T9 lässt PreflightResult kurz rot → T10 fixt. Beide als DONE_WITH_CONCERNS dokumentiert. ✔
- **Migration:** Datei-Task (T3); DB-Anwendung durch Controller.
