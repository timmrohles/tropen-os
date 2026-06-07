# Pre-Flight Konventions-Regelkorpus + Renderer (Scheibe C1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die generierte CLAUDE.md/.cursorrules wird zu einem tiefen Anti-Drift-Regelwerk, dessen Tiefe strukturell garantiert ist — universelle Regeln kommen deterministisch aus einem kuratierten Korpus, das LLM ergänzt nur die Projekt-Schicht.

**Architecture:** Strukturierter Regel-Korpus (Repo-File) → zur Laufzeit nach Projekt gefiltert (`appliesWhen`) → deterministisch zu Markdown gerendert (Baseline, kein LLM) → ein LLM-Pass ergänzt Projekt-Überblick + Architektur. Ersetzt den dünnen `conventionsContent`-Teil in `generate.ts`.

**Tech Stack:** TypeScript · Vitest · AI SDK (`generateObject`) · reine Funktionen (Filter/Render).

**Spec:** `docs/superpowers/specs/2026-06-07-preflight-conventions-corpus-c1-design.md`

**Branch:** gestapelt auf `claude/preflight-loop-2a`. Worktree-Root `C:/Users/timmr/tropenOS/.claude/worktrees/preflight`, `pnpm` von dort. Einzeltest: `pnpm exec vitest run <pfad>`.

---

## File Structure

- `src/lib/preflight/corpus/types.ts` — `ConventionSection`, `RuleSeverity`, `ConventionRule`
- `src/lib/preflight/corpus/rule-corpus.ts` — `RULE_CORPUS: ConventionRule[]` (Seed, ~40–60 Regeln)
- `src/lib/preflight/corpus/render.ts` — `deriveCorpusTags`, `filterCorpus`, `renderBaseline`, `renderConventions`
- `src/lib/preflight/generate.ts` — Integration (conventions via Renderer; `conventionsContent` raus)

---

## Task 1: Korpus-Typen

**Files:**
- Create: `src/lib/preflight/corpus/types.ts`

- [ ] **Step 1: Datei schreiben**

```typescript
// src/lib/preflight/corpus/types.ts
export type ConventionSection =
  | 'overview'        // LLM-Projekt-Schicht
  | 'architecture'    // LLM-Projekt-Schicht
  | 'code-rules'
  | 'naming'
  | 'structure'
  | 'db'
  | 'error-handling'
  | 'security'
  | 'maintenance'

export type RuleSeverity = 'must' | 'should'

export interface ConventionRule {
  id: string
  section: ConventionSection
  rule: string                // imperativ („tun")
  rationale?: string
  appliesWhen?: string[]      // undefined = universell
  severity: RuleSeverity
  source: string
}
```

- [ ] **Step 2: Typecheck + Commit**

Run: `pnpm typecheck` → PASS
```bash
git add src/lib/preflight/corpus/types.ts
git commit -m "feat(preflight): Konventions-Korpus-Typen"
```

---

## Task 2: deriveCorpusTags

**Files:**
- Create: `src/lib/preflight/corpus/render.ts`
- Test: `src/lib/preflight/corpus/__tests__/render.unit.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { deriveCorpusTags } from '../render'
import type { PreflightPivots } from '../../types'

const base: PreflightPivots = {
  buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu',
  stack: '', platform: 'web', commercialModel: 'none',
}

describe('deriveCorpusTags', () => {
  it('Next.js + Supabase → react/next + db + auth', () => {
    const tags = deriveCorpusTags({ ...base, stack: 'Next.js + Supabase' }, [])
    expect(tags).toContain('stack:react')
    expect(tags).toContain('stack:next')
    expect(tags).toContain('db:true')
    expect(tags).toContain('auth:true')
    expect(tags).toContain('platform:web')
  })
  it('native + shop → platform:native + commerce', () => {
    const tags = deriveCorpusTags({ ...base, platform: 'native', commercialModel: 'shop' }, [])
    expect(tags).toContain('platform:native')
    expect(tags).toContain('commerce:true')
  })
  it('leerer Stack → keine stack/db-Tags', () => {
    const tags = deriveCorpusTags(base, [])
    expect(tags.some(t => t.startsWith('stack:'))).toBe(false)
    expect(tags).not.toContain('db:true')
  })
})
```

