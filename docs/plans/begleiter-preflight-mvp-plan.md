# Pre-Flight MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine `/preflight`-Route in tropenOS, die ein Design/Schema (Paste/Upload/vage) entgegennimmt und eine priorisierte Lücken-Liste + Startpaket (Decision-Log, CLAUDE.md, .env.example, selbst-auditierter Migrations-Entwurf) erzeugt.

**Architecture:** Gestufte Engine in `src/lib/preflight/` — deterministische Taxonomie (Korsett v2 als Daten) → LLM-Analyse (structured) → deterministische Lücken-Liste → LLM-Generierung → Selbst-Audit des SQL via vorhandener `sec-db`-Checker. Dünne API-Route orchestriert; UI zeigt + kopiert/downloadet; Läufe RLS-gescoped persistiert.

**Tech Stack:** Next.js App Router · TypeScript strict · AI SDK (`ai` + `@ai-sdk/anthropic` via `@/lib/llm/anthropic`) · Supabase (supabaseAdmin + RLS) · Zod · Vitest · bestehende `sec-db`-Checker + `buildAuditContextFromFiles`.

**Basis-Spec:** `docs/plans/begleiter-preflight-mvp-spec.md` · **Taxonomie:** `docs/plans/begleiter-korsett-v2.md`

---

## Datei-Struktur

| Datei | Verantwortung |
|-------|---------------|
| `src/lib/preflight/types.ts` | Geteilte Typen (`KorsettNode`, `NodeAnalysis`, `Gap`, `GapList`, `Startpaket`, `PreflightResult`) |
| `src/lib/preflight/korsett.ts` | Korsett v2 als `KorsettNode[]` (einzige Datenquelle) |
| `src/lib/preflight/gaps.ts` | Analyse → priorisierte Lücken-Liste (deterministisch) |
| `src/lib/preflight/ingest.ts` | Roh-Input (Text/Datei) → normalisierter Text |
| `src/lib/preflight/analyze.ts` | LLM-Analyse-Pass (structured) → `NodeAnalysis[]` |
| `src/lib/preflight/generate.ts` | LLM-Generier-Pass → `Startpaket` (ohne Migration-Audit) |
| `src/lib/preflight/migration-audit.ts` | SQL durch `sec-db`-Checker → Warnungen |
| `src/lib/preflight/run.ts` | Orchestrierung: ingest→analyze→gaps→generate→migration-audit |
| `src/lib/validators/preflight.ts` | Zod-Schema für die API |
| `supabase/migrations/<ts>_preflight_runs.sql` | Tabelle + RLS |
| `src/app/api/preflight/analyze/route.ts` | API-Route (auth, budget, orchestrate, persist) |
| `src/app/[locale]/(app)/preflight/page.tsx` | Eingabe-Screen |
| `src/app/[locale]/(app)/preflight/_components/PreflightResult.tsx` | Ergebnis (Lücken-Liste + Startpaket-Tabs) |
| `src/lib/preflight/__tests__/*.unit.test.ts` | Unit-Tests |

**Milestones:** A (Engine-Kern, voll getestet, kein LLM/UI) → B (LLM-Pässe) → C (API + Persistenz) → D (UI). Jeder Milestone ist eigenständig testbar.

---

## Milestone A — Engine-Kern

### Task 1: Typen

**Files:** Create: `src/lib/preflight/types.ts`

- [ ] **Step 1: Typen schreiben**

```typescript
// src/lib/preflight/types.ts
export type Kosten = 'red' | 'yellow'
export type NodeStatus = 'decided' | 'open' | 'na'

/** Ein Korsett-Knoten (aus Korsett v2). */
export interface KorsettNode {
  id: string
  domain: string
  frage: string
  warum: string
  default: string
  kosten: Kosten
  /** Knoten gilt nur, wenn dieser Pivot zutrifft (z.B. 'db', 'auth', 'ai'); undefined = universell. */
  appliesWhen?: string
}

export interface NodeAnalysis {
  id: string
  status: NodeStatus
  /** Beleg aus dem Input, der den Status stützt. */
  evidence?: string
}

export interface Gap {
  id: string
  domain: string
  frage: string
  warum: string
  default: string
  kosten: Kosten
}

export interface GapList {
  red: Gap[]      // offen + 🔴 → "zuerst entscheiden"
  yellow: Gap[]   // offen + 🟡 → "später, bewusst geparkt"
  decidedCount: number
  naCount: number
}

export interface MigrationDraft {
  sql: string
  /** Findings aus dem Selbst-Audit (sec-db-Checker). */
  warnings: string[]
}

export interface Startpaket {
  decisionLog: string   // Markdown
  claudeMd: string
  envExample: string
  migrationDraft?: MigrationDraft // nur wenn Schema erkannt
}

export interface PreflightResult {
  gaps: GapList
  startpaket: Startpaket
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/preflight/types.ts
git commit -m "feat(preflight): shared types"
```

