# Pre-Flight Korpus-Konsolidierung (C2b) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Aus dem gesicherten C2-Roh-Output (217 Regeln) einen straffen, korrekt einsortierten Korpus konsolidieren (~85–120 total), Compliance raus, KI-Engineering bedingt — via per-Sektion-Opus-Pass, kein 29-Pack-Re-Run.

**Spec:** `docs/superpowers/specs/2026-06-08-preflight-corpus-consolidation-c2b-design.md`
**Branch:** `claude/preflight-corpus-c2`. Worktree-Root `C:/Users/timmr/tropenOS/.claude/worktrees/preflight`. `pnpm` von dort. Einzeltest: `pnpm exec vitest run <pfad>`.

**Erledigt (Controller):** `src/scripts/corpus-gen/raw-rules.ts` (`RAW_RULES: ConventionRule[]`, 217 Regeln) existiert + typecheckt.

---

## Task 1: Vokabular +ai:true + deriveCorpusTags-Erkennung

**Files:** `src/lib/preflight/corpus/vocabulary.ts` · `src/lib/preflight/corpus/render.ts` · Tests `vocabulary.unit.test.ts` + `render.unit.test.ts`

- [ ] **Step 1: vocabulary.ts** — `OTHER_TAGS` um `'ai:true'` erweitern:
```typescript
export const OTHER_TAGS = ['db:true', 'auth:true', 'platform:web', 'platform:native', 'commerce:true', 'ai:true'] as const
```
- [ ] **Step 2: vocabulary-Test** — ergänze in `vocabulary.unit.test.ts`: `expect(OTHER_TAGS).toContain('ai:true')`.
- [ ] **Step 3: deriveCorpusTags ai-Erkennung** — in `render.ts`, in `deriveCorpusTags` nach der Stack-Schleife ergänzen:
```typescript
  const aiKeywords = /\b(openai|anthropic|claude|gpt|gemini|llm|ai-sdk|ai sdk|langchain|vercel ai|mistral|huggingface)\b/
  if (aiKeywords.test(stack) || nodes.some((n) => /\bai\b|llm|gpt/i.test(n.id))) tags.add('ai:true')
```
- [ ] **Step 4: render-Test** — ergänze in `deriveCorpusTags`-describe: `expect(deriveCorpusTags({ ...base, stack: 'Next.js + OpenAI' }, [])).toContain('ai:true')`.
- [ ] **Step 5: Run + typecheck + commit**
```bash
pnpm exec vitest run src/lib/preflight/corpus
pnpm typecheck
git add src/lib/preflight/corpus/vocabulary.ts src/lib/preflight/corpus/render.ts src/lib/preflight/corpus/__tests__/vocabulary.unit.test.ts src/lib/preflight/corpus/__tests__/render.unit.test.ts
git commit -m "feat(preflight): ai:true Vokabular-Tag + deriveCorpusTags-Erkennung"
```

---

## Task 2: consolidate.ts Helfer (Filter + Gruppieren)

**Files:** Create `src/scripts/corpus-gen/consolidate.ts` · Test `src/scripts/corpus-gen/__tests__/consolidate.unit.test.ts`