- [ ] **Step 2: Run — muss fehlschlagen** → `pnpm exec vitest run src/lib/preflight/corpus/__tests__/render.unit.test.ts`

- [ ] **Step 3: Implementierung** — `src/lib/preflight/corpus/render.ts`:

```typescript
// src/lib/preflight/corpus/render.ts
import type { PreflightPivots, NodeAnalysis } from '../types'

/** Leitet deterministisch Filter-Tags aus Pivots (primär Stack) + Analyse ab. Kein LLM. */
export function deriveCorpusTags(pivots: PreflightPivots, nodes: NodeAnalysis[]): string[] {
  const tags = new Set<string>()
  const stack = pivots.stack.toLowerCase()

  if (/\b(react|next\.?js|remix|gatsby)\b/.test(stack)) tags.add('stack:react')
  if (/\bnext\.?js\b/.test(stack)) tags.add('stack:next')
  if (/\b(vue|nuxt)\b/.test(stack)) tags.add('stack:vue')

  if (pivots.platform === 'web' || pivots.platform === 'both') tags.add('platform:web')
  if (pivots.platform === 'native' || pivots.platform === 'both') tags.add('platform:native')

  const dbKeywords = /\b(supabase|postgres|postgresql|mysql|mongo|mongodb|prisma|drizzle|firebase|sqlite|planetscale)\b/
  const authKeywords = /\b(supabase|firebase|clerk|nextauth|auth0|cognito|lucia)\b/
  const nodeIds = nodes.map(n => n.id.toLowerCase()).join(' ')
  if (dbKeywords.test(stack) || /\b(db|database|schema|migration)\b/.test(nodeIds)) tags.add('db:true')
  if (authKeywords.test(stack) || /\b(auth|login|session)\b/.test(nodeIds)) tags.add('auth:true')

  if (pivots.commercialModel !== 'none' && pivots.commercialModel !== 'unsure') tags.add('commerce:true')

  return [...tags]
}
```

- [ ] **Step 4: Run — muss bestehen** → `pnpm exec vitest run src/lib/preflight/corpus/__tests__/render.unit.test.ts`

- [ ] **Step 5: Commit**
```bash
git add src/lib/preflight/corpus/render.ts src/lib/preflight/corpus/__tests__/render.unit.test.ts
git commit -m "feat(preflight): deriveCorpusTags"
```

---

## Task 3: filterCorpus

**Files:**
- Modify: `src/lib/preflight/corpus/render.ts`
- Modify Test: `src/lib/preflight/corpus/__tests__/render.unit.test.ts`

- [ ] **Step 1: Failing test ergänzen** (am Ende der Testdatei; Import oben um `filterCorpus` + Typ erweitern):

```typescript
import { filterCorpus } from '../render'
import type { ConventionRule } from '../types'

const RULES: ConventionRule[] = [
  { id: 'u1', section: 'code-rules', rule: 'Universell.', severity: 'must', source: 't' },
  { id: 'r1', section: 'code-rules', rule: 'Nur React.', appliesWhen: ['stack:react'], severity: 'should', source: 't' },
  { id: 'd1', section: 'db', rule: 'Nur DB.', appliesWhen: ['db:true'], severity: 'must', source: 't' },
]

describe('filterCorpus', () => {
  it('universelle Regel immer drin', () => {
    expect(filterCorpus(RULES, []).map(r => r.id)).toContain('u1')
  })
  it('bedingte Regel nur bei passendem Tag', () => {
    const ids = filterCorpus(RULES, ['stack:react']).map(r => r.id)
    expect(ids).toContain('r1'); expect(ids).not.toContain('d1')
  })
  it('kein Tag-Match → bedingte raus, universelle bleibt', () => {
    expect(filterCorpus(RULES, ['stack:vue']).map(r => r.id)).toEqual(['u1'])
  })
})
```

