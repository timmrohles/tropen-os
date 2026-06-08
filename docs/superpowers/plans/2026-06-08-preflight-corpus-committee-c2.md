# Pre-Flight Komitee-Kuration des Regelkorpus (Scheibe C2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den hand-kuratierten 55-Regel-Seed via Multi-Modell-Komitee aus den 25 Agent-Packs auf einen straffen ~80–120-Regel-Korpus erweitern (kuratieren, nicht akkumulieren), inkl. neuer Abschnitte (Testing/Git) und mehr Stacks — mit geschlossenem, geteiltem Tag-Vokabular.

**Architecture:** Deterministisches Fundament zuerst (Vokabular · Sektionen · `deriveCorpusTags`-Erweiterung · `FULL_CORPUS`-Merge · Tests), dann ein Offline-Komitee-Skript (`generate-corpus.ts`, Muster von `generate-agents.ts`), das die Packs in `ConventionRule`-JSON transformiert → `rule-corpus.generated.ts`. Der echte Komitee-Lauf ist ein bewusster €/Review-Schritt (Controller/Mensch).

**Tech Stack:** TypeScript · Vitest · AI SDK `generateText` mit direkten Provider-Keys (ANTHROPIC/OPENAI/GOOGLE/XAI) · Modelle `claude-sonnet-4-20250514` / `gpt-4o` / `gemini-2.5-pro` / `grok-4`, Judge `claude-opus-4-20250514`.

**Spec:** `docs/superpowers/specs/2026-06-08-preflight-corpus-committee-c2-design.md`

**Branch:** `claude/preflight-corpus-c2` (von `main`). Worktree-Root `C:/Users/timmr/tropenOS/.claude/worktrees/preflight`, `pnpm` von dort. Einzeltest: `pnpm exec vitest run <pfad>`.

**Korrektur ggü. Spec:** Provider = **direkte Keys** (nicht AI-Gateway); Primärquelle = **die 25 Agent-Packs** (`docs/agents/*.md`), `rule-registry` ist vorerst draußen (Prosa-Packs sind die sauberere Quelle).

---

## File Structure

- `src/lib/preflight/corpus/vocabulary.ts` — geschlossenes Vokabular (Sections, Stack-Tags, alle Tags) als Single Source
- `src/lib/preflight/corpus/types.ts` — `ConventionSection` += `'testing'` `'git'`
- `src/lib/preflight/corpus/rule-corpus.generated.ts` — `GENERATED_CORPUS` (startet `[]`)
- `src/lib/preflight/corpus/render.ts` — neue Stacks in `deriveCorpusTags` · `SECTION_ORDER`/`SECTION_TITLE` += testing/git · `FULL_CORPUS`-Merge
- `src/scripts/generate-corpus.ts` — Komitee-Skript (Pack → ConventionRule-JSON)
- `src/scripts/corpus-gen/` — testbare Helfer (parse/dedupe/validate)

---

## Task 1: Geschlossenes Vokabular + Section-Typ

**Files:**
- Create: `src/lib/preflight/corpus/vocabulary.ts`
- Modify: `src/lib/preflight/corpus/types.ts`
- Test: `src/lib/preflight/corpus/__tests__/vocabulary.unit.test.ts`

- [ ] **Step 1: types.ts erweitern** — `ConventionSection` um zwei Werte ergänzen (Reihenfolge egal):
```typescript
export type ConventionSection =
  | 'overview'
  | 'architecture'
  | 'code-rules'
  | 'naming'
  | 'structure'
  | 'db'
  | 'error-handling'
  | 'testing'
  | 'git'
  | 'security'
  | 'maintenance'
```

