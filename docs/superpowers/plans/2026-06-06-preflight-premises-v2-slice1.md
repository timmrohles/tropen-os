# Pre-Flight Prämissen-Erfassung v2 (Scheibe 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bessere Prämissen (Stack-Auswahl, Plattform, Fernabsatz/Abo) im Intake + Analyse, plus Ehrlichkeit über dünnen Input — ohne den geführten Loop (Scheibe 2).

**Architecture:** Additive Erweiterung der bestehenden Pre-Flight-Engine. Neue Pivot-Felder (JSONB, keine Migration), neue Korsett-Knoten (vom LLM via `appliesWhen` ausgewertet), erweiterter Analyse-Prompt, eine deterministische Dünn-Input-Heuristik, UI-Ergänzungen in IntakePanel + PreflightResult.

**Tech Stack:** TypeScript · Zod · Vitest · Next.js Client Components · Phosphor Icons · AI SDK (`generateObject`).

**Referenz-Spec:** `docs/superpowers/specs/2026-06-06-preflight-premises-v2-slice1-design.md` · **ADR-030**

**Branch:** gestapelt auf `claude/preflight-impl` (PR #46 offen). Arbeitsverzeichnis: `C:/Users/timmr/tropenOS/.claude/worktrees/preflight`.

**Test-Runner-Hinweis:** Einzeldatei via `pnpm exec vitest run <pfad>` (`pnpm test -- <pfad>` filtert hier nicht). ~0 vorbestehende Failures (Baseline wurde gefixt). `pnpm` immer aus dem Worktree-Root.

---

## File Structure

- `src/lib/preflight/types.ts` — +`Platform`, +`CommercialModel`, PreflightPivots +2 Felder, ResultSummary +`thin`, +`normalizePivots()`
- `src/lib/validators/preflight.ts` — pivotsSchema +2 Felder (mit `.default`)
- `src/lib/preflight/korsett.ts` — +8 Knoten (ST1–3, FA1–3, AB1–2)
- `src/lib/preflight/analyze.ts` — `buildSystemPrompt` exportieren + um Pivots/Regeln erweitern
- `src/lib/preflight/run.ts` — +`isThinInput()` Helper, `summary.thin` setzen
- `src/app/[locale]/(app)/preflight/_components/IntakePanel.tsx` — Stack→Select, +Plattform, +Fernabsatz/Abo, +Readiness-Maßstab
- `src/app/[locale]/(app)/preflight/_components/PreflightResult.tsx` — +Dünn-Banner, +Reifegrad-Legende, +Capability-Hinweis
- Tests: `src/lib/preflight/__tests__/{normalize-pivots,korsett,analyze,thin-input}.unit.test.ts` (neu/erweitert), `src/lib/validators/__tests__/preflight.unit.test.ts` (erweitert)

---

## Task 1: Typen + normalizePivots

**Files:**
- Modify: `src/lib/preflight/types.ts`
- Test: `src/lib/preflight/__tests__/normalize-pivots.unit.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { normalizePivots } from '../types'

describe('normalizePivots', () => {
  it('füllt platform/commercialModel-Defaults für alte Pivots', () => {
    const r = normalizePivots({ buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu', stack: 'Next.js' })
    expect(r.platform).toBe('unsure')
    expect(r.commercialModel).toBe('none')
  })
  it('übernimmt vorhandene neue Felder', () => {
    const r = normalizePivots({ platform: 'native', commercialModel: 'subscription' })
    expect(r.platform).toBe('native')
    expect(r.commercialModel).toBe('subscription')
  })
  it('behandelt fehlenden stack als leeren String', () => {
    expect(normalizePivots({}).stack).toBe('')
  })
})
```

- [ ] **Step 2: Run — muss fehlschlagen**

Run: `pnpm exec vitest run src/lib/preflight/__tests__/normalize-pivots.unit.test.ts`
Expected: FAIL (`normalizePivots` nicht exportiert).

- [ ] **Step 3: Typen + Helper implementieren**

In `src/lib/preflight/types.ts`: die `GeoScope`-Zeile ergänzen und `PreflightPivots` erweitern. Ersetze den bestehenden Block:

```typescript
export type BuildTool = 'claude-code' | 'cursor' | 'lovable' | 'bolt' | 'other' | 'unsure'
export type BusinessModel = 'b2c' | 'b2b' | 'internal' | 'unsure'
export type GeoScope = 'eu' | 'non_eu' | 'global' | 'unsure'
export type Platform = 'web' | 'native' | 'both' | 'unsure'
export type CommercialModel = 'none' | 'shop' | 'subscription' | 'marketplace' | 'unsure'

export interface PreflightPivots {
  buildTool: BuildTool
  businessModel: BusinessModel
  audienceRegion: GeoScope
  hosting: GeoScope
  stack: string
  platform: Platform
  commercialModel: CommercialModel
}

/** Füllt fehlende/neue Pivot-Felder mit Defaults (Rückwärtskompatibilität für alte Läufe). */
export function normalizePivots(raw: Partial<PreflightPivots> | null | undefined): PreflightPivots {
  const r = (raw ?? {}) as Partial<PreflightPivots>
  return {
    buildTool: r.buildTool ?? 'unsure',
    businessModel: r.businessModel ?? 'unsure',
    audienceRegion: r.audienceRegion ?? 'unsure',
    hosting: r.hosting ?? 'unsure',
    stack: typeof r.stack === 'string' ? r.stack : '',
    platform: r.platform ?? 'unsure',
    commercialModel: r.commercialModel ?? 'none',
  }
}
```

Außerdem `ResultSummary` um `thin` erweitern (suche `export interface ResultSummary`):

```typescript
export interface ResultSummary {
  projectLabel: string
  headline: string
  /** true, wenn der Input zu knapp für eine fundierte Analyse ist. */
  thin?: boolean
}
```

- [ ] **Step 4: Run — muss bestehen**

Run: `pnpm exec vitest run src/lib/preflight/__tests__/normalize-pivots.unit.test.ts`
Expected: PASS (3 Tests).

- [ ] **Step 5: Typecheck + Commit**

Run: `pnpm typecheck` → PASS.
```bash
git add src/lib/preflight/types.ts src/lib/preflight/__tests__/normalize-pivots.unit.test.ts
git commit -m "feat(preflight): Platform/CommercialModel-Typen, ResultSummary.thin, normalizePivots"
```

---

## Task 2: Validator erweitern

**Files:**
- Modify: `src/lib/validators/preflight.ts`
- Test: `src/lib/validators/__tests__/preflight.unit.test.ts`

- [ ] **Step 1: Failing test ergänzen** — füge in der `describe('preflightBody', …)`-Gruppe hinzu:

```typescript
  it('akzeptiert platform + commercialModel', () => {
    const r = preflightBody.safeParse({ ...base, pivots: { ...base.pivots, platform: 'native', commercialModel: 'shop' } })
    expect(r.success).toBe(true)
  })

  it('setzt Defaults wenn platform/commercialModel fehlen', () => {
    const r = preflightBody.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.pivots.platform).toBe('unsure')
      expect(r.data.pivots.commercialModel).toBe('none')
    }
  })
```

- [ ] **Step 2: Run — muss fehlschlagen**

Run: `pnpm exec vitest run src/lib/validators/__tests__/preflight.unit.test.ts`
Expected: FAIL (platform/commercialModel nicht im Schema / Default fehlt).

- [ ] **Step 3: Schema erweitern** — in `src/lib/validators/preflight.ts` `pivotsSchema` ersetzen:

```typescript
export const pivotsSchema = z.object({
  buildTool: z.enum(['claude-code', 'cursor', 'lovable', 'bolt', 'other', 'unsure']),
  businessModel: z.enum(['b2c', 'b2b', 'internal', 'unsure']),
  audienceRegion: z.enum(['eu', 'non_eu', 'global', 'unsure']),
  hosting: z.enum(['eu', 'non_eu', 'global', 'unsure']),
  stack: z.string(),
  platform: z.enum(['web', 'native', 'both', 'unsure']).default('unsure'),
  commercialModel: z.enum(['none', 'shop', 'subscription', 'marketplace', 'unsure']).default('none'),
})
```

- [ ] **Step 4: Run — muss bestehen**

Run: `pnpm exec vitest run src/lib/validators/__tests__/preflight.unit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/preflight.ts src/lib/validators/__tests__/preflight.unit.test.ts
git commit -m "feat(preflight): validator um platform + commercialModel (mit Defaults)"
```

---

## Task 3: Korsett-Knoten (Store / Fernabsatz / Abo)

**Files:**
- Modify: `src/lib/preflight/korsett.ts`
- Test: `src/lib/preflight/__tests__/korsett.unit.test.ts`

- [ ] **Step 1: Failing test ergänzen** (oder neue Datei, falls keine existiert)

```typescript
import { describe, it, expect } from 'vitest'
import { KORSETT } from '../korsett'

describe('KORSETT v2-Knoten', () => {
  const byId = (id: string) => KORSETT.find(n => n.id === id)

  it('enthält Store-Knoten (appliesWhen native)', () => {
    for (const id of ['ST1', 'ST2', 'ST3']) {
      expect(byId(id), id).toBeDefined()
      expect(byId(id)!.appliesWhen).toBe('native')
    }
  })
  it('enthält Fernabsatz-Knoten (appliesWhen fernabsatz)', () => {
    for (const id of ['FA1', 'FA2', 'FA3']) {
      expect(byId(id), id).toBeDefined()
      expect(byId(id)!.appliesWhen).toBe('fernabsatz')
    }
  })
  it('enthält Abo-Knoten (appliesWhen abo)', () => {
    for (const id of ['AB1', 'AB2']) {
      expect(byId(id), id).toBeDefined()
      expect(byId(id)!.appliesWhen).toBe('abo')
    }
  })
  it('hat eindeutige IDs', () => {
    const ids = KORSETT.map(n => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 2: Run — muss fehlschlagen**

Run: `pnpm exec vitest run src/lib/preflight/__tests__/korsett.unit.test.ts`
Expected: FAIL (ST1 etc. undefined).

- [ ] **Step 3: Knoten hinzufügen** — in `src/lib/preflight/korsett.ts` vor dem schließenden `]` des `KORSETT`-Arrays einfügen:

```typescript
  // J · Store (nur native App)
  { id: 'ST1', domain: 'Store', frage: 'Store-Pflichtangaben (Apple Privacy Labels / Google Data Safety) geplant?', warum: 'Store-Freigabe; falsche/fehlende Angaben → Ablehnung', default: 'vor Submission ausfüllen', kosten: 'red', appliesWhen: 'native' },
  { id: 'ST2', domain: 'Store', frage: 'In-App-Account-Löschung vorhanden (wenn Accounts)?', warum: 'Apple-Pflicht seit 2022 bei Account-Erstellung', default: 'Lösch-Flow in der App', kosten: 'red', appliesWhen: 'native' },
  { id: 'ST3', domain: 'Store', frage: 'Digitale Käufe über IAP statt externem Checkout?', warum: 'Store-Zahlungsregeln; Verstoß → Ablehnung', default: 'digitale Güter → IAP', kosten: 'yellow', appliesWhen: 'native' },
  // K · Fernabsatz (B2C-Verkauf)
  { id: 'FA1', domain: 'Recht', frage: 'Widerrufsrecht + Widerrufsbelehrung + Muster-Formular?', warum: '§312g BGB; fehlend → Abmahnung + 12-Monats-Widerrufsfrist', default: 'Belehrung + Muster bereitstellen', kosten: 'red', appliesWhen: 'fernabsatz' },
  { id: 'FA2', domain: 'Recht', frage: 'Button-Lösung ("zahlungspflichtig bestellen", §312j)?', warum: 'Ohne korrekten Button kommt kein Vertrag zustande', default: 'eindeutige Button-Beschriftung', kosten: 'red', appliesWhen: 'fernabsatz' },
  { id: 'FA3', domain: 'Recht', frage: 'AGB + korrekte Preisangaben (PAngV)?', warum: 'Informations-/Transparenzpflichten', default: 'AGB + korrekte Preisauszeichnung', kosten: 'yellow', appliesWhen: 'fernabsatz' },
  // L · Abo (zusätzlich zu Fernabsatz)
  { id: 'AB1', domain: 'Recht', frage: 'Kündigungsbutton ("Verträge online kündigen", §312k)?', warum: 'Pflicht bei Online-Abos; fehlend → jederzeitige Kündbarkeit + Abmahnung', default: 'Kündigungs-Button ohne Login-Zwang', kosten: 'red', appliesWhen: 'abo' },
  { id: 'AB2', domain: 'Recht', frage: 'Laufzeit/Verlängerung/Kündigungsfristen transparent vor Abschluss?', warum: 'Verbraucherschutz; intransparente Verlängerung unwirksam', default: 'klare Laufzeit-Hinweise', kosten: 'yellow', appliesWhen: 'abo' },