- [ ] **Step 2: Run — muss fehlschlagen**

- [ ] **Step 3: Implementierung** — in `render.ts` anfügen:
```typescript
import type { ConventionRule } from '../types'

/** Regel enthalten, wenn universell (kein appliesWhen) ODER mind. ein Tag passt. */
export function filterCorpus(corpus: ConventionRule[], tags: string[]): ConventionRule[] {
  return corpus.filter((r) => !r.appliesWhen || r.appliesWhen.some((t) => tags.includes(t)))
}
```
(Den `ConventionRule`-Import ggf. mit dem bestehenden Typ-Import oben zusammenführen.)

- [ ] **Step 4: Run — muss bestehen**

- [ ] **Step 5: Commit**
```bash
git add src/lib/preflight/corpus/render.ts src/lib/preflight/corpus/__tests__/render.unit.test.ts
git commit -m "feat(preflight): filterCorpus"
```

---

## Task 4: renderBaseline (deterministisch)

**Files:**
- Modify: `src/lib/preflight/corpus/render.ts`
- Modify Test: `src/lib/preflight/corpus/__tests__/render.unit.test.ts`

- [ ] **Step 1: Failing test ergänzen**

```typescript
import { renderBaseline } from '../render'

describe('renderBaseline', () => {
  const rules: ConventionRule[] = [
    { id: 'n1', section: 'naming', rule: 'Komponenten PascalCase.', severity: 'must', source: 't' },
    { id: 'c1', section: 'code-rules', rule: 'Dateien > 300 Zeilen aufteilen.', rationale: 'Lesbarkeit', severity: 'should', source: 't' },
  ]
  it('deterministisch (zweimal identisch)', () => {
    expect(renderBaseline(rules)).toBe(renderBaseline(rules))
  })
  it('enthält Regeltext + must/should-Markierung', () => {
    const md = renderBaseline(rules)
    expect(md).toContain('Dateien > 300 Zeilen aufteilen.')
    expect(md).toContain('Komponenten PascalCase.')
    expect(md).toMatch(/Pflicht|Empfehlung/)
  })
  it('feste Abschnitts-Reihenfolge: code-rules vor naming', () => {
    const md = renderBaseline(rules)
    expect(md.indexOf('Dateien > 300')).toBeLessThan(md.indexOf('Komponenten PascalCase'))
  })
})
```

- [ ] **Step 2: Run — muss fehlschlagen**

