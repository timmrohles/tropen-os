# Pre-Flight Geführte Konzept-Entwicklung — Schicht 2b-1 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`. TDD.

**Goal:** Strukturierter Konzept-Fragebogen (4 Felder + KI-Default) als On-Ramp für dünne Konzepte; speichert `concept` JSONB, komponiert zu Konzept-Text + Pivots, fährt die bestehende `analyzePreflight`-Pipeline.

**Spec:** `docs/superpowers/specs/2026-06-08-preflight-guided-concept-2b-design.md` (Abschnitt 3 = 2b-1).
**Branch:** `claude/preflight-corpus-c2`. Worktree-Root `C:/Users/timmr/tropenOS/.claude/worktrees/preflight`. `pnpm` von dort. Einzeltest `pnpm exec vitest run <pfad>`.

**Bestehende Muster (gelesen):**
- runs-Route `src/app/api/preflight/projects/[id]/runs/route.ts`: `getAuthUser()` (`@/lib/api/projects`) → `getPreflightProjectForUser(id, me)` (`@/lib/api/preflight`) → `validateBody(req, schema)` (`@/lib/validators`) → `checkBudget(me.organization_id,'preflight',null)` → `analyzePreflight(input, pivots)` (`@/lib/preflight/run`) → insert `preflight_runs` → update `preflight_projects` → `NextResponse.json({result})`.
- `PreflightPivots` in `src/lib/preflight/types.ts` (Feld `commercialModel: CommercialModel`, Werte `'none'|'shop'|'subscription'|'marketplace'|'unsure'`); `normalizePivots`.
- Validatoren-Schemas in `src/lib/validators/preflight.ts` (`preflightBody`).
- LLM-Layer: `@/lib/llm/anthropic` (`generateText`), Modell `claude-haiku-4-5-20251001`.

---

## Task 1: Migration + Konzept-Typen

**Files:** Create `supabase/migrations/20260608000001_preflight_concept.sql` · Create `src/lib/preflight/concept-types.ts`

- [ ] **Step 1: Migration**
```sql
-- preflight_projects: strukturiertes Konzept (Scheibe 2b geführte Konzept-Entwicklung)
ALTER TABLE preflight_projects ADD COLUMN IF NOT EXISTS concept JSONB DEFAULT NULL;
```
- [ ] **Step 2: Typen** — `src/lib/preflight/concept-types.ts`:
```typescript
export const CONCEPT_FIELDS = ['wasFuerWen', 'kernFunktionen', 'nutzerDaten', 'verkauf'] as const
export type ConceptField = (typeof CONCEPT_FIELDS)[number]

export interface ConceptChatTurn { role: 'user' | 'assistant'; content: string } // erst 2b-2 genutzt

export interface PreflightConcept {
  mode: 'form' | 'dialog'
  wasFuerWen: string
  kernFunktionen: string
  nutzerDaten: string
  verkauf: string
  transcript?: ConceptChatTurn[]
}
```
- [ ] **Step 3: typecheck + commit**
```bash
pnpm typecheck
git add supabase/migrations/20260608000001_preflight_concept.sql src/lib/preflight/concept-types.ts
git commit -m "feat(preflight): concept JSONB Migration + PreflightConcept-Typ (2b-1)"
```
> Hinweis: Migration NICHT anwenden (Controller-Schritt, Git-zuerst-dann-DB).

---

## Task 2: Engine `concept.ts` (Komposition) — TDD

**Files:** Create `src/lib/preflight/concept.ts` · Test `src/lib/preflight/__tests__/concept.unit.test.ts`