- [ ] **Step 2: Failing test** — `src/lib/preflight/corpus/__tests__/vocabulary.unit.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { STACK_TAGS, OTHER_TAGS, ALL_TAGS, CONTENT_SECTIONS } from '../vocabulary'

describe('vocabulary', () => {
  it('Stack-Tags enthalten astro + die Kern-Frameworks', () => {
    expect(STACK_TAGS).toContain('stack:astro')
    expect(STACK_TAGS).toContain('stack:next')
    expect(STACK_TAGS).toContain('stack:react-native')
  })
  it('ALL_TAGS = STACK_TAGS ∪ OTHER_TAGS, eindeutig', () => {
    expect(ALL_TAGS.length).toBe(new Set(ALL_TAGS).size)
    expect(ALL_TAGS).toEqual(expect.arrayContaining([...STACK_TAGS, ...OTHER_TAGS]))
  })
  it('OTHER_TAGS enthält db/auth/platform/commerce', () => {
    expect(OTHER_TAGS).toEqual(expect.arrayContaining(['db:true', 'auth:true', 'platform:web', 'platform:native', 'commerce:true']))
  })
  it('CONTENT_SECTIONS enthält testing + git', () => {
    expect(CONTENT_SECTIONS).toContain('testing')
    expect(CONTENT_SECTIONS).toContain('git')
  })
})
```

- [ ] **Step 3: Run — muss fehlschlagen** → `pnpm exec vitest run src/lib/preflight/corpus/__tests__/vocabulary.unit.test.ts`

- [ ] **Step 4: vocabulary.ts** — `src/lib/preflight/corpus/vocabulary.ts`:
```typescript
// src/lib/preflight/corpus/vocabulary.ts
// Geschlossenes, geteiltes Vokabular — von deriveCorpusTags, Komitee-Skript UND Tests genutzt.
// Korpus-Tags MÜSSEN Teilmenge von ALL_TAGS sein, sonst tote (nie gerenderte) Regeln.
import type { ConventionSection } from './types'

export const STACK_TAGS = [
  'stack:react', 'stack:next', 'stack:vue', 'stack:nuxt', 'stack:svelte', 'stack:astro',
  'stack:remix', 'stack:solid', 'stack:angular', 'stack:node', 'stack:python', 'stack:rails',
  'stack:go', 'stack:php', 'stack:java', 'stack:dotnet', 'stack:react-native', 'stack:flutter',
  'stack:swift', 'stack:kotlin',
] as const

export const OTHER_TAGS = ['db:true', 'auth:true', 'platform:web', 'platform:native', 'commerce:true'] as const

export const ALL_TAGS: string[] = [...STACK_TAGS, ...OTHER_TAGS]

/** Sektionen, die aus dem Korpus gerendert werden (overview/architecture = LLM-Schicht, nicht hier). */
export const CONTENT_SECTIONS: ConventionSection[] = [
  'code-rules', 'naming', 'structure', 'db', 'error-handling', 'testing', 'git', 'security', 'maintenance',
]
```

- [ ] **Step 5: Run grün + Typecheck + Commit**
```bash
pnpm exec vitest run src/lib/preflight/corpus/__tests__/vocabulary.unit.test.ts
pnpm typecheck
git add src/lib/preflight/corpus/vocabulary.ts src/lib/preflight/corpus/types.ts src/lib/preflight/corpus/__tests__/vocabulary.unit.test.ts
git commit -m "feat(preflight): geschlossenes Korpus-Vokabular + testing/git Sections"
```

---

## Task 2: deriveCorpusTags um neue Stacks erweitern

**Files:**
- Modify: `src/lib/preflight/corpus/render.ts`
- Modify Test: `src/lib/preflight/corpus/__tests__/render.unit.test.ts`

- [ ] **Step 1: Failing test ergänzen** (in der bestehenden `deriveCorpusTags`-describe):
```typescript
it('erkennt erweiterte Stacks', () => {
  const t = (stack: string) => deriveCorpusTags({ ...base, stack }, [])
  expect(t('Astro + Tailwind')).toContain('stack:astro')
  expect(t('Django REST')).toContain('stack:python')
  expect(t('Ruby on Rails')).toContain('stack:rails')
  expect(t('Laravel')).toContain('stack:php')
  expect(t('Spring Boot')).toContain('stack:java')
  expect(t('Expo / React Native')).toContain('stack:react-native')
  expect(t('SvelteKit')).toContain('stack:svelte')
})
it('gibt nur Tags aus dem Vokabular zurück', () => {
  const tags = deriveCorpusTags({ ...base, stack: 'Next.js + Supabase + Stripe', commercialModel: 'shop' }, [])
  // (Import ALL_TAGS oben ergänzen)
  for (const tag of tags) expect(ALL_TAGS).toContain(tag)
})
```
(Import oben: `import { ALL_TAGS } from '../vocabulary'`.)