- [ ] **Step 3: Implementierung** — in `render.ts` anfügen:
```typescript
import type { ConventionSection } from '../types'

const SECTION_ORDER: ConventionSection[] = [
  'code-rules', 'naming', 'structure', 'db', 'error-handling', 'security', 'maintenance',
]
const SECTION_TITLE: Record<ConventionSection, string> = {
  overview: 'Projekt-Überblick',
  architecture: 'Architektur-Entscheidungen',
  'code-rules': 'Code-Regeln (nicht verhandelbar)',
  naming: 'Namenskonventionen',
  structure: 'Ordnerstruktur & was gehört wohin',
  db: 'Datenbank-Zugriff & Migrationen',
  'error-handling': 'Fehlerbehandlung',
  security: 'Sicherheit & Secrets',
  maintenance: 'Pflege dieser Datei',
}

/** Rendert die gefilterten Regeln deterministisch zu Markdown — KEIN LLM. */
export function renderBaseline(rules: ConventionRule[]): string {
  const out: string[] = []
  for (const section of SECTION_ORDER) {
    const inSec = rules.filter((r) => r.section === section)
    if (inSec.length === 0) continue
    out.push(`## ${SECTION_TITLE[section]}`)
    for (const r of inSec) {
      const tag = r.severity === 'must' ? '**Pflicht:**' : 'Empfehlung:'
      out.push(`- ${tag} ${r.rule}${r.rationale ? ` (${r.rationale})` : ''}`)
    }
    out.push('')
  }
  return out.join('\n').trimEnd()
}
```
(`overview`/`architecture` stehen NICHT in `SECTION_ORDER` — sie sind LLM-Schicht, kommen nicht aus dem Korpus.)

- [ ] **Step 4: Run — muss bestehen**

- [ ] **Step 5: Commit**
```bash
git add src/lib/preflight/corpus/render.ts src/lib/preflight/corpus/__tests__/render.unit.test.ts
git commit -m "feat(preflight): renderBaseline (deterministisch)"
```

---

## Task 5: Starter-Korpus (Seed)

**Files:**
- Create: `src/lib/preflight/corpus/rule-corpus.ts`
- Test: `src/lib/preflight/corpus/__tests__/rule-corpus.unit.test.ts`

- [ ] **Step 1: Struktur-Test schreiben (erzwingt Tiefe)**

```typescript
import { describe, it, expect } from 'vitest'
import { RULE_CORPUS } from '../rule-corpus'
import type { ConventionSection } from '../types'

const MUST_SECTIONS: ConventionSection[] = ['code-rules', 'naming', 'structure', 'error-handling', 'security', 'maintenance']