- [ ] **Step 1: Failing test**
```typescript
import { describe, it, expect } from 'vitest'
import { composeConceptText, derivePivotsFromConcept } from '../concept'
import type { PreflightConcept } from '../concept-types'
import type { PreflightPivots } from '../types'

const C = (over: Partial<PreflightConcept> = {}): PreflightConcept => ({
  mode: 'form', wasFuerWen: 'Eine App für Hobbyköche', kernFunktionen: 'Rezepte teilen', nutzerDaten: 'Profile + Rezepte', verkauf: '', ...over,
})
const P = (over: Partial<PreflightPivots> = {}): PreflightPivots => ({
  buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu', stack: '', platform: 'web', commercialModel: 'none', ...over,
} as PreflightPivots)

describe('composeConceptText', () => {
  it('fügt gefüllte Felder zu strukturiertem Text, lässt leere aus', () => {
    const t = composeConceptText(C({ verkauf: '' }))
    expect(t).toContain('Hobbyköche'); expect(t).toContain('Rezepte teilen')
    expect(t.toLowerCase()).not.toContain('verkauf:') // leeres Feld nicht gerendert
  })
})

describe('derivePivotsFromConcept', () => {
  it('Abo-Keyword → subscription', () => {
    expect(derivePivotsFromConcept(C({ verkauf: 'Monatliches Abo' }), P()).commercialModel).toBe('subscription')
  })
  it('Marktplatz-Keyword → marketplace', () => {
    expect(derivePivotsFromConcept(C({ verkauf: 'Marktplatz für Anbieter' }), P()).commercialModel).toBe('marketplace')
  })
  it('Shop-Keyword → shop', () => {
    expect(derivePivotsFromConcept(C({ verkauf: 'Wir verkaufen Produkte im Shop' }), P()).commercialModel).toBe('shop')
  })
  it('kein Keyword → bestehender Wert bleibt', () => {
    expect(derivePivotsFromConcept(C({ verkauf: 'noch unklar' }), P({ commercialModel: 'shop' })).commercialModel).toBe('shop')
  })
  it('lässt übrige Pivots unverändert', () => {
    expect(derivePivotsFromConcept(C(), P({ platform: 'native' })).platform).toBe('native')
  })
})
```
- [ ] **Step 2: Run — muss fehlschlagen**
- [ ] **Step 3: Implementierung** — `src/lib/preflight/concept.ts`:
```typescript
import type { PreflightConcept } from './concept-types'
import type { PreflightPivots, CommercialModel } from './types'

const FIELD_LABELS: Record<string, string> = {
  wasFuerWen: 'Was & für wen',
  kernFunktionen: 'Kern-Funktionen',
  nutzerDaten: 'Nutzer & Daten',
  verkauf: 'Verkauf / Geschäftsmodell',
}

/** Setzt die gefüllten Konzept-Felder zu einem strukturierten Markdown-Text zusammen (leere ausgelassen). */
export function composeConceptText(concept: PreflightConcept): string {
  return (['wasFuerWen', 'kernFunktionen', 'nutzerDaten', 'verkauf'] as const)
    .filter((f) => concept[f]?.trim())
    .map((f) => `## ${FIELD_LABELS[f]}\n${concept[f].trim()}`)
    .join('\n\n')
}

/** Leitet commercialModel aus dem Verkauf-Feld ab (Keyword-Heuristik); übrige Pivots unverändert. */
export function derivePivotsFromConcept(concept: PreflightConcept, existing: PreflightPivots): PreflightPivots {
  const v = concept.verkauf.toLowerCase()
  let commercialModel: CommercialModel = existing.commercialModel
  if (/\b(abo|abonnement|subscription|monatlich|miete|mitglied)/.test(v)) commercialModel = 'subscription'
  else if (/\b(marktplatz|marketplace|vermittl|anbieter|plattform für)/.test(v)) commercialModel = 'marketplace'
  else if (/\b(shop|laden|verkauf|verkaufen|produkt|kauf|bezahl|store|e-?commerce)/.test(v)) commercialModel = 'shop'
  return { ...existing, commercialModel }
}
```
- [ ] **Step 4: Run — muss bestehen**
- [ ] **Step 5: Commit**
```bash
git add src/lib/preflight/concept.ts src/lib/preflight/__tests__/concept.unit.test.ts
git commit -m "feat(preflight): concept-Komposition (composeConceptText, derivePivotsFromConcept)"
```

---

## Task 3: Validatoren — TDD

**Files:** Modify `src/lib/validators/preflight.ts` · Test `src/lib/validators/__tests__/preflight.unit.test.ts` (anlegen falls fehlt; sonst ergänzen)

- [ ] **Step 1: Failing test** (ergänzen/anlegen)
```typescript
import { describe, it, expect } from 'vitest'
import { conceptBody, conceptSuggestBody } from '../preflight'