---

### Task 2: Korsett v2 als Daten

**Files:** Create: `src/lib/preflight/korsett.ts`, `src/lib/preflight/__tests__/korsett.unit.test.ts`

- [ ] **Step 1: Failing test schreiben**

```typescript
// src/lib/preflight/__tests__/korsett.unit.test.ts
import { describe, it, expect } from 'vitest'
import { KORSETT } from '../korsett'

describe('KORSETT', () => {
  it('hat eindeutige IDs', () => {
    const ids = KORSETT.map(n => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('jeder Knoten hat gültige kosten', () => {
    for (const n of KORSETT) expect(['red', 'yellow']).toContain(n.kosten)
  })
  it('enthält die architektur-prägenden Kern-Knoten', () => {
    const ids = KORSETT.map(n => n.id)
    for (const id of ['U1', 'U4', 'D1', 'D3', 'D5', 'AI2', 'L1', 'B1']) {
      expect(ids).toContain(id)
    }
  })
})
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

Run: `pnpm vitest run src/lib/preflight/__tests__/korsett.unit.test.ts`
Expected: FAIL ("Cannot find module '../korsett'")

- [ ] **Step 3: Korsett-Daten schreiben** — alle Knoten aus `begleiter-korsett-v2.md` übertragen. Auszug (vollständig im Doc übertragen):

```typescript
// src/lib/preflight/korsett.ts
import type { KorsettNode } from './types'