- [ ] **Step 1: Failing test**
```typescript
import { describe, it, expect } from 'vitest'
import { filterBySource, groupBySection, EXCLUDED_SOURCES } from '../consolidate'
import type { ConventionRule } from '@/lib/preflight/corpus/types'

const R = (id: string, section: string, source: string): ConventionRule =>
  ({ id, section: section as ConventionRule['section'], rule: 'tu etwas konkretes', severity: 'must', source })

describe('filterBySource', () => {
  it('droppt Compliance-Pack-Quellen, behält Engineering', () => {
    const rules = [R('a', 'security', 'agent:DSGVO'), R('b', 'code-rules', 'agent:CODE_STYLE'), R('c', 'security', 'agent:AI_ACT'), R('d', 'code-rules', 'agent:AI_INTEGRATION')]
    const kept = filterBySource(rules).map((r) => r.id)
    expect(kept).toContain('b'); expect(kept).toContain('d')
    expect(kept).not.toContain('a'); expect(kept).not.toContain('c')
  })
  it('EXCLUDED_SOURCES enthält DSGVO/AI_ACT/BFSG/LEGAL/AGENT_QUALITY', () => {
    for (const s of ['DSGVO', 'AI_ACT', 'BFSG', 'LEGAL', 'AGENT_QUALITY']) expect(EXCLUDED_SOURCES).toContain(s)
  })
})
describe('groupBySection', () => {
  it('gruppiert nach section', () => {
    const g = groupBySection([R('a', 'security', 's'), R('b', 'security', 's'), R('c', 'naming', 's')])
    expect(g['security']?.length).toBe(2); expect(g['naming']?.length).toBe(1)
  })
})
```
- [ ] **Step 2: Run — muss fehlschlagen**
- [ ] **Step 3: Implementierung** — `src/scripts/corpus-gen/consolidate.ts`:
```typescript
import type { ConventionRule, ConventionSection } from '@/lib/preflight/corpus/types'

/** Pack-Quellen, deren Regeln NICHT in den Konventions-Korpus gehören (→ ADR-034 Compliance / meta). */
export const EXCLUDED_SOURCES = ['DSGVO', 'AI_ACT', 'BFSG', 'LEGAL', 'AGENT_QUALITY']

/** Behält Regeln, deren source KEINEN ausgeschlossenen Pack-Namen enthält (case-insensitive). */
export function filterBySource(rules: ConventionRule[]): ConventionRule[] {
  return rules.filter((r) => {
    const src = (r.source ?? '').toUpperCase()
    return !EXCLUDED_SOURCES.some((ex) => src.includes(ex))
  })
}

/** Gruppiert Regeln nach section. */
export function groupBySection(rules: ConventionRule[]): Record<string, ConventionRule[]> {
  const out: Record<string, ConventionRule[]> = {}
  for (const r of rules) (out[r.section] ??= []).push(r)
  return out
}
```
- [ ] **Step 4: Run — muss bestehen**
- [ ] **Step 5: Commit**
```bash
git add src/scripts/corpus-gen/consolidate.ts src/scripts/corpus-gen/__tests__/consolidate.unit.test.ts
git commit -m "feat(preflight): consolidate-Helfer (filterBySource, groupBySection)"
```

---

## Task 3: Konsolidierungs-Skript `generate-corpus-consolidate.ts`

**Files:** Create `src/scripts/generate-corpus-consolidate.ts`

Modell: `src/scripts/generate-corpus.ts` (Provider-Setup mit `getAnthropicModel` **inkl. `baseURL: 'https://api.anthropic.com/v1'`**, `callProvider`, `load-env`-Import zuerst). NUR Anthropic Opus nötig (kein 4-Modell-Komitee).