- [ ] **Step 2: Run — muss fehlschlagen** (astro etc. fehlen)

- [ ] **Step 3: deriveCorpusTags erweitern** — in `render.ts` den Stack-Block ersetzen durch eine Keyword→Tag-Tabelle:
```typescript
const STACK_KEYWORDS: Array<[RegExp, string]> = [
  [/\bnext\.?js\b/, 'stack:next'],
  [/\bremix\b/, 'stack:remix'],
  [/\bgatsby\b/, 'stack:react'],
  [/\bastro\b/, 'stack:astro'],
  [/\bnuxt\b/, 'stack:nuxt'],
  [/\bsveltekit|svelte\b/, 'stack:svelte'],
  [/\bsolid(js)?\b/, 'stack:solid'],
  [/\bangular\b/, 'stack:angular'],
  [/\bvue\b/, 'stack:vue'],
  [/\b(react native|expo)\b/, 'stack:react-native'],
  [/\breact\b/, 'stack:react'],
  [/\b(django|fastapi|flask|python)\b/, 'stack:python'],
  [/\b(rails|ruby on rails)\b/, 'stack:rails'],
  [/\blaravel\b/, 'stack:php'],
  [/\b(spring|kotlin\s+spring)\b/, 'stack:java'],
  [/\b(\.net|dotnet|asp\.net|c#)\b/, 'stack:dotnet'],
  [/\bflutter\b/, 'stack:flutter'],
  [/\bswiftui|\bswift\b/, 'stack:swift'],
  [/\bkotlin\b/, 'stack:kotlin'],
  [/\bgolang|\bgo\b/, 'stack:go'],
  [/\b(express|nest(js)?|node(\.?js)?)\b/, 'stack:node'],
  [/\bphp\b/, 'stack:php'],
]
```
und im Funktionskörper die bisherigen `stack:react`/`stack:next`/`stack:vue`-Zeilen ersetzen durch:
```typescript
  for (const [re, tag] of STACK_KEYWORDS) {
    if (re.test(stack)) tags.add(tag)
  }
```
(Die db/auth/platform/commerce-Logik + den `next→react`-Bezug beibehalten: nach der Schleife ergänzen `if (tags.has('stack:next') || tags.has('stack:remix') || tags.has('stack:astro')) tags.add('stack:react')` ist NICHT nötig — Astro/Remix sind eigene Tags. Nur sicherstellen, dass `next` zusätzlich `react` setzt, falls Regeln das erwarten: `if (tags.has('stack:next')) tags.add('stack:react')`.)
Die bestehende DB/Auth-Keyword-Erkennung (supabase/postgres/… , clerk/nextauth/…) + platform + commerce unverändert lassen.

- [ ] **Step 4: Run grün** (render.unit.test.ts komplett) + `pnpm typecheck`

- [ ] **Step 5: Commit**
```bash
git add src/lib/preflight/corpus/render.ts src/lib/preflight/corpus/__tests__/render.unit.test.ts
git commit -m "feat(preflight): deriveCorpusTags erkennt erweitertes Stack-Vokabular"
```

---

## Task 3: GENERATED_CORPUS (leer) + FULL_CORPUS-Merge + neue Sektionen rendern

**Files:**
- Create: `src/lib/preflight/corpus/rule-corpus.generated.ts`
- Modify: `src/lib/preflight/corpus/render.ts`

- [ ] **Step 1: Leere generierte Datei anlegen** — `src/lib/preflight/corpus/rule-corpus.generated.ts`:
```typescript
// src/lib/preflight/corpus/rule-corpus.generated.ts
// Vom Komitee (generate-corpus.ts) erzeugt. NICHT von Hand editieren — wird beim Lauf überschrieben.
// Startet leer; bis der Komitee-Lauf läuft, ist der Korpus = Hand-Seed.
import type { ConventionRule } from './types'

export const GENERATED_CORPUS: ConventionRule[] = []
```