```

- [ ] **Step 4: Run — muss bestehen**

Run: `pnpm exec vitest run src/lib/preflight/__tests__/korsett.unit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/preflight/korsett.ts src/lib/preflight/__tests__/korsett.unit.test.ts
git commit -m "feat(preflight): Korsett-Knoten Store/Fernabsatz/Abo"
```

---

## Task 4: Analyse-Prompt erweitern

**Files:**
- Modify: `src/lib/preflight/analyze.ts`
- Test: `src/lib/preflight/__tests__/analyze.unit.test.ts`

- [ ] **Step 1: `buildSystemPrompt` exportieren** — in `src/lib/preflight/analyze.ts` `function buildSystemPrompt` → `export function buildSystemPrompt`.

- [ ] **Step 2: Failing test** (neue Datei oder ergänzen)

```typescript
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../analyze'

const PIVOTS = { buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu', stack: '', platform: 'native', commercialModel: 'subscription' } as const

describe('buildSystemPrompt v2', () => {
  const p = buildSystemPrompt(PIVOTS)
  it('nennt Plattform + Vertriebsmodell als Fakten', () => {
    expect(p).toContain('Plattform')
    expect(p).toContain('Vertriebsmodell')
  })
  it('enthält Ableitungsregeln für native/shop/subscription', () => {
    expect(p).toMatch(/native/)
    expect(p).toMatch(/fernabsatz|Fernabsatz/)
    expect(p).toMatch(/§312k|Kündigungsbutton|abo|Abo/)
  })
  it('weist bei leerem stack auf Default-Empfehlung hin', () => {
    expect(p).toMatch(/weiß nicht|Default-Stack|Default/)
  })
})
```

- [ ] **Step 3: Run — muss fehlschlagen**

Run: `pnpm exec vitest run src/lib/preflight/__tests__/analyze.unit.test.ts`
Expected: FAIL (Prompt enthält die neuen Strings noch nicht / buildSystemPrompt evtl. noch nicht importierbar).

- [ ] **Step 4: Prompt erweitern** — in `buildSystemPrompt` den „BEKANNTE FAKTEN"-Block um zwei Zeilen ergänzen (nach `- Stack: ${pivots.stack}`):

```
- Plattform: ${pivots.platform}
- Vertriebsmodell: ${pivots.commercialModel}
```

Und im „Leite aus den Pivots direkt ab"-Block diese Regeln anhängen:

```
- platform = 'native' oder 'both' → ST1–ST3 (Store) gelten; Web-Performance-Audit (Lighthouse) ist für native n/a
- platform = 'web' oder 'both' → L3 (Impressum), L5 (Cookie-Consent), L4 (BFSG bei b2c) gelten
- commercialModel = 'shop' → FA1–FA3 (Fernabsatz) gelten — ABER nur wenn businessModel = 'b2c'; bei 'b2b' → na
- commercialModel = 'subscription' → FA1–FA3 UND AB1–AB2 gelten (Abo ist auch Fernabsatz); b2c-Vorbehalt wie oben
- commercialModel = 'marketplace' → FA1–FA3 gelten (Verbraucher-Seite); Marktplatz-Betreiberpflichten kurz im plain/action erwähnen
- commercialModel = 'none' → ST*/FA*/AB*-Verkaufsknoten = na
- stack = '' (leer = "weiß nicht") → behandle den Stack als offen UND empfiehl im 'action'-Feld der betroffenen Knoten einen begründeten Default-Stack für den erkannten Projekttyp
```

- [ ] **Step 5: Run — muss bestehen**

Run: `pnpm exec vitest run src/lib/preflight/__tests__/analyze.unit.test.ts`
Expected: PASS. Falls eine bestehende analyze-Lib-Testdatei `analyzeInput` mit gemocktem `generateObject` testet, bleibt sie grün (nur Prompt-Text geändert).

- [ ] **Step 6: Commit**

```bash
git add src/lib/preflight/analyze.ts src/lib/preflight/__tests__/analyze.unit.test.ts
git commit -m "feat(preflight): analyze-Prompt um Plattform/Vertriebsmodell + Ableitungsregeln"
```

---

## Task 5: Dünn-Input-Heuristik in run.ts

**Files:**
- Modify: `src/lib/preflight/run.ts`
- Test: `src/lib/preflight/__tests__/thin-input.unit.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { isThinInput } from '../run'

const gaps = (decided: number) => ({ red: [], yellow: [], decidedCount: decided, naCount: 0 })

describe('isThinInput', () => {
  it('kurzer Input ist dünn', () => {
    expect(isThinInput('Ich möchte ein LMS bauen', gaps(6))).toBe(true)
  })
  it('langer Input mit Substanz ist nicht dünn', () => {
    const long = 'Ein LMS für Firmen. '.repeat(40) // > 280 Zeichen
    expect(isThinInput(long, gaps(6))).toBe(false)
  })
  it('fast nichts entschieden ist dünn', () => {
    const long = 'x'.repeat(400)
    expect(isThinInput(long, gaps(1))).toBe(true)
  })
})
```

- [ ] **Step 2: Run — muss fehlschlagen**

Run: `pnpm exec vitest run src/lib/preflight/__tests__/thin-input.unit.test.ts`
Expected: FAIL (`isThinInput` nicht exportiert).

- [ ] **Step 3: Helper + Verwendung** — in `src/lib/preflight/run.ts`:

Oben (nach den Imports) hinzufügen:
```typescript
import type { GapList } from './types'

/** Deterministische Heuristik: ist der Input zu knapp für eine fundierte Analyse? */
export function isThinInput(normalizedText: string, gaps: Pick<GapList, 'decidedCount'>): boolean {
  return normalizedText.trim().length < 280 || gaps.decidedCount <= 2
}
```

In `runPreflight`, nach `const gaps = buildGapList(nodes)` und vor dem `return`, das `thin` berechnen und in `summary` setzen:
```typescript
  const thin = isThinInput(text, gaps)
```
und im `return`-Objekt `summary` erweitern:
```typescript
    summary: { projectLabel, headline, thin },
```
(`text` ist die bereits normalisierte Variable aus `normalizeInput(raw)`.)

- [ ] **Step 4: Run — muss bestehen**

Run: `pnpm exec vitest run src/lib/preflight/__tests__/thin-input.unit.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + Commit**

Run: `pnpm typecheck` → PASS.
```bash
git add src/lib/preflight/run.ts src/lib/preflight/__tests__/thin-input.unit.test.ts
git commit -m "feat(preflight): Dünn-Input-Heuristik (summary.thin)"
```

---

## Task 6: IntakePanel — Stack-Auswahl + Plattform + Fernabsatz/Abo + Readiness-Maßstab

**Files:**
- Modify: `src/app/[locale]/(app)/preflight/_components/IntakePanel.tsx`

Kein Verhaltenstest (UI); Gate = `pnpm typecheck` + `pnpm lint:design`.

- [ ] **Step 1: DEFAULT_PIVOTS erweitern** — den Export ersetzen:

```typescript
export const DEFAULT_PIVOTS: PreflightPivots = {
  buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu',
  stack: 'Next.js + Supabase', platform: 'web', commercialModel: 'none',
}
```

- [ ] **Step 2: Stack-Konstanten ergänzen** (oben bei den anderen Konstanten):

```typescript
const STACK_OPTIONS = ['Next.js + Supabase', 'Next.js + Postgres/Prisma', 'React + Firebase', 'Astro', 'Remix', 'SvelteKit', 'Plain HTML/CSS/JS']
```

- [ ] **Step 3: Stack-Feld → Select + „Anderes" + „weiß nicht"**

Ersetze im Pivot-Grid den bestehenden Stack-Block (das `<div style={{ gridColumn: '1 / -1' }}>` mit dem Stack-`<input>`) durch:

```tsx
        <div style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="pf-stack" style={LABEL_STYLE}>Stack</label>
          <select id="pf-stack" className="input" disabled={isLoading}
            value={STACK_OPTIONS.includes(pivots.stack) ? pivots.stack : (pivots.stack === '' ? '__unsure__' : '__other__')}
            onChange={e => {
              const v = e.target.value
              if (v === '__unsure__') set('stack', '')
              else if (v === '__other__') set('stack', ' ') // Platzhalter, Freitext folgt
              else set('stack', v)
            }}
            style={{ width: '100%', fontSize: 13 }}>
            {STACK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            <option value="__other__">Anderes …</option>
            <option value="__unsure__">Weiß nicht</option>
          </select>
          {!STACK_OPTIONS.includes(pivots.stack) && pivots.stack !== '' && (
            <input type="text" className="input" disabled={isLoading} value={pivots.stack.trim()}
              onChange={e => set('stack', e.target.value)} placeholder="z.B. Vue + Laravel"
              style={{ width: '100%', fontSize: 13, marginTop: 6 }} aria-label="Eigener Stack" />
          )}
        </div>
```

- [ ] **Step 4: Plattform + Vertriebsmodell als zwei neue Selects** — direkt vor dem Stack-Block (innerhalb des Pivot-Grids) einfügen:

```tsx
        <div>
          <label htmlFor="pf-platform" style={LABEL_STYLE}>Web oder App?</label>
          <select id="pf-platform" className="input" disabled={isLoading} value={pivots.platform}
            onChange={e => set('platform', e.target.value as PreflightPivots['platform'])} style={{ width: '100%', fontSize: 13 }}>
            <option value="web">Web-App</option>
            <option value="native">Native App (Store)</option>
            <option value="both">Beides</option>
            <option value="unsure">Weiß nicht</option>
          </select>
        </div>
        <div>
          <label htmlFor="pf-commercial" style={LABEL_STYLE}>Verkauf?</label>
          <select id="pf-commercial" className="input" disabled={isLoading} value={pivots.commercialModel}
            onChange={e => set('commercialModel', e.target.value as PreflightPivots['commercialModel'])} style={{ width: '100%', fontSize: 13 }}>
            <option value="none">Kein Verkauf</option>
            <option value="shop">Shop (Einmalkauf)</option>
            <option value="subscription">Abo</option>
            <option value="marketplace">Marktplatz</option>
            <option value="unsure">Weiß nicht</option>
          </select>
        </div>
```

- [ ] **Step 5: Readiness-Maßstab über der Textarea** — direkt vor dem `<label htmlFor="pf-input" …>` einfügen:

```tsx
      <div style={{ background: 'var(--surface-cool)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
          Damit die Analyse etwas taugt, sollte deine Beschreibung enthalten:
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7 }}>
          <li><b>Was &amp; für wen</b> — was die App tut, für welche Nutzer (1 Satz)</li>
          <li><b>Kern-Funktionen</b> — was Nutzer konkret tun können (3–5 Stichpunkte)</li>
          <li><b>Nutzer &amp; Daten</b> — Logins/Konten? welche Daten?</li>
          <li><b>Verkauf?</b> — kostenlos, Shop oder Abo?</li>
        </ul>
        <p style={{ margin: '6px 0 0', fontSize: 11, fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
          Fehlt das meiste, ist die Analyse generisch — eine geführte Entwicklung dazu kommt bald.
        </p>
      </div>
```

- [ ] **Step 6: `Info`-Icon importieren** — die Phosphor-Import-Zeile erweitern:

```typescript
import { UploadSimple, ArrowRight, Warning, X, Info } from '@phosphor-icons/react'
```

- [ ] **Step 7: Typecheck + lint:design**

Run: `pnpm typecheck` → PASS.
Run: `pnpm lint:design` → 0 Errors (rgba/var ok; nur Phosphor-Icons).

- [ ] **Step 8: Commit**

```bash
git add "src/app/[locale]/(app)/preflight/_components/IntakePanel.tsx"
git commit -m "feat(preflight): Stack-Auswahl + Plattform + Fernabsatz/Abo + Readiness-Maßstab"
```

---

## Task 7: PreflightResult — Dünn-Banner + Reifegrad-Legende + Capability-Hinweis

**Files:**
- Modify: `src/app/[locale]/(app)/preflight/_components/PreflightResult.tsx`

- [ ] **Step 1: Icons importieren** — die Phosphor-Import-Zeile erweitern (ergänze `Info`):

```typescript
import { Warning, CheckCircle, Clock, Info } from '@phosphor-icons/react'
```

- [ ] **Step 2: Dünn-Banner-Komponente** — vor dem `export function PreflightResult` einfügen:

```tsx
function ThinBanner() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', marginBottom: 20, borderRadius: 8, background: 'rgba(229,160,0,0.10)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--status-risky)' }}>
      <Warning size={18} weight="fill" color="var(--status-risky)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--status-risky)' }}>Dein Konzept ist sehr knapp.</p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Die Analyse ist deshalb generisch und das Startpaket nur ein grobes Gerüst — noch nicht <i>dein</i> Fundament.
          Damit es konkret wird, sollte deine Beschreibung enthalten: <b>Was &amp; für wen</b> · <b>Kern-Funktionen</b> · <b>Nutzer &amp; Daten</b> · <b>Verkauf?</b>
          {' '}(Die geführte Entwicklung dazu kommt als Nächstes.)
        </p>
      </div>
    </div>
  )
}

function CapabilityNote() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 24, padding: '12px 16px', borderRadius: 8, background: 'var(--surface-cool)', border: '1px solid var(--border)' }}>
      <Info size={16} weight="bold" color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        <b style={{ color: 'var(--text-secondary)' }}>Gut beurteilbar:</b> Architektur, Konventionen, Sicherheit &amp; rechtliche Trigger aus deinem Konzept.{' '}
        <b style={{ color: 'var(--text-secondary)' }}>Grenzen:</b> ersetzt keine Rechtsberatung, bewertet nicht deinen Markt/Geschäftsmodell, und sieht nur, was im Konzept steht.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Reifegrad-Legende als eigene Mini-Komponente** — vor `export function PreflightResult` einfügen (kein Eingriff in `ReifegradSignal` selbst). Der negative `marginTop` zieht die Legende direkt unter die Leiste (die `marginBottom: 24` hat):

```tsx
function ReifegradLegend() {
  return (
    <p style={{ margin: '-18px 0 24px', fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
      offen = zuerst entscheiden · entschieden = schon klar · geparkt = kann später · n.r. = trifft nicht zu
    </p>
  )
}
```

- [ ] **Step 4: Banner + Capability im Haupt-Export einbinden** — `PreflightResult` ersetzen:

```tsx
export function PreflightResult({ result }: Props) {
  const { summary, gaps } = result
  return (
    <div style={{ marginTop: 8 }}>
      {summary.thin && <ThinBanner />}
      <ResultSummaryBox summary={summary} />
      <ReifegradSignal gaps={gaps} />
      <ReifegradLegend />

      <GapsSection gaps={gaps} />

      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', marginBottom: 12, letterSpacing: '0.02em' }}>
          <span style={{ width: 28, height: 1, background: 'rgba(45,122,80,0.3)', flexShrink: 0 }} />
          Dein Startpaket
        </span>
        <ArtifactBrowser result={result} />
      </div>

      <CapabilityNote />
    </div>
  )
}
```

- [ ] **Step 5: Typecheck + lint:design**

Run: `pnpm typecheck` → PASS.
Run: `pnpm lint:design` → 0 Errors.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(app)/preflight/_components/PreflightResult.tsx"
git commit -m "feat(preflight): Dünn-Banner + Reifegrad-Legende + Capability-Hinweis"
```

---

## Task 8: Gesamt-Verifikation

- [ ] **Step 1: Alle Preflight-Tests**

Run: `pnpm exec vitest run src/lib/preflight src/lib/validators`
Expected: alle grün.

- [ ] **Step 2: Typecheck + Lints**

Run: `pnpm typecheck && pnpm lint && pnpm lint:design`
Expected: keine Fehler.

- [ ] **Step 3: Dev-Server + visueller Sweep**

`pnpm dev`, dann `http://localhost:3001/de/preflight` (DevTools „Disable cache"):
- Intake: Stack ist Auswahl (+ „Anderes"→Freitext, „Weiß nicht"); neue Selects Web/App + Verkauf; Readiness-Maßstab über der Textarea.
- Dünner Input („Ich will ein LMS bauen") → Ergebnis zeigt **amber Dünn-Banner** oben.
- Reicher Input → kein Banner.
- Reifegrad-Leiste hat die Legende darunter.
- Capability-Hinweis am Ende.
- Native + Abo wählen → in den Lücken erscheinen Store-/Kündigungsbutton-Themen.

- [ ] **Step 4: Abschluss-Commit (falls Sweep-Korrekturen)**

```bash
git add -A && git commit -m "fix(preflight): visueller Sweep Scheibe 1"
```

---

## Self-Review (vom Plan-Autor)

- **Spec-Abdeckung:** Typen+normalize (T1), Validator (T2), Korsett 8 Knoten (T3), Prompt-Regeln (T4), Dünn-Heuristik (T5), Intake Stack-Auswahl+Plattform+Fernabsatz+Readiness-Maßstab (T6), Banner+Legende+Capability (T7), Verifikation (T8). ✔ Bewusst draußen (Scheibe 2): geführter Loop, Generierungs-Gate, KI-Defaults, SEO/Last-UI. ✔
- **Platzhalter:** keine — echter Code/Befehle. ✔
- **Typ-Konsistenz:** `Platform`/`CommercialModel`/`normalizePivots`/`ResultSummary.thin` (T1) konsistent in Validator (T2), run (T5), Intake (T6), Result (T7) verwendet; `isThinInput` (T5) Signatur stimmt mit Test überein; `buildSystemPrompt` (T4) exportiert + getestet. ✔
- **Offen/bewusst:** `__other__`-Platzhalter setzt `stack=' '` (ein Space) als Trigger fürs Freitextfeld — beim Submit getrimmt; `''` bleibt „weiß nicht". Dokumentiert in T6.