export const KORSETT: KorsettNode[] = [
  // 0 · Projekt-Definition
  { id: 'P0', domain: 'Projekt', frage: 'Greenfield oder bestehende App?', warum: 'Bestehend = Daten-Migration, Breaking-Changes, vorhandene Konventionen übernehmen', default: 'greenfield', kosten: 'red' },
  { id: 'P1', domain: 'Projekt', frage: 'Was baust du (Typ) — und was bewusst NICHT im ersten Wurf?', warum: 'Scope-Grenze; bestimmt Domänen-Overlay', default: '(erfragen)', kosten: 'red' },
  // A · Universell
  { id: 'U1', domain: 'Universell', frage: 'Ziel & Scope in einem Satz', warum: 'Ohne Scope wuchert alles', default: '(erfragen)', kosten: 'red' },
  { id: 'U2', domain: 'Universell', frage: 'Wo ist die SSOT, Code generiert statt dupliziert?', warum: 'Duplikate driften', default: 'DB-Schema = SSOT, Typen generiert', kosten: 'red' },
  { id: 'U3', domain: 'Universell', frage: 'Git ab Commit 1 + CLAUDE.md/README als KI-Kontext?', warum: 'Die KI hat kein Gedächtnis', default: 'sofort', kosten: 'yellow' },
  { id: 'U4', domain: 'Universell', frage: 'Wie werden Secrets gehalten?', warum: 'Klartext-Key im Repo = nicht-rückrufbarer Leak', default: '.env.local gitignored + .env.example', kosten: 'red' },
  { id: 'U5', domain: 'Universell', frage: 'Error-/Logging-Disziplin (kein PII, kein console.log Prod)?', warum: 'Debugbarkeit + Datenschutz', default: 'zentraler Logger', kosten: 'yellow' },
  { id: 'U6', domain: 'Universell', frage: 'Naming & Ordnerstruktur?', warum: 'Lesbarkeit/Fortführbarkeit', default: 'Framework-Standard', kosten: 'red' },
  // B · Frontend
  { id: 'F1', domain: 'Frontend', frage: 'Rendering-Strategie (SSR/SSG/RSC/CSR)?', warum: 'Prägt Datenfetch + Performance', default: 'Next.js App Router, RSC', kosten: 'red', appliesWhen: 'frontend' },
  { id: 'F2', domain: 'Frontend', frage: 'State-Management + UI-Basis?', warum: 'Falsche Wahl = großer Umbau', default: 'Server-State via Query-Lib; Tailwind + 1 Komponenten-Lib', kosten: 'red', appliesWhen: 'frontend' },
  // C · API
  { id: 'API1', domain: 'API', frage: 'Kommunikations-Pattern (Server Actions / Route Handlers / tRPC / REST)?', warum: 'Bestimmt die Client-Server-Grenze', default: 'Next.js Server Actions + Route Handlers', kosten: 'red' },
  // D · Datenbank
  { id: 'D1', domain: 'Datenbank', frage: 'Multi-Tenant (org_id) oder Single?', warum: 'org_id nachrüsten = Albtraum', default: 'wenn je Mehr-Mandanten denkbar → org_id jetzt', kosten: 'red', appliesWhen: 'db' },
  { id: 'D2', domain: 'Datenbank', frage: 'app_users.id = auth.users.id (1:1)?', warum: 'Bestimmt jede RLS-Policy', default: '1:1-Spiegel', kosten: 'red', appliesWhen: 'db' },
  { id: 'D3', domain: 'Datenbank', frage: 'RLS auf jeder Tabelle, in derselben Migration?', warum: 'Tabelle ohne RLS = jeder sieht alles', default: 'RLS-an + Policy mit jedem CREATE TABLE', kosten: 'red', appliesWhen: 'db' },
  { id: 'D4', domain: 'Datenbank', frage: 'Security-Härtung (search_path gepinnt, security_invoker, Rolle im JWT)?', warum: 'Hijacking / RLS-Bypass', default: 'Härtungs-Checkliste', kosten: 'yellow', appliesWhen: 'db' },
  { id: 'D5', domain: 'Datenbank', frage: 'Server/Client-Schreibgrenze (Service-Role nur server-seitig)?', warum: 'Service-Role im Client = ganze DB offen', default: 'Service-Role nie im Client', kosten: 'red', appliesWhen: 'db' },
  { id: 'D6', domain: 'Datenbank', frage: 'Löschen soft / append-only-Historie?', warum: 'Retention/Rollback', default: 'soft-delete User-Daten; append-only Audit', kosten: 'yellow', appliesWhen: 'db' },
  { id: 'D7', domain: 'Datenbank', frage: 'Migrations-Disziplin (Datei zuerst, dann anwenden)?', warum: 'Sonst Git↔DB-Drift', default: 'supabase/migrations, eine pro Änderung', kosten: 'red', appliesWhen: 'db' },
  { id: 'D9', domain: 'Datenbank', frage: 'Storage & Uploads + Bucket-RLS?', warum: 'Öffentlicher Bucket = Leak', default: 'privat default; RLS auf storage.objects', kosten: 'red', appliesWhen: 'uploads' },
  // E · Auth
  { id: 'A1', domain: 'Auth', frage: 'Auth-Methode (Magic-Link/Passwort/OAuth)?', warum: 'Wahl = Flow-Umbau', default: 'Provider-Auth', kosten: 'red', appliesWhen: 'auth' },
  { id: 'A2', domain: 'Auth', frage: 'Account-Lifecycle (Reset, Verify, Löschung)?', warum: 'Löschung = DSGVO', default: 'von Anfang mitdenken', kosten: 'yellow', appliesWhen: 'auth' },
  { id: 'A3', domain: 'Auth', frage: 'Authz-Modell (Rollen/Permissions)?', warum: 'Bestimmt RLS-Komplexität', default: 'Rolle im JWT-Claim', kosten: 'red', appliesWhen: 'auth' },
  // F · PII
  { id: 'PII1', domain: 'PII', frage: 'Datenarten-Inventar?', warum: 'Datensparsamkeit', default: 'nur erheben was nötig', kosten: 'yellow', appliesWhen: 'pii' },
  { id: 'PII2', domain: 'PII', frage: 'Besondere Kategorien (Art. 9) / Kinder (Art. 8)?', warum: 'Strengere Pflichten', default: 'wenn ja → trennen/verschlüsseln', kosten: 'red', appliesWhen: 'pii' },
  { id: 'PII3', domain: 'PII', frage: 'Datenresidenz (EU-Region)?', warum: 'Drittland → Transfer', default: 'EU-Region', kosten: 'red', appliesWhen: 'pii' },
  // G · KI
  { id: 'AI1', domain: 'KI', frage: 'Risiko-Tier (verboten/hochrisiko/begrenzt/minimal)?', warum: 'AI-Act-Pflichten', default: 'meist begrenzt → Transparenz', kosten: 'yellow', appliesWhen: 'ai' },
  { id: 'AI2', domain: 'KI', frage: 'Datenfluss (User-/PII-Daten an LLM? Provider, Retention, AVV)?', warum: 'Sub-Prozessor entsteht sofort', default: 'Zero-Retention/Gateway, AVV', kosten: 'red', appliesWhen: 'ai' },
  { id: 'AI3', domain: 'KI', frage: 'Kosten/Missbrauch (Rate-Limit + Budget-Cap)?', warum: 'Runaway-Rechnung', default: 'ab Tag 1', kosten: 'red', appliesWhen: 'ai' },
  // H · Recht
  { id: 'L1', domain: 'Recht', frage: 'Hosting / Daten-Residenz?', warum: 'EU vs. Drittland → Transfer', default: 'EU', kosten: 'red' },
  { id: 'L2', domain: 'Recht', frage: 'Zielgruppe-Standort?', warum: 'EU-User → DSGVO extraterritorial', default: '(erfragen)', kosten: 'yellow' },
  { id: 'L3', domain: 'Recht', frage: 'Juristische Pflichten (Impressum; Zahlungen → Fernabsatz)?', warum: 'Impressum, Widerruf, AGB', default: '(ableiten)', kosten: 'yellow' },
  { id: 'L4', domain: 'Recht', frage: 'B2C/B2B → BFSG/a11y?', warum: 'B2C-Web = Pflicht seit 2025 (WCAG 2.2/EN 301 549)', default: '(ableiten)', kosten: 'red', appliesWhen: 'b2c' },
  { id: 'L5', domain: 'Recht', frage: 'Sub-Prozessoren & Tracking (AVV-Kette; Cookie-Consent)?', warum: 'Art. 28, TTDSG', default: 'AVV + Consent', kosten: 'yellow' },
  // I · Betrieb
  { id: 'DEP', domain: 'Betrieb', frage: 'Deploy & CI (Hosting-Ziel + Test-Gate)?', warum: 'Hosting bestimmt Sub-Prozessoren + Backup', default: 'Vercel + minimaler CI-Gate', kosten: 'red' },
  { id: 'EM', domain: 'Betrieb', frage: 'Transaktions-E-Mail (Auth-Mails, Notifications)?', warum: 'Provider-Wahl, Sub-Prozessor', default: 'Resend/Postmark; in AVV (L5)', kosten: 'red', appliesWhen: 'auth' },
  { id: 'BG', domain: 'Betrieb', frage: 'Background-Jobs / Cron?', warum: 'Asynchrone Arbeit', default: 'Edge Functions / Cron; Queue nur bei Bedarf', kosten: 'yellow', appliesWhen: 'jobs' },
  { id: 'SEED', domain: 'Betrieb', frage: 'Seed-/Demo-Daten?', warum: 'Reproduzierbarer Start', default: 'Seed-Skript', kosten: 'yellow', appliesWhen: 'greenfield' },
  { id: 'O1', domain: 'Betrieb', frage: 'Observability (woran merkst du, dass Prod kaputt ist)?', warum: 'Ship-and-pray', default: 'Error-Tracking ab Launch', kosten: 'yellow' },
  { id: 'B1', domain: 'Betrieb', frage: 'Umgebungen & Backups (Prod≠Dev, Backup/PITR)?', warum: 'dev-gegen-prod + kein Backup = Katastrophe', default: 'getrennte DBs; Backups an', kosten: 'red' },
]
```

- [ ] **Step 4: Test laufen lassen, grün bestätigen**

Run: `pnpm vitest run src/lib/preflight/__tests__/korsett.unit.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/preflight/korsett.ts src/lib/preflight/__tests__/korsett.unit.test.ts
git commit -m "feat(preflight): Korsett v2 als Daten + Daten-Integritäts-Tests"
```

---

### Task 3: Lücken-Liste (deterministisch) — Kernlogik

**Files:** Create: `src/lib/preflight/gaps.ts`, `src/lib/preflight/__tests__/gaps.unit.test.ts`

- [ ] **Step 1: Failing tests schreiben**

```typescript
// src/lib/preflight/__tests__/gaps.unit.test.ts
import { describe, it, expect } from 'vitest'
import { buildGapList } from '../gaps'
import type { NodeAnalysis } from '../types'