- [ ] **Step 2: render.ts — FULL_CORPUS + neue Sektionen.**
  - Import ergänzen: `import { GENERATED_CORPUS } from './rule-corpus.generated'`
  - Nach den Imports: `const FULL_CORPUS: ConventionRule[] = [...RULE_CORPUS, ...GENERATED_CORPUS]`
  - In `renderConventions`: `filterCorpus(RULE_CORPUS, tags)` → `filterCorpus(FULL_CORPUS, tags)`.
  - In `SECTION_ORDER` `testing` + `git` ergänzen (nach `error-handling`): `[..., 'error-handling', 'testing', 'git', 'security', 'maintenance']`.
  - In `SECTION_TITLE` ergänzen: `testing: 'Testing'`, `git: 'Git & Commits'`.

- [ ] **Step 3: Bestehende Tests bleiben grün** → `pnpm exec vitest run src/lib/preflight/corpus` + `pnpm typecheck`. (Leeres GENERATED_CORPUS ändert das Verhalten nicht → alles grün.)

- [ ] **Step 4: Commit**
```bash
git add src/lib/preflight/corpus/rule-corpus.generated.ts src/lib/preflight/corpus/render.ts
git commit -m "feat(preflight): FULL_CORPUS-Merge (Hand+generiert) + testing/git Render-Sektionen"
```

---

## Task 4: Vokabular-Kohärenz- + Struktur-Test über FULL_CORPUS

**Files:**
- Test: `src/lib/preflight/corpus/__tests__/corpus-integrity.unit.test.ts`
- (ggf.) Modify: `src/lib/preflight/corpus/render.ts` — `FULL_CORPUS` exportieren, falls nicht schon.

- [ ] **Step 1: `FULL_CORPUS` exportieren** in render.ts (`export const FULL_CORPUS …`).

- [ ] **Step 2: Test** — `src/lib/preflight/corpus/__tests__/corpus-integrity.unit.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { FULL_CORPUS, deriveCorpusTags } from '../render'
import { ALL_TAGS, STACK_TAGS } from '../vocabulary'
import type { ConventionSection, PreflightPivots } from '../types'

const VALID_SECTIONS: ConventionSection[] = ['code-rules','naming','structure','db','error-handling','testing','git','security','maintenance']

describe('Korpus-Integrität (Hand + generiert)', () => {
  it('IDs eindeutig über den gesamten Korpus', () => {
    const ids = FULL_CORPUS.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('jede Regel-Section ist gültig (keine overview/architecture im Korpus)', () => {
    for (const r of FULL_CORPUS) expect(VALID_SECTIONS).toContain(r.section)
  })
  it('jedes appliesWhen-Tag stammt aus dem Vokabular (keine toten Regeln)', () => {
    for (const r of FULL_CORPUS) for (const t of r.appliesWhen ?? []) expect(ALL_TAGS).toContain(t)
  })
  it('jedes Stack-Tag ist von deriveCorpusTags produzierbar', () => {
    // Map jedes stack:-Tag auf einen Beispiel-Stack-String und prüfe, dass deriveCorpusTags es ausgibt.
    const sample: Record<string, string> = {
      'stack:react':'React','stack:next':'Next.js','stack:vue':'Vue','stack:nuxt':'Nuxt','stack:svelte':'SvelteKit',
      'stack:astro':'Astro','stack:remix':'Remix','stack:solid':'SolidJS','stack:angular':'Angular','stack:node':'Express Node.js',
      'stack:python':'Django','stack:rails':'Ruby on Rails','stack:go':'Golang','stack:php':'Laravel','stack:java':'Spring Boot',
      'stack:dotnet':'.NET','stack:react-native':'Expo React Native','stack:flutter':'Flutter','stack:swift':'SwiftUI','stack:kotlin':'Kotlin',
    }
    const base = { buildTool:'cursor', businessModel:'b2c', audienceRegion:'eu', hosting:'eu', platform:'web', commercialModel:'none' } as PreflightPivots
    for (const tag of STACK_TAGS) {
      const tags = deriveCorpusTags({ ...base, stack: sample[tag] ?? '' }, [])
      expect(tags, `${tag} aus „${sample[tag]}"`).toContain(tag)
    }
  })
})
```

- [ ] **Step 3: Run grün** (mit leerem GENERATED_CORPUS prüft es v.a. den Seed + die Stack-Produzierbarkeit). Falls ein Stack-Tag NICHT produzierbar ist → `deriveCorpusTags` (Task 2) nachschärfen.

- [ ] **Step 4: Commit**
```bash
git add src/lib/preflight/corpus/render.ts src/lib/preflight/corpus/__tests__/corpus-integrity.unit.test.ts
git commit -m "test(preflight): Korpus-Integritäts- + Vokabular-Kohärenz-Test"
```

---

## Task 5: Komitee-Skript `generate-corpus.ts` (mit testbaren Helfern)

**Files:**
- Create: `src/scripts/corpus-gen/extract.ts` (Pack-Lesen) · `src/scripts/corpus-gen/postprocess.ts` (parse/dedupe/validate)
- Create: `src/scripts/generate-corpus.ts` (Orchestrierung)
- Test: `src/scripts/corpus-gen/__tests__/postprocess.unit.test.ts`

Modell für die Orchestrierung ist **`src/scripts/generate-agents.ts`** (4 Provider parallel via `callProvider`/`generateText`, Judge, Retry, direkte Keys). Der Implementer liest diese Datei und spiegelt das Muster — der Unterschied: **JSON-Output statt Markdown**.

- [ ] **Step 1: Failing test für die Post-Processing-Helfer** — `src/scripts/corpus-gen/__tests__/postprocess.unit.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { parseRules, validateAgainstVocab, dedupeRules } from '../postprocess'