describe('conceptBody', () => {
  it('akzeptiert 4 Felder + mode', () => {
    const r = conceptBody.safeParse({ mode: 'form', wasFuerWen: 'x', kernFunktionen: 'y', nutzerDaten: 'z', verkauf: '' })
    expect(r.success).toBe(true)
  })
  it('lehnt fehlende Felder ab', () => {
    expect(conceptBody.safeParse({ mode: 'form', wasFuerWen: 'x' }).success).toBe(false)
  })
})
describe('conceptSuggestBody', () => {
  it('verlangt seed-String', () => {
    expect(conceptSuggestBody.safeParse({ seed: 'eine kochapp' }).success).toBe(true)
    expect(conceptSuggestBody.safeParse({}).success).toBe(false)
  })
})
```
- [ ] **Step 2: Run — fehlschlagen**
- [ ] **Step 3: Implementierung** — in `src/lib/validators/preflight.ts` ergänzen (bestehenden `z`-Import nutzen):
```typescript
export const conceptBody = z.object({
  mode: z.enum(['form', 'dialog']),
  wasFuerWen: z.string().max(4000),
  kernFunktionen: z.string().max(4000),
  nutzerDaten: z.string().max(4000),
  verkauf: z.string().max(4000),
})
export const conceptSuggestBody = z.object({
  seed: z.string().min(1).max(8000),
})
```
- [ ] **Step 4: Run — bestehen** · **Step 5: Commit**
```bash
git add src/lib/validators/preflight.ts src/lib/validators/__tests__/preflight.unit.test.ts
git commit -m "feat(preflight): conceptBody + conceptSuggestBody Validatoren"
```

---

## Task 4: Route KI-Default `concept/suggest`

**Files:** Create `src/app/api/preflight/concept/suggest/route.ts`

- [ ] **Step 1: Implementierung** (Muster: Auth → validateBody → LLM → JSON):
```typescript
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { validateBody } from '@/lib/validators'
import { conceptSuggestBody } from '@/lib/validators/preflight'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:preflight:concept:suggest')