const analysis: NodeAnalysis[] = [
  { id: 'U1', status: 'open' },        // red
  { id: 'U3', status: 'open' },        // yellow
  { id: 'D1', status: 'decided', evidence: 'org_id auf allen Tabellen' },
  { id: 'F1', status: 'na' },
  { id: 'L1', status: 'open' },        // red
]

describe('buildGapList', () => {
  it('trennt offene 🔴 von 🟡', () => {
    const g = buildGapList(analysis)
    expect(g.red.map(x => x.id).sort()).toEqual(['L1', 'U1'])
    expect(g.yellow.map(x => x.id)).toEqual(['U3'])
  })
  it('zählt entschieden + n-a', () => {
    const g = buildGapList(analysis)
    expect(g.decidedCount).toBe(1)
    expect(g.naCount).toBe(1)
  })
  it('reichert Gaps mit Frage/Warum/Default aus dem Korsett an', () => {
    const g = buildGapList(analysis)
    const u1 = g.red.find(x => x.id === 'U1')!
    expect(u1.frage).toContain('Ziel & Scope')
    expect(u1.domain).toBe('Universell')
  })
  it('ignoriert unbekannte IDs robust', () => {
    const g = buildGapList([{ id: 'NICHT_EXISTENT', status: 'open' }])
    expect(g.red).toHaveLength(0)
    expect(g.yellow).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

Run: `pnpm vitest run src/lib/preflight/__tests__/gaps.unit.test.ts`
Expected: FAIL ("Cannot find module '../gaps'")

- [ ] **Step 3: Implementierung**

```typescript
// src/lib/preflight/gaps.ts
import { KORSETT } from './korsett'
import type { NodeAnalysis, Gap, GapList } from './types'

const BY_ID = new Map(KORSETT.map(n => [n.id, n]))

function toGap(id: string): Gap | null {
  const n = BY_ID.get(id)
  if (!n) return null
  return { id: n.id, domain: n.domain, frage: n.frage, warum: n.warum, default: n.default, kosten: n.kosten }
}

export function buildGapList(analysis: NodeAnalysis[]): GapList {
  const red: Gap[] = []
  const yellow: Gap[] = []
  let decidedCount = 0
  let naCount = 0

  for (const a of analysis) {
    if (a.status === 'decided') { decidedCount++; continue }
    if (a.status === 'na') { naCount++; continue }
    const gap = toGap(a.id)
    if (!gap) continue
    if (gap.kosten === 'red') red.push(gap)
    else yellow.push(gap)
  }
  // stabile Sortierung nach Domäne, dann ID
  const byDomain = (a: Gap, b: Gap) => a.domain.localeCompare(b.domain) || a.id.localeCompare(b.id)
  red.sort(byDomain)
  yellow.sort(byDomain)
  return { red, yellow, decidedCount, naCount }
}
```

- [ ] **Step 4: Test laufen lassen, grün bestätigen**

Run: `pnpm vitest run src/lib/preflight/__tests__/gaps.unit.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/preflight/gaps.ts src/lib/preflight/__tests__/gaps.unit.test.ts
git commit -m "feat(preflight): deterministische Lücken-Liste + Tests"
```

---

## Milestone B — LLM-Pässe

### Task 4: Ingest

**Files:** Create: `src/lib/preflight/ingest.ts`, Test: `src/lib/preflight/__tests__/ingest.unit.test.ts`

- [ ] **Step 1: Failing test**

```typescript
// src/lib/preflight/__tests__/ingest.unit.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeInput } from '../ingest'

describe('normalizeInput', () => {
  it('trimmt und behält Text', () => {
    expect(normalizeInput('  hallo welt  ')).toBe('hallo welt')
  })
  it('wirft bei zu kurzem Input', () => {
    expect(() => normalizeInput('hi')).toThrow(/zu kurz/i)
  })
})
```

- [ ] **Step 2: Fehlschlag bestätigen** — Run: `pnpm vitest run src/lib/preflight/__tests__/ingest.unit.test.ts` → FAIL

- [ ] **Step 3: Implementierung** (PDF-Parsing erfolgt in der Route via vorhandenem Reader; `normalizeInput` arbeitet auf Text)

```typescript
// src/lib/preflight/ingest.ts
const MIN_CHARS = 20

export function normalizeInput(raw: string): string {
  const text = raw.trim()
  if (text.length < MIN_CHARS) {
    throw new Error('Input zu kurz — gib mehr Detail (mind. ein paar Sätze oder ein Schema).')
  }
  return text
}
```

- [ ] **Step 4: Grün bestätigen** — Run test → PASS
- [ ] **Step 5: Commit** — `git add ... && git commit -m "feat(preflight): input-normalisierung + test"`

---

### Task 5: Analyse-Pass (LLM, structured)

**Files:** Create: `src/lib/preflight/analyze.ts`, Test: `src/lib/preflight/__tests__/analyze.unit.test.ts`

- [ ] **Step 1: Failing test (LLM gemockt)**

```typescript
// src/lib/preflight/__tests__/analyze.unit.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('ai', () => ({
  generateObject: vi.fn(async () => ({
    object: { nodes: [{ id: 'U1', status: 'open' }, { id: 'D1', status: 'decided', evidence: 'org_id' }] },
  })),
}))
vi.mock('@/lib/llm/anthropic', () => ({ anthropic: () => 'mock-model' }))

import { analyzeInput } from '../analyze'

describe('analyzeInput', () => {
  it('gibt NodeAnalysis[] zurück', async () => {
    const res = await analyzeInput('irgendein design doc text')
    expect(res).toEqual([
      { id: 'U1', status: 'open' },
      { id: 'D1', status: 'decided', evidence: 'org_id' },
    ])
  })
})
```

- [ ] **Step 2: Fehlschlag bestätigen** — Run test → FAIL

- [ ] **Step 3: Implementierung** (echtes Schema + Prompt; Modell über vorhandenen Provider)

```typescript
// src/lib/preflight/analyze.ts
import { generateObject } from 'ai'
import { z } from 'zod'
import { anthropic } from '@/lib/llm/anthropic'
import { KORSETT } from './korsett'
import type { NodeAnalysis } from './types'

const SCHEMA = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    status: z.enum(['decided', 'open', 'na']),
    evidence: z.string().optional(),
  })),
})

const SYSTEM = `Du bist ein Senior-Software-Architekt. Du prüfst ein Design-/Schema-Dokument gegen eine Foundation-Checkliste (das "Korsett"). Für JEDEN Knoten entscheide:
- "decided": Das Dokument zeigt eine getroffene Entscheidung dazu (gib kurze evidence).
- "open": Trifft auf das Projekt zu, ist aber im Dokument NICHT entschieden.
- "na": Trifft auf dieses Projekt nicht zu (z.B. KI-Knoten ohne KI-Features).
Sei ehrlich: bei vagem Input sind die meisten Knoten "open". Erfinde keine Entscheidungen.`

export async function analyzeInput(text: string): Promise<NodeAnalysis[]> {
  const checklist = KORSETT.map(n => `${n.id} [${n.domain}${n.appliesWhen ? `, gilt-wenn:${n.appliesWhen}` : ''}]: ${n.frage}`).join('\n')
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514') as Parameters<typeof generateObject>[0]['model'],
    schema: SCHEMA,
    system: SYSTEM,
    prompt: `KORSETT-KNOTEN:\n${checklist}\n\n---\nDESIGN-DOKUMENT:\n${text}\n\n---\nGib pro Knoten {id, status, evidence?} zurück.`,
  })
  return object.nodes
}
```

> **Hinweis:** Exakter `anthropic(...)`-Aufruf an `src/lib/llm/anthropic.ts` anpassen (Provider-Instanz). Falls dort nur `generateText`/`streamText` exportiert wird, Provider-Factory analog nutzen.

- [ ] **Step 4: Grün bestätigen** — Run test → PASS
- [ ] **Step 5: Commit**

---

### Task 6: Generier-Pass (LLM)

**Files:** Create: `src/lib/preflight/generate.ts`, Test: `src/lib/preflight/__tests__/generate.unit.test.ts`

- [ ] **Step 1: Failing test (LLM gemockt)** — mock `generateObject` so dass `{ decisionLog, claudeMd, envExample, migrationSql }` zurückkommt; assert `generateStartpaket(...)` liefert `Startpaket` mit diesen Feldern und `migrationDraft.sql === migrationSql`.

```typescript
// src/lib/preflight/__tests__/generate.unit.test.ts
import { describe, it, expect, vi } from 'vitest'
vi.mock('ai', () => ({ generateObject: vi.fn(async () => ({
  object: { decisionLog: '# Log', claudeMd: '# CLAUDE', envExample: 'OPENAI_API_KEY=', migrationSql: 'CREATE TABLE x ();' },
})) }))
vi.mock('@/lib/llm/anthropic', () => ({ anthropic: () => 'mock' }))
import { generateStartpaket } from '../generate'

it('baut Startpaket inkl. Migration-Entwurf', async () => {
  const sp = await generateStartpaket('text', [])
  expect(sp.claudeMd).toBe('# CLAUDE')
  expect(sp.migrationDraft?.sql).toBe('CREATE TABLE x ();')
  expect(sp.migrationDraft?.warnings).toEqual([]) // Audit kommt in Task 7
})
```

- [ ] **Step 2: Fehlschlag bestätigen**
- [ ] **Step 3: Implementierung** — `generateObject` mit Schema `{ decisionLog, claudeMd, envExample, migrationSql: z.string().optional() }`; Prompt instruiert: Decision-Log (entschieden→decision, offen→open_question), CLAUDE.md aus Konventionen, .env.example aus Secrets/Sub-Prozessoren, `migrationSql` NUR wenn ein Datenmodell im Input erkennbar ist (sonst weglassen). `migrationDraft` aus `migrationSql` bauen mit `warnings: []` (Audit folgt in Task 7).
- [ ] **Step 4: Grün bestätigen**
- [ ] **Step 5: Commit**

---

### Task 7: Migration-Selbst-Audit

**Files:** Create: `src/lib/preflight/migration-audit.ts`, Test: `src/lib/preflight/__tests__/migration-audit.unit.test.ts`

- [ ] **Step 1: Failing test** — gib eine unsichere SQL (`CREATE VIEW v AS SELECT 1;`) rein, erwarte mind. eine Warnung (sec-db-11). Reuse `buildAuditContextFromFiles` + sec-db-Checker.

```typescript
// src/lib/preflight/__tests__/migration-audit.unit.test.ts
import { describe, it, expect } from 'vitest'
import { auditMigrationSql } from '../migration-audit'

it('flaggt SECURITY DEFINER View', async () => {
  const warnings = await auditMigrationSql('CREATE VIEW public.v AS SELECT 1;')
  expect(warnings.some(w => /security_invoker|SECURITY DEFINER/i.test(w))).toBe(true)
})
it('saubere SQL → keine Warnungen', async () => {
  const warnings = await auditMigrationSql('CREATE TABLE t (id uuid primary key);\nALTER TABLE t ENABLE ROW LEVEL SECURITY;')
  expect(Array.isArray(warnings)).toBe(true)
})
```

- [ ] **Step 2: Fehlschlag bestätigen**
- [ ] **Step 3: Implementierung** — generierte SQL als In-Memory-`fileContents`-Map (`supabase/migrations/000_preflight_draft.sql`) an `buildAuditContextFromFiles` geben, die `sec-db`-Checker (`checkSecurityDefinerViews`, `checkFunctionSearchPath`, `checkRlsOnUserTables`, `checkAnonKeyNoWriteWildcard`) laufen lassen, Findings-Messages sammeln. *Exakte Import-Pfade an `src/lib/audit/index.ts` + `checkers/db-security-checker.ts` anpassen.*
- [ ] **Step 4: Grün bestätigen** (PDF/native deps nicht nötig — reine String-Checker)
- [ ] **Step 5: Commit**

---

### Task 8: Orchestrierung

**Files:** Create: `src/lib/preflight/run.ts`, Test: `src/lib/preflight/__tests__/run.unit.test.ts`

- [ ] **Step 1: Failing test** — mock `analyze`, `generate`, `migration-audit`; assert `runPreflight(text)` liefert `{ gaps, startpaket }` und dass `startpaket.migrationDraft.warnings` aus dem Audit gefüllt sind.
- [ ] **Step 2: Fehlschlag bestätigen**
- [ ] **Step 3: Implementierung**

```typescript
// src/lib/preflight/run.ts
import { normalizeInput } from './ingest'
import { analyzeInput } from './analyze'
import { buildGapList } from './gaps'
import { generateStartpaket } from './generate'
import { auditMigrationSql } from './migration-audit'
import type { PreflightResult } from './types'

export async function runPreflight(raw: string): Promise<PreflightResult> {
  const text = normalizeInput(raw)
  const analysis = await analyzeInput(text)
  const gaps = buildGapList(analysis)
  const startpaket = await generateStartpaket(text, analysis)
  if (startpaket.migrationDraft) {
    startpaket.migrationDraft.warnings = await auditMigrationSql(startpaket.migrationDraft.sql)
  }
  return { gaps, startpaket }
}
```

- [ ] **Step 4: Grün bestätigen**
- [ ] **Step 5: Commit**

---

## Milestone C — API + Persistenz

### Task 9: DB-Migration `preflight_runs`

**Files:** Create: `supabase/migrations/<timestamp>_preflight_runs.sql`

- [ ] **Step 1: Migration schreiben** (RLS in derselben Migration — dogfood sec-db-01)

```sql
-- <timestamp>_preflight_runs.sql
CREATE TABLE preflight_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE preflight_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preflight_runs_select_own_org" ON preflight_runs
  FOR SELECT USING (organization_id = get_my_organization_id());

CREATE POLICY "preflight_runs_delete_own" ON preflight_runs
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_preflight_runs_user_created ON preflight_runs (user_id, created_at DESC);
```

- [ ] **Step 2: Migrationsdatei committen** (Git zuerst), dann anwenden via `supabase db push` (oder MCP); danach `get_advisors(security)` prüfen → keine neuen Findings.
- [ ] **Step 3: Commit**

---

### Task 10: Validator + API-Route

**Files:** Create: `src/lib/validators/preflight.ts`, `src/app/api/preflight/analyze/route.ts`, Test: `src/app/api/preflight/__tests__/analyze.route.test.ts`

- [ ] **Step 1: Validator**

```typescript
// src/lib/validators/preflight.ts
import { z } from 'zod'
export const preflightBody = z.object({ input: z.string().min(1) })
```

- [ ] **Step 2: Failing route-test** — mock `runPreflight`, `getAuthUser`, budget-RPC; assert: 401 ohne Auth · 402 bei Budget · 200 + `{ gaps, startpaket, runId }` im Happy-Path · persist aufgerufen.
- [ ] **Step 3: Implementierung** — Pattern wie bestehende Routen: `getAuthUser()` (401) → `validateBody(preflightBody)` (400) → `check_and_reserve_budget` (402 `BUDGET_EXHAUSTED`) → `runPreflight(input)` → `supabaseAdmin.from('preflight_runs').insert({ organization_id, user_id, input_text, result })` → `{ gaps, startpaket, runId }`. try/catch + `createLogger`. Budget-Kosten in `src/lib/budget.ts` `ESTIMATED_COSTS` ergänzen.
- [ ] **Step 4: Grün bestätigen**
- [ ] **Step 5: Commit**

---

## Milestone D — UI

### Task 11: Eingabe-Screen

**Files:** Create: `src/app/[locale]/(app)/preflight/page.tsx`

- [ ] **Step 1: Implementierung** — `'use client'`. `page-header` (Pflicht-Pattern, Icon 30px) „Pre-Flight". Textarea (Paste) + Datei-Dropzone (.md/.txt/.pdf → bei .md/.txt clientseitig `text()`, .pdf an Route mitschicken/serverseitig parsen) + „Analysieren"-Button (`btn btn-primary`). Bei Klick: `POST /api/preflight/analyze` → State `result` → `<PreflightResult>`. Loading-State. Fehler-Anzeige (`s.error`-Pattern). **Design-System-Pflichtcheck** beachten (CSS-Variablen, Phosphor-Icons, content-max).
- [ ] **Step 2: Manuelle Verifikation** — `pnpm dev`, `/preflight` öffnen, LMS-Schema einfügen, „Analysieren" → Lücken-Liste + Startpaket erscheinen. (Visueller Sweep — Pflicht nach UI-Build.)
- [ ] **Step 3: Commit**

### Task 12: Ergebnis-Komponente

**Files:** Create: `src/app/[locale]/(app)/preflight/_components/PreflightResult.tsx`

- [ ] **Step 1: Implementierung** — Props `{ result: PreflightResult }`. Oben **Reifegrad-Signal** („🔴 {red.length} offen → zuerst entscheiden · {decidedCount} entschieden · {yellow.length} geparkt"). Lücken-Liste: rote Gruppe zuerst (je Gap: `frage`, `warum`, `default`), dann gelbe („Kann später"). Startpaket: Tab-Leiste (`AppTabs`/`app-tab`-Pattern) Decision-Log / CLAUDE.md / Migration-Entwurf / .env.example; jeder Tab = Code-Block + **Copy-Button** (+ Download). Migration-Tab: Warnungen aus `migrationDraft.warnings` als rote Hinweis-Box oben + „Entwurf, prüfen — nicht blind anwenden".
- [ ] **Step 2: Manuelle Verifikation** — Tabs schalten, Copy funktioniert, Warnungen sichtbar.
- [ ] **Step 3: Commit**

---

## Self-Review (vom Plan-Autor)

- **Spec-Coverage:** Engine (Tasks 1–8) · Persistenz/RLS (9) · API+Budget (10) · UI+Startpaket inkl. Migration-Audit-Anzeige (11–12) · Datenschutz (RLS + löschbar in 9) · Tests (jede lib-Task). ✓
- **Graceful degradation (vager Input):** `analyze` markiert Knoten „open"; `generate` lässt Migration weg wenn kein Schema → Lücken-Liste degradiert natürlich. ✓
- **Typ-Konsistenz:** `runPreflight`, `analyzeInput`, `generateStartpaket`, `buildGapList`, `auditMigrationSql` durchgängig gleich benannt. ✓
- **Offene Anpassung bei Ausführung:** exakte Import-Signaturen von `@/lib/llm/anthropic` (generateObject-Modell) und `buildAuditContextFromFiles` am echten Code prüfen — in Tasks 5/7 vermerkt.

## Hinweise zur Ausführung
- Worktree braucht `pnpm install` (Deps für tsc/vitest) — beim Start einrichten.
- Vor jedem Commit: `pnpm tsc --noEmit` + `pnpm eslint` der berührten Dateien grün.
- LLM-*Qualität* (Tasks 5/6) wird nicht unit-getestet, sondern manuell + in den L2-Calls validiert.