const RAW = '```json\n[{"id":"test-1","section":"testing","rule":"Schreibe Tests.","severity":"must","source":"agent:TESTING"}]\n```'

describe('parseRules', () => {
  it('parst JSON aus Markdown-Fences', () => {
    const r = parseRules(RAW)
    expect(r).toHaveLength(1); expect(r[0].id).toBe('test-1')
  })
  it('gibt [] bei Müll zurück (kein Throw)', () => {
    expect(parseRules('kein json')).toEqual([])
  })
})
describe('validateAgainstVocab', () => {
  it('verwirft Regeln mit ungültiger Section oder ungültigem Tag', () => {
    const rules = [
      { id:'a', section:'testing', rule:'x', severity:'must', source:'s' },
      { id:'b', section:'BOGUS', rule:'y', severity:'must', source:'s' },
      { id:'c', section:'db', rule:'z', appliesWhen:['stack:cobol'], severity:'must', source:'s' },
    ] as never[]
    const ok = validateAgainstVocab(rules)
    expect(ok.map(r => r.id)).toEqual(['a'])
  })
})
describe('dedupeRules', () => {
  it('entfernt IDs die schon im Seed sind + interne Doppel', () => {
    const rules = [
      { id:'seed-x', section:'db', rule:'a', severity:'must', source:'s' },
      { id:'new-1', section:'db', rule:'b', severity:'must', source:'s' },
      { id:'new-1', section:'db', rule:'b2', severity:'must', source:'s' },
    ] as never[]
    const out = dedupeRules(rules, new Set(['seed-x']))
    expect(out.map(r => r.id)).toEqual(['new-1'])
  })
})
```

- [ ] **Step 2: Run — muss fehlschlagen**

- [ ] **Step 3: postprocess.ts** — `src/scripts/corpus-gen/postprocess.ts`:
```typescript
import type { ConventionRule } from '@/lib/preflight/corpus/types'
import { ALL_TAGS, CONTENT_SECTIONS } from '@/lib/preflight/corpus/vocabulary'