- [ ] **Step 1: Skript schreiben** — `src/scripts/generate-corpus-consolidate.ts`:
  - Top: `import './corpus-gen/load-env'`; Usage-Kommentar `// Run: npx tsx src/scripts/generate-corpus-consolidate.ts`.
  - `getAnthropicModel(modelId)` mit `baseURL: 'https://api.anthropic.com/v1'` (von generate-corpus.ts kopieren). `MODEL = 'claude-opus-4-8'`.
  - `callOpus(system, user)`: `generateText({ model: getAnthropicModel(MODEL) as ..., system, prompt: user, maxOutputTokens: 4096 })`, try/catch → '' bei Fehler.
  - Imports: `RAW_RULES` aus `./corpus-gen/raw-rules`, `filterBySource`/`groupBySection` aus `./corpus-gen/consolidate`, `parseRules`/`validateAgainstVocab`/`dedupeRules` aus `./corpus-gen/postprocess`, `RULE_CORPUS` aus `@/lib/preflight/corpus/rule-corpus`, `ALL_TAGS`/`CONTENT_SECTIONS` aus `@/lib/preflight/corpus/vocabulary`, `writeFileSync` aus fs, `join` aus path.
  - `main()`:
    - Env-Check (`if (!process.env.ANTHROPIC_API_KEY) { console.error(...); process.exit(1) }`).
    - `const filtered = filterBySource(RAW_RULES)`; `const rawBySec = groupBySection(filtered)`; `const seedBySec = groupBySection(RULE_CORPUS)`.
    - `const all: ConventionRule[] = []`.
    - Für jede `section` in `CONTENT_SECTIONS`: wenn `rawBySec[section]?.length`, Opus-Call:
      - System: ``Du konsolidierst Konventions-Regeln für die Section "${section}". Output: NUR ein JSON-Array von Objekten {id, section, rule, rationale?, appliesWhen?, severity, source}. Regeln: section MUSS "${section}" sein; appliesWhen NUR aus [${ALL_TAGS.join(', ')}] (undefined = universell); rule imperativ/prägnant ("tun"); ähnliche ZUSAMMENFÜHREN; MAX 6 universelle + relevante bedingte; reine Rechts-/Compliance-/KI-Transparenz-Regeln WEGLASSEN; KI-Engineering-Regeln bekommen appliesWhen:["ai:true"]; keine Duplikate zur Baseline.``
      - User: ``BEREITS IN DER BASELINE (nicht duplizieren):\n${(seedBySec[section]??[]).map(r=>'- '+r.rule).join('\n')||'(keine)'}\n\n---\nKANDIDATEN zum Konsolidieren:\n${rawBySec[section].map(r=>'- ['+(r.appliesWhen?.join(',')||'universell')+'] '+r.rule).join('\n')}``
      - `const parsed = validateAgainstVocab(parseRules(text))`; `all.push(...parsed)`; `console.log(section, parsed.length)`; 2s sleep.
    - `const final = dedupeRules(all, new Set(RULE_CORPUS.map(r=>r.id)))`.
    - Schreibe `rule-corpus.generated.ts` (wie generate-corpus.ts: Header-Kommentar + `import type { ConventionRule } from './types'` + `export const GENERATED_CORPUS: ConventionRule[] = ${JSON.stringify(final, null, 2)}`).
    - `console.log('✓', final.length, 'Regeln → rule-corpus.generated.ts')`.
  - `main().catch(...)`.
  - **NICHT real ausführen.**
- [ ] **Step 2: Typecheck + Commit**
```bash
pnpm typecheck
git add src/scripts/generate-corpus-consolidate.ts
git commit -m "feat(preflight): Konsolidierungs-Skript generate-corpus-consolidate.ts"
```
Melde DONE mit Hinweis: echter Lauf = Controller (Task 4).

---

## Task 4: Echter Konsolidierungs-Lauf + Verifikation (Controller)

> Nicht delegieren (braucht Keys + €). Controller/Timm.

- [ ] `npx tsx src/scripts/generate-corpus-consolidate.ts` → schreibt `rule-corpus.generated.ts` (~30–65 Regeln).
- [ ] Verteilungs-Check: total ≤~120, universell ≤~6/Sektion, keine Compliance-/KI-Transparenz-Regeln. Menschlicher Review.
- [ ] `pnpm exec vitest run src/lib/preflight/corpus src/scripts/corpus-gen` + `pnpm typecheck` + `pnpm lint:design` → grün.
- [ ] Visueller Check: Projekt „Next.js + Supabase + OpenAI" generieren → CLAUDE.md straff, Testing/Git-Abschnitte, ai-Regeln nur bei AI-Stack.
- [ ] Commit `rule-corpus.generated.ts`.

## Self-Review
Spec-Abdeckung: ai:true (T1), Filter/Gruppieren (T2), Skript (T3), Lauf (T4), raw-rules (Controller, erledigt). ✔ Typ-Konsistenz: ConventionRule/Section, ALL_TAGS/CONTENT_SECTIONS, parseRules/validateAgainstVocab/dedupeRules (C2) wiederverwendet. ✔