export async function POST(req: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await validateBody(req, conceptSuggestBody)
  if (error) return error

  const budget = await checkBudget(me.organization_id, 'preflight', null)
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  const system = `Du bist ein Produkt-Coach. Aus einer dünnen Idee schlägst du knappe Erstentwürfe für vier Konzept-Felder vor. Antworte NUR mit JSON: {"wasFuerWen":"","kernFunktionen":"","nutzerDaten":"","verkauf":""}. Jeder Wert 1–2 Sätze, deutsch, konkret aber als Vorschlag formuliert. Erfinde nichts Unplausibles.`
  let suggestions = { wasFuerWen: '', kernFunktionen: '', nutzerDaten: '', verkauf: '' }
  try {
    const { text } = await generateText({ model: anthropic('claude-haiku-4-5-20251001'), system, prompt: data.seed, maxOutputTokens: 700 })
    const m = text.match(/\{[\s\S]*\}/)
    if (m) suggestions = { ...suggestions, ...JSON.parse(m[0]) }
  } catch (err) {
    logger.warn('concept suggest LLM failed', { message: err instanceof Error ? err.message : 'unknown' })
    // fail-open: leere Vorschläge zurück
  }
  return NextResponse.json({ suggestions })
}
```
- [ ] **Step 2: typecheck + commit**
```bash
pnpm typecheck
git add src/app/api/preflight/concept/suggest/route.ts
git commit -m "feat(preflight): concept/suggest Route (KI-Default für 4 Felder)"
```

---

## Task 5: Route Konzept speichern + analysieren `projects/[id]/concept`

**Files:** Create `src/app/api/preflight/projects/[id]/concept/route.ts`

Spiegelt die runs-Route, aber mit Konzept-Komposition. Lies zuerst `src/app/api/preflight/projects/[id]/runs/route.ts`.

- [ ] **Step 1: Implementierung**
```typescript
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { validateBody } from '@/lib/validators'
import { conceptBody } from '@/lib/validators/preflight'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { analyzePreflight } from '@/lib/preflight/run'
import { composeConceptText, derivePivotsFromConcept } from '@/lib/preflight/concept'
import { normalizePivots } from '@/lib/preflight/types'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:preflight:concept')

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const project = await getPreflightProjectForUser(id, me)
  if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data: concept, error } = await validateBody(req, conceptBody)
  if (error) return error

  const budget = await checkBudget(me.organization_id, 'preflight', null)
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  const existingPivots = normalizePivots(project.pivots)
  const pivots = derivePivotsFromConcept(concept, existingPivots)
  const input = composeConceptText(concept)

  let result
  try {
    result = await analyzePreflight(input, pivots)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Input ungültig'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { data: run, error: runErr } = await supabaseAdmin
    .from('preflight_runs')
    .insert({ organization_id: me.organization_id, user_id: me.id, project_id: project.id, input_text: input, result })
    .select('id').single()
  if (runErr || !run) {
    logger.error('preflight_runs insert failed', { error: runErr?.message })
    return NextResponse.json({ error: 'Fehler beim Speichern', code: 'DB_ERROR' }, { status: 500 })
  }

  const { error: upErr } = await supabaseAdmin
    .from('preflight_projects')
    .update({ concept, pivots, latest_run_id: run.id, red_count: result.gaps.red.length, startpaket: null, updated_at: new Date().toISOString() })
    .eq('id', project.id)
  if (upErr) logger.warn('project update after concept failed', { error: upErr.message })

  return NextResponse.json({ result })
}
```
- [ ] **Step 2: typecheck + commit**
```bash
pnpm typecheck
git add "src/app/api/preflight/projects/[id]/concept/route.ts"
git commit -m "feat(preflight): projects/[id]/concept Route (speichern + komponieren + analysieren)"
```

---

## Task 6: UI — ConceptForm + ConceptTour + On-Ramp

**Files:** Create `src/app/[locale]/(app)/preflight/_components/ConceptForm.tsx` · Create `.../ConceptTour.tsx` · Modify `.../PreflightResult.tsx` (On-Ramp-Button) · ggf. `.../IntakePanel.tsx`

Bestehende Komponenten zuerst lesen (`PreflightResult.tsx`, `IntakePanel.tsx`, `GapCard.tsx`) für Stil/Props/State-Muster. NUR Design-System-Klassen (`card`, `btn btn-*`, `page-header`), keine Hex-Farben, Phosphor-Icons. `'use client'`.

- [ ] **Step 1: `ConceptForm.tsx`** — Props `{ projectId: string; seed: string; initial?: PreflightConcept; onDone: (result) => void }`. State: 4 Textareas (`wasFuerWen`/`kernFunktionen`/`nutzerDaten`/`verkauf`), je Label + Kurzhilfe. Button „KI-Vorschlag holen" → `POST /api/preflight/concept/suggest {seed}` → füllt leere Felder mit `suggestions` (editierbar). Button „Konzept übernehmen & analysieren" → `PATCH /api/preflight/projects/${projectId}/concept { mode:'form', ...felder }` → `onDone(result)`. Lade-/Fehlerzustände sichtbar.
- [ ] **Step 2: `ConceptTour.tsx`** — Props `{ projectId; seed; onDone }`. Eingangs-Weiche: zwei Karten. „Ich weiß ziemlich genau, was ich will" → zeigt `ConceptForm`. „Ich bin noch unsicher" → Karte **deaktiviert** mit Badge „kommt bald" (2b-2). State `mode: null | 'form'`.
- [ ] **Step 3: On-Ramp in `PreflightResult.tsx`** — wenn `result.summary.thin` (Dünn-Flag aus Scheibe 1), prominenten Button „Geführte Entwicklung starten" zeigen, der die `ConceptTour` öffnet (lokaler State `showTour`), `seed` = bisheriger Eingabe-Text, `onDone` = Ergebnis neu rendern (gleicher Mechanismus wie Re-Analyse). Wenn unklar wie das Ergebnis aktualisiert wird: bestehende Re-Analyse-Verdrahtung in der Detail-Seite spiegeln.
- [ ] **Step 4: typecheck + lint + commit**
```bash
pnpm typecheck && node scripts/ci/lint-design-system.mjs 2>/dev/null || pnpm lint:design
git add "src/app/[locale]/(app)/preflight/_components/ConceptForm.tsx" "src/app/[locale]/(app)/preflight/_components/ConceptTour.tsx" "src/app/[locale]/(app)/preflight/_components/PreflightResult.tsx"
git commit -m "feat(preflight): ConceptTour + ConceptForm + On-Ramp-Button (2b-1 UI)"
```
> Falls eine Annahme über bestehende Props/State-Verdrahtung nicht aufgeht: STOP, melde NEEDS_CONTEXT mit der konkreten Frage statt zu raten.

---

## Task 7: Verifikation (Controller — nicht delegieren)
- [ ] Migration anwenden: `supabase db push` (Git-zuerst erledigt). History an Dateiversion angleichen falls nötig.
- [ ] `pnpm exec vitest run src/lib/preflight src/lib/validators` + `pnpm typecheck` + Design-Lint → grün.
- [ ] Visueller Check (Dev-Server): dünnes Konzept eingeben → „Geführte Entwicklung starten" → Fragebogen → „KI-Vorschlag" füllt Felder → „übernehmen" → Analyse läuft, weniger Rote. „Unsicher" zeigt „kommt bald".
- [ ] Memory + Branch-Stand aktualisieren.

## Self-Review
Spec-Abdeckung: Migration+Typen (T1), Komposition (T2), Validatoren (T3), suggest-Route (T4), concept-Route (T5), UI+On-Ramp (T6), Verifikation (T7). ✔
Typ-Konsistenz: `PreflightConcept`/`CONCEPT_FIELDS` (T1) in T2/T3/T6; `composeConceptText`/`derivePivotsFromConcept` (T2) in T5; `conceptBody`/`conceptSuggestBody` (T3) in T4/T5; `analyzePreflight(input,pivots)` + runs-Muster (gelesen) in T5. ✔
YAGNI: `mode:'dialog'`/`transcript` nur vorbereitet, kein Chat in 2b-1; „Unsicher" deaktiviert. ✔