describe('RULE_CORPUS', () => {
  it('jede Pflicht-Sektion hat ≥3 universelle Regeln', () => {
    for (const s of MUST_SECTIONS) {
      const universal = RULE_CORPUS.filter((r) => r.section === s && !r.appliesWhen)
      expect(universal.length, `Sektion ${s}`).toBeGreaterThanOrEqual(3)
    }
  })
  it('IDs sind eindeutig', () => {
    const ids = RULE_CORPUS.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('enthält bedingte Regeln für react + db', () => {
    expect(RULE_CORPUS.some((r) => r.appliesWhen?.includes('stack:react'))).toBe(true)
    expect(RULE_CORPUS.some((r) => r.appliesWhen?.includes('db:true'))).toBe(true)
  })
  it('Regeltexte sind nicht leer', () => {
    expect(RULE_CORPUS.every((r) => r.rule.trim().length > 8)).toBe(true)
  })
})
```

- [ ] **Step 2: Run — muss fehlschlagen** (Datei fehlt)

- [ ] **Step 3: Korpus schreiben** — `src/lib/preflight/corpus/rule-corpus.ts`. Beginne mit diesem Gerüst und **erweitere auf ~40–60 Regeln**, sodass der Test grün wird (jede Pflicht-Sektion ≥3 universelle Regeln). Inhalte aus der Tropen-OS-`CLAUDE.md` (Code-Regeln, Namenskonventionen, Projektstruktur, Error-Handling) + Agent-Pack-Themen ableiten:

```typescript
// src/lib/preflight/corpus/rule-corpus.ts
import type { ConventionRule } from './types'

export const RULE_CORPUS: ConventionRule[] = [
  // ── code-rules (universell, ≥3) ──
  { id: 'code-file-size', section: 'code-rules', rule: 'Dateien > 300 Zeilen sind eine Warnung, > 500 eine Verletzung — aufteilen.', rationale: 'Lesbarkeit & Wartbarkeit', severity: 'must', source: 'claude-md' },
  { id: 'code-no-any', section: 'code-rules', rule: 'Kein `any` ohne Kommentar mit Begründung; TypeScript strict.', severity: 'must', source: 'claude-md' },
  { id: 'code-no-logic-in-ui', section: 'code-rules', rule: 'Keine Business-Logik in UI-Komponenten/Seiten — in /lib oder /actions.', severity: 'must', source: 'claude-md' },
  { id: 'code-semantic-html', section: 'code-rules', rule: '<button> für Aktionen, <a href> für Navigation — nie <div onClick>.', severity: 'should', source: 'agent:ACCESSIBILITY' },
  // ── naming (universell, ≥3) ──
  { id: 'name-components', section: 'naming', rule: 'React-Komponenten PascalCase (UserProfile.tsx).', severity: 'must', source: 'claude-md' },
  { id: 'name-hooks', section: 'naming', rule: 'Custom Hooks camelCase mit use-Präfix (useUserProfile.ts).', severity: 'must', source: 'claude-md' },
  { id: 'name-consts', section: 'naming', rule: 'Konstanten-Werte UPPER_SNAKE_CASE (MAX_RETRY_COUNT).', severity: 'should', source: 'claude-md' },
  { id: 'name-folders', section: 'naming', rule: 'Ordner kebab-case (user-management/).', severity: 'should', source: 'claude-md' },
  // ── structure (universell, ≥3) ──
  { id: 'struct-layers', section: 'structure', rule: 'Klare Schichten: UI (components) / Logik (lib, actions) / Daten (db).', severity: 'must', source: 'claude-md' },
  { id: 'struct-routing-only', section: 'structure', rule: 'Routing-Ordner enthalten nur Routing — kein Business-Code.', severity: 'should', source: 'claude-md' },
  { id: 'struct-colocate', section: 'structure', rule: 'Was zusammen geändert wird, liegt zusammen — nach Verantwortung schneiden, nicht nach technischem Layer.', severity: 'should', source: 'agent:ARCHITECTURE' },
  // ── error-handling (universell, ≥3) ──
  { id: 'err-typed', section: 'error-handling', rule: 'Standardisierte Error-Typen statt roher throws.', severity: 'must', source: 'claude-md' },
  { id: 'err-try-catch-routes', section: 'error-handling', rule: 'API-Routen: try/catch + strukturierte JSON-Response { error, code? }.', severity: 'must', source: 'claude-md' },
  { id: 'err-no-generic', section: 'error-handling', rule: 'Nie generische Messages an den Client — spezifisch & hilfreich.', severity: 'should', source: 'claude-md' },
  // ── security (universell, ≥3) ──
  { id: 'sec-no-secrets', section: 'security', rule: 'Keine Secrets im Code oder in der Git-History.', severity: 'must', source: 'claude-md' },
  { id: 'sec-authcheck-first', section: 'security', rule: 'Auth-Check als erste Zeile jeder geschützten Route.', severity: 'must', source: 'claude-md' },
  { id: 'sec-no-pii-logs', section: 'security', rule: 'Kein PII in Logs; structured logging statt console.log.', severity: 'should', source: 'claude-md' },
  { id: 'sec-validate-input', section: 'security', rule: 'Eingaben serverseitig validieren (z.B. Zod) vor jeder Business-Logik.', severity: 'must', source: 'agent:SECURITY' },
  // ── maintenance (universell, ≥3) ──
  { id: 'maint-keep-current', section: 'maintenance', rule: 'Diese Datei aktuell halten, wenn sich Konventionen ändern.', severity: 'must', source: 'claude-md' },
  { id: 'maint-no-delete-sections', section: 'maintenance', rule: 'Bestehende Regeln nicht ohne Begründung entfernen.', severity: 'should', source: 'claude-md' },
  { id: 'maint-size', section: 'maintenance', rule: 'Datei fokussiert halten — wächst sie zu stark, in Themen-Dateien aufteilen.', severity: 'should', source: 'claude-md' },
  // ── bedingt: react ──
  { id: 'react-no-fetch-in-effect', section: 'code-rules', rule: 'Kein Daten-Fetch direkt in useEffect ohne Abbruch/Dedupe — Server Components / Query-Layer bevorzugen.', appliesWhen: ['stack:react'], severity: 'should', source: 'agent:PERFORMANCE' },
  { id: 'react-keys', section: 'code-rules', rule: 'Stabile keys in Listen — nie der Array-Index bei dynamischen Listen.', appliesWhen: ['stack:react'], severity: 'should', source: 'agent:CODE_STYLE' },
  // ── bedingt: db ──
  { id: 'db-no-frontend-access', section: 'db', rule: 'Kein direkter DB-Zugriff aus dem Frontend — immer über eine Server-Schicht.', appliesWhen: ['db:true'], severity: 'must', source: 'claude-md' },
  { id: 'db-migrations-versioned', section: 'db', rule: 'Schema-Änderungen immer zuerst als versionierte Migrationsdatei, dann anwenden.', appliesWhen: ['db:true'], severity: 'must', source: 'claude-md' },
  { id: 'db-rls', section: 'db', rule: 'Row-Level-Security / Tenant-Filter auf jeder mandantenbezogenen Tabelle.', appliesWhen: ['db:true'], severity: 'must', source: 'agent:DATABASE' },
  // ── bedingt: auth ──
  { id: 'auth-session-check', section: 'security', rule: 'Session/Token serverseitig prüfen — nie nur clientseitig verstecken.', appliesWhen: ['auth:true'], severity: 'must', source: 'agent:SECURITY' },
  // ── bedingt: web ──
  { id: 'web-a11y-basics', section: 'code-rules', rule: 'Fokus-Indikator sichtbar, Tastatur-Bedienbarkeit, aria-label für Icon-Buttons.', appliesWhen: ['platform:web'], severity: 'should', source: 'agent:ACCESSIBILITY' },
  // ── bedingt: commerce ──
  { id: 'commerce-no-card-data', section: 'security', rule: 'Niemals Karten-/Zahlungsdaten selbst speichern — PSP (Stripe o.ä.) nutzen.', appliesWhen: ['commerce:true'], severity: 'must', source: 'agent:LEGAL' },
]
```
Erweitere, bis jede Pflicht-Sektion ≥3 universelle Regeln hat (oben sind code-rules/naming/security/error-handling/structure/maintenance bereits abgedeckt — ergänze fehlende auf ≥3 und füge ruhig weitere bedingte Regeln hinzu, Ziel ~40–60).

- [ ] **Step 4: Run — muss bestehen** → `pnpm exec vitest run src/lib/preflight/corpus/__tests__/rule-corpus.unit.test.ts`

- [ ] **Step 5: Commit**
```bash
git add src/lib/preflight/corpus/rule-corpus.ts src/lib/preflight/corpus/__tests__/rule-corpus.unit.test.ts
git commit -m "feat(preflight): Starter-Regelkorpus (Seed)"
```

---

## Task 6: renderConventions (Baseline + LLM-Projekt-Pass)

**Files:**
- Modify: `src/lib/preflight/corpus/render.ts`
- Test: `src/lib/preflight/corpus/__tests__/render-conventions.unit.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('ai', () => ({
  generateObject: vi.fn(async () => ({ object: {
    title: 'LMS Plattform', overview: 'Ein Lernmanagementsystem.', architecture: 'Next.js + Supabase, Multi-Tenant.',
  } })),
}))
vi.mock('@/lib/llm/anthropic', () => ({ anthropic: () => 'mock' }))

import { renderConventions } from '../render'
import type { PreflightPivots } from '../../types'

const PIVOTS: PreflightPivots = {
  buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu',
  stack: 'Next.js + Supabase', platform: 'web', commercialModel: 'none',
}

describe('renderConventions', () => {
  it('enthält die deterministische Baseline WÖRTLICH + die LLM-Projekt-Schicht', async () => {
    const md = await renderConventions('Ein LMS', [], PIVOTS, {})
    // Baseline kann nicht verdünnt werden:
    expect(md).toContain('Dateien > 300 Zeilen')
    expect(md).toContain('Auth-Check als erste Zeile')
    // bedingte db-Regel ist drin (Supabase → db:true):
    expect(md).toContain('Migrationsdatei')
    // LLM-Projekt-Schicht:
    expect(md).toContain('Ein Lernmanagementsystem.')
    expect(md).toContain('Multi-Tenant')
  })
})
```

- [ ] **Step 2: Run — muss fehlschlagen**

- [ ] **Step 3: Implementierung** — in `render.ts` anfügen (Imports oben ergänzen):
```typescript
import { generateObject } from 'ai'
import { z } from 'zod'
import { anthropic } from '@/lib/llm/anthropic'
import type { DecisionMap } from '../types'
import { RULE_CORPUS } from './rule-corpus'

const PROJECT_LAYER_SCHEMA = z.object({
  title: z.string(),
  overview: z.string(),
  architecture: z.string(),
})

/** Baseline (deterministisch) + ein LLM-Pass nur für Projekt-Überblick + Architektur. */
export async function renderConventions(
  text: string, nodes: NodeAnalysis[], pivots: PreflightPivots, decisions: DecisionMap,
): Promise<string> {
  const tags = deriveCorpusTags(pivots, nodes)
  const rules = filterCorpus(RULE_CORPUS, tags)
  const baseline = renderBaseline(rules)

  const decisionsText = Object.entries(decisions)
    .map(([id, d]) => (d.choice === 'parked' ? `${id}: offen` : `${id}: ${d.value ?? 'übernommen'}`))
    .join('\n')

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: PROJECT_LAYER_SCHEMA,
    system: 'Du schreibst NUR zwei Abschnitte einer Konventions-Datei: einen kurzen Projekt-Überblick und die Architektur-Entscheidungen (inkl. Datenmodell). Schreibe KEINE allgemeinen Code-/Naming-/Security-Regeln — die kommen aus einer separaten Baseline. Kurz, konkret, projektbezogen.',
    prompt: `PROJEKT-BESCHREIBUNG:\n${text}\n\n---\nGETROFFENE ENTSCHEIDUNGEN:\n${decisionsText || '(keine)'}\n\n---\nLiefere title, overview (2–3 Sätze) und architecture (Stack + Schlüssel-Entscheidungen + ggf. Datenmodell).`,
  })

  return [
    `# ${object.title}`,
    '',
    '## Projekt-Überblick',
    object.overview,
    '',
    '## Architektur-Entscheidungen',
    object.architecture,
    '',
    baseline,
  ].join('\n')
}
```

- [ ] **Step 4: Run — muss bestehen**

- [ ] **Step 5: Typecheck + Commit**
```bash
pnpm typecheck
git add src/lib/preflight/corpus/render.ts src/lib/preflight/corpus/__tests__/render-conventions.unit.test.ts
git commit -m "feat(preflight): renderConventions (Baseline + LLM-Projekt-Schicht)"
```

---

## Task 7: Integration in generate.ts

**Files:**
- Modify: `src/lib/preflight/generate.ts`
- Modify Test: `src/lib/preflight/__tests__/generate.unit.test.ts`

- [ ] **Step 1: generate.ts umstellen**
  - Import ergänzen: `import { renderConventions } from './corpus/render'`
  - In `SCHEMA` das Feld `conventionsContent` **entfernen** (bleibt: `decisionLog`, `envExample`, `migrationSql`).
  - In `buildSystemPrompt` den Abschnitt „2. conventionsContent …" **entfernen** und die Nummerierung der übrigen Punkte anpassen (decisionLog, envExample, migrationSql).
  - Nach dem `generateObject`-Call die conventions-Content-Quelle ändern:
```typescript
  const conventionsContent = await renderConventions(text, analysis, pivots, decisions)

  const startpaket: Startpaket = {
    decisionLog: object.decisionLog,
    conventions: { filename: CONVENTIONS_FILENAME[pivots.buildTool], content: conventionsContent },
    envExample: object.envExample,
  }