/** Extrahiert JSON-Array aus LLM-Antwort (mit/ohne ```-Fences). Nie werfen. */
export function parseRules(text: string): ConventionRule[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = (fenced ? fenced[1] : text).trim()
  const start = body.indexOf('['), end = body.lastIndexOf(']')
  if (start === -1 || end === -1) return []
  try {
    const arr = JSON.parse(body.slice(start, end + 1))
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

/** Behält nur Regeln mit gültiger Section + gültigen Tags (sonst tote Regeln). */
export function validateAgainstVocab(rules: ConventionRule[]): ConventionRule[] {
  return rules.filter(r =>
    r && typeof r.id === 'string' && typeof r.rule === 'string' && r.rule.trim().length > 8 &&
    CONTENT_SECTIONS.includes(r.section) &&
    (r.severity === 'must' || r.severity === 'should') &&
    (!r.appliesWhen || r.appliesWhen.every(t => ALL_TAGS.includes(t))),
  )
}

/** Entfernt IDs die im Seed sind + interne Duplikate (erste gewinnt). */
export function dedupeRules(rules: ConventionRule[], seedIds: Set<string>): ConventionRule[] {
  const seen = new Set(seedIds), out: ConventionRule[] = []
  for (const r of rules) { if (seen.has(r.id)) continue; seen.add(r.id); out.push(r) }
  return out
}
```

- [ ] **Step 4: Run grün** → `pnpm exec vitest run src/scripts/corpus-gen/__tests__/postprocess.unit.test.ts`

- [ ] **Step 5: extract.ts** — `src/scripts/corpus-gen/extract.ts`:
```typescript
import { readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

export interface PackSource { name: string; content: string }

/** Liest alle Agent-Packs (docs/agents/*.md) als Quelle. */
export function readAgentPacks(): PackSource[] {
  const dir = join(resolve(process.cwd()), 'docs', 'agents')
  return readdirSync(dir).filter(f => f.endsWith('.md')).map(f => ({
    name: f.replace(/\.md$/, ''),
    content: readFileSync(join(dir, f), 'utf-8'),
  }))
}
```

- [ ] **Step 6: generate-corpus.ts** — Orchestrierung, gespiegelt von `generate-agents.ts`. Der Implementer übernimmt von dort: `getAnthropicModel/getOpenAIModel/getGeminiModel/getGrokModel`, `callProvider`, die 4-parallel-Promise + Judge-Struktur, `sleep`, das `main()`-Provider-Check-Gerüst. Pro Pack:
  1. System-Prompt: „Du transformierst Agent-Pack-Regeln in ConventionRule-JSON. Nutze NUR diese Sections: `[CONTENT_SECTIONS]` und NUR diese appliesWhen-Tags: `[ALL_TAGS]`. Framing imperativ („tun"). Konsolidiere Ähnliche. Output: NUR ein JSON-Array, keine Prosa."
  2. User-Prompt: der Pack-Inhalt + „Bereits abgedeckt (NICHT duplizieren): `[Seed-IDs + Seed-Regeltexte kompakt]`".
  3. 4 Reviewer parallel → Drafts.
  4. Judge-Prompt: „Konsolidiere die besten, dedupliziere, max ~8 Regeln pro Pack, NUR JSON-Array."
  5. `parseRules(judgeOutput)` → `validateAgainstVocab` → sammeln.
  Nach allen Packs: global `dedupeRules(all, seedIds)` (seedIds aus `RULE_CORPUS`), dann **als TS schreiben** nach `src/lib/preflight/corpus/rule-corpus.generated.ts`:
```typescript
import { RULE_CORPUS } from '@/lib/preflight/corpus/rule-corpus'
// … nach dem Sammeln:
const seedIds = new Set(RULE_CORPUS.map(r => r.id))
const final = dedupeRules(validated, seedIds)
const fileBody = `// AUTO-GENERIERT von generate-corpus.ts — nicht von Hand editieren.\n`
  + `import type { ConventionRule } from './types'\n\n`
  + `export const GENERATED_CORPUS: ConventionRule[] = ${JSON.stringify(final, null, 2)}\n`
writeFileSync(join(ROOT, 'src/lib/preflight/corpus/rule-corpus.generated.ts'), fileBody, 'utf-8')
```
  Env-Check + Usage-Kommentar oben wie `generate-agents.ts` (`npx dotenv -e .env.local -- npx tsx src/scripts/generate-corpus.ts`).

- [ ] **Step 7: Typecheck + Commit** (Skript wird NICHT real ausgeführt in diesem Task — nur gebaut + Helfer getestet)
```bash
pnpm typecheck
git add src/scripts/corpus-gen/ src/scripts/generate-corpus.ts
git commit -m "feat(preflight): Komitee-Skript generate-corpus.ts (+ testbare Helfer)"
```
Melde als **DONE** mit Hinweis: „Skript gebaut + Helfer grün; echter Komitee-Lauf ist Task 6 (Controller, braucht Keys + €)."

---

## Task 6: Echter Komitee-Lauf (Controller/Mensch — kein Subagent)

> Dieser Task wird **nicht** an einen Implementer-Subagenten delegiert (braucht `.env.local`-Keys + kostet €). Controller oder Timm führt aus.

- [ ] **Step 1: Lauf** → `npx dotenv -e .env.local -- npx tsx src/scripts/generate-corpus.ts` (Worktree-Root). Erwartung: schreibt `rule-corpus.generated.ts` mit ~30–65 Regeln.
- [ ] **Step 2: Menschlicher Review** — Timm überfliegt `rule-corpus.generated.ts`: sinnvolle „tun"-Regeln? korrekte Sections/Tags? keine Dubletten/Müll? Bei Bedarf einzelne Regeln von Hand streichen.
- [ ] **Step 3: Gates** → `pnpm exec vitest run src/lib/preflight/corpus` (Integritäts-Test prüft jetzt die ECHTEN generierten Regeln: IDs eindeutig, Sections/Tags gültig) + `pnpm typecheck` + `pnpm lint`.
- [ ] **Step 4: Commit** → `git add src/lib/preflight/corpus/rule-corpus.generated.ts && git commit -m "feat(preflight): generierter Regelkorpus (Komitee-Lauf)"`

---

## Task 7: Gesamt-Verifikation

- [ ] **Step 1:** `pnpm exec vitest run src/lib/preflight src/scripts/corpus-gen` → grün.
- [ ] **Step 2:** `pnpm typecheck && pnpm lint && pnpm lint:design` → keine Fehler.
- [ ] **Step 3: Visueller Check** — `pnpm dev`, ein Projekt „Next.js + Supabase" + ein zweites z.B. „Django" generieren → CLAUDE.md prüfen: neue Abschnitte **Testing/Git** vorhanden, bei Django **python-spezifische** Regeln, Datei bleibt **straff** (nicht 200 Regeln).
- [ ] **Step 4: Abschluss-Commit** (falls Sweep-Korrekturen).

---

## Self-Review (vom Plan-Autor)

- **Spec-Abdeckung:** Vokabular+Sections (T1), deriveCorpusTags-Stacks (T2), GENERATED_CORPUS+FULL_CORPUS+Render-Sektionen (T3), Integritäts-/Kohärenz-Test (T4), Komitee-Skript+Helfer (T5), echter Lauf+Review (T6), Verifikation (T7). ✔ Draußen: Tool-Profile/Cube, Audit/Veredler-Render, Befehle/Arbeitsweise, rule-registry-Quelle. ✔
- **Platzhalter:** keine — echter Code/Befehle; T5-Orchestrierung verweist auf konkrete Vorlage (`generate-agents.ts`) statt vager Anweisung. ✔
- **Typ-Konsistenz:** `ConventionRule`/`ConventionSection` (C1) durchgehend; `parseRules`/`validateAgainstVocab`/`dedupeRules` (T5) konsistent genutzt; `ALL_TAGS`/`CONTENT_SECTIONS`/`STACK_TAGS` (T1) in T2/T4/T5 referenziert; `FULL_CORPUS` (T3) in T4-Test importiert. ✔
- **Real-Run-Trennung:** Maschinerie (T1–T5) subagent-baubar + mock-getestet; €-Lauf (T6) bewusst Controller/Mensch. ✔