```
  (Rest — migrationDraft + Audit — unverändert.)

- [ ] **Step 2: generate-Test anpassen**
  In `src/lib/preflight/__tests__/generate.unit.test.ts`:
  - Mock für den Renderer ergänzen (verhindert echten zweiten LLM-Call + macht die Assertion einfach):
```typescript
vi.mock('../corpus/render', () => ({ renderConventions: vi.fn(async () => '# Projekt\n\n## Code-Regeln (nicht verhandelbar)\n- **Pflicht:** Baseline-Regel.') }))
```
  - Im `generateObject`-Mock-Objekt das Feld `conventionsContent` **entfernen** (bleibt decisionLog/envExample/migrationSql).
  - Bestehende Assertion `expect(sp.conventions.content).toBe('# .cursorrules content')` ersetzen durch `expect(sp.conventions.content).toContain('Baseline-Regel.')`.
  - `conventions.filename`-Assertions bleiben gültig.

- [ ] **Step 3: Tests + Typecheck**
Run: `pnpm exec vitest run src/lib/preflight/__tests__/generate.unit.test.ts`
Run: `pnpm typecheck` → grün.

- [ ] **Step 4: Commit**
```bash
git add src/lib/preflight/generate.ts src/lib/preflight/__tests__/generate.unit.test.ts
git commit -m "feat(preflight): conventions via Renderer (conventionsContent raus)"
```

---

## Task 8: Gesamt-Verifikation

- [ ] **Step 1: Alle Preflight-Tests** → `pnpm exec vitest run src/lib/preflight` → grün.
- [ ] **Step 2: Lints** → `pnpm typecheck && pnpm lint && pnpm lint:design` → keine Fehler.
- [ ] **Step 3: Visueller Check** — `pnpm dev`, ein Projekt mit Stack „Next.js + Supabase" analysieren, rote Lücken klären, „Startpaket erstellen" → die generierte CLAUDE.md/.cursorrules öffnen: enthält jetzt **tiefe Baseline-Abschnitte** (Code-Regeln, Naming, Struktur, DB, Security, Pflege) + einen projektspezifischen Kopf. (DevTools „Disable cache" nicht mehr nötig — SW in Dev deaktiviert.)
- [ ] **Step 4: Abschluss-Commit** (falls Korrekturen) → `git add -A && git commit -m "fix(preflight): C1 visueller Sweep"`

---

## Self-Review (vom Plan-Autor)

- **Spec-Abdeckung:** Typen (T1), deriveCorpusTags (T2), filterCorpus (T3), renderBaseline (T4), Seed-Korpus + Tiefen-Test (T5), renderConventions Baseline+LLM (T6), Integration (T7), Verifikation (T8). ✔ Draußen (C2/später): Komitee-Kuration, Audit/Veredler-Render, Startpaket-Rethink, 2b. ✔
- **Platzhalter:** Der Korpus-Inhalt in T5 ist bewusst „erweitern auf ~40–60" — aber mit konkretem Gerüst + erzwingendem Struktur-Test (≥3 universell/Pflicht-Sektion), kein vager Platzhalter. ✔
- **Typ-Konsistenz:** `ConventionRule`/`ConventionSection`/`RuleSeverity` (T1) durchgängig; `deriveCorpusTags(pivots,nodes)` → `filterCorpus(corpus,tags)` → `renderBaseline(rules)` → `renderConventions(text,nodes,pivots,decisions)` Signaturen konsistent; `renderConventions`-Aufruf in T7 = `renderConventions(text, analysis, pivots, decisions)` (in generate.ts heißt der NodeAnalysis-Param `analysis`). ✔
- **Tiefen-Garantie testbar:** T6 prüft Baseline **wörtlich** im Output, T5 erzwingt ≥3 universelle Regeln/Sektion. ✔
