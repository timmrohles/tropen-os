# Committee-Roster-Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle Committee-CLI-Skripte auf ein zentrales Frontier-Roster (Juni 2026) heben, das einheitlich über den Vercel AI Gateway routet.

**Architecture:** Ein neues Modul `src/scripts/lib/committee.ts` ist die einzige Quelle der Wahrheit für Reviewer-/Judge-Modelle, Routing (AI Gateway via plain `"provider/model"`-Strings im AI SDK) und Kostenschätzung. Die sechs Committee-Skripte importieren daraus und verlieren ihre hartkodierten Provider-Funktionen.

**Tech Stack:** TypeScript, `tsx`, AI SDK (`ai`) v6 mit AI-Gateway-Routing (`AI_GATEWAY_API_KEY`), vitest.

**Verifizierte Gateway-Slugs (gegen Live-Liste, 2026-06-20):** `openai/gpt-5.5`, `google/gemini-3.1-pro-preview`, `xai/grok-4.3`, `deepseek/deepseek-v3.2`, `anthropic/claude-opus-4.8`.

---

## File Structure

- **Create:** `src/scripts/lib/committee.ts` — Roster-Konstanten, `callCommitteeModel`, `PRICE_TABLE`, `estimateCost`, `requireGatewayAuth`.
- **Create:** `test/scripts/committee.unit.test.ts` — Unit-Tests für die reinen Funktionen (`estimateCost`, Roster-Form).
- **Modify:** `src/scripts/committee-review.ts` — auf Modul umstellen (Verifikations-Zielskript).
- **Modify:** `src/scripts/generate-agents.ts`, `generate-corpus.ts`, `generate-deep-agents.ts`, `deepen-weak-agents.ts` — identische Transformation.
- **Modify:** `src/scripts/create-quality-agent.ts` — auf Roster A vereinheitlichen.
- **Modify:** `CLAUDE.md` — Modell-Tabelle aktualisieren.

---

## Task 1: Zentrales Roster-Modul

**Files:**
- Create: `src/scripts/lib/committee.ts`
- Test: `test/scripts/committee.unit.test.ts`

- [ ] **Step 1: Test schreiben (schlägt fehl)**

`test/scripts/committee.unit.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { COMMITTEE_REVIEWERS, COMMITTEE_JUDGE, PRICE_TABLE, estimateCost } from '../../src/scripts/lib/committee'

describe('committee roster', () => {
  it('hat genau 4 Reviewer, keiner davon Anthropic (kein Selbst-Bias zum Judge)', () => {
    expect(COMMITTEE_REVIEWERS).toHaveLength(4)
    for (const r of COMMITTEE_REVIEWERS) expect(r.model.startsWith('anthropic/')).toBe(false)
  })

  it('Judge ist Anthropic Opus 4.8', () => {
    expect(COMMITTEE_JUDGE.model).toBe('anthropic/claude-opus-4.8')
  })

  it('jeder Roster-Slug hat einen Preis-Eintrag', () => {
    for (const m of [...COMMITTEE_REVIEWERS, COMMITTEE_JUDGE]) {
      expect(PRICE_TABLE[m.model], m.model).toBeDefined()
    }
  })

  it('estimateCost rechnet Input+Output in EUR (USD*0.93)', () => {
    // gpt-5.5: in 2.5, out 10 USD/M → 1M in + 1M out = 12.5 USD → 11.625 EUR
    const eur = estimateCost('openai/gpt-5.5', 1_000_000, 1_000_000)
    expect(eur).toBeCloseTo((2.5 + 10) * 0.93, 4)
  })

  it('estimateCost nutzt Fallback-Preis für unbekannte Slugs', () => {
    expect(estimateCost('unknown/model', 1_000_000, 0)).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Test ausführen (muss fehlschlagen)**

Run: `pnpm exec vitest run test/scripts/committee.unit.test.ts`
Expected: FAIL — `Cannot find module '../../src/scripts/lib/committee'`

- [ ] **Step 3: Modul implementieren**

`src/scripts/lib/committee.ts`:
```ts
// src/scripts/lib/committee.ts
// Einzige Quelle der Wahrheit für das Multi-Model-Committee (CLI-Skripte).
// Routing: Vercel AI Gateway via plain "provider/model"-Strings (AI SDK v6).
// Auth: AI_GATEWAY_API_KEY in .env.local (mit `tsx --env-file=.env.local` laden).
import { generateText } from 'ai'

export interface CommitteeMember { label: string; model: string }

// Roster A (Stand 2026-06-20): 4 fremde Reviewer + Anthropic-Judge → kein Selbst-Bias.
// Slugs gegen die Live-Gateway-Liste verifiziert.
export const COMMITTEE_REVIEWERS: readonly CommitteeMember[] = [
  { label: 'GPT-5.5',        model: 'openai/gpt-5.5' },
  { label: 'Gemini 3.1 Pro', model: 'google/gemini-3.1-pro-preview' },
  { label: 'Grok 4.3',       model: 'xai/grok-4.3' },
  { label: 'DeepSeek V3.2',  model: 'deepseek/deepseek-v3.2' }, // Upgrade-Option: 'deepseek/deepseek-v4-pro'
] as const

export const COMMITTEE_JUDGE: CommitteeMember = {
  label: 'Judge (Opus 4.8)',
  model: 'anthropic/claude-opus-4.8',
}

export interface CallResult { text: string; inputTokens: number; outputTokens: number }

// Approx. Listenpreise USD/Mio Token (Stand 2026-06) — nur für Schätzung, kein Billing.
export const PRICE_TABLE: Record<string, { inPerM: number; outPerM: number }> = {
  'openai/gpt-5.5':                  { inPerM: 2.5,  outPerM: 10.0 },
  'google/gemini-3.1-pro-preview':   { inPerM: 1.25, outPerM: 10.0 },
  'xai/grok-4.3':                    { inPerM: 3.0,  outPerM: 15.0 },
  'deepseek/deepseek-v3.2':          { inPerM: 0.3,  outPerM: 0.5 },
  'anthropic/claude-opus-4.8':       { inPerM: 15.0, outPerM: 75.0 },
}
const USD_TO_EUR = 0.93
const FALLBACK_PRICE = { inPerM: 3.0, outPerM: 15.0 }

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICE_TABLE[model] ?? FALLBACK_PRICE
  return ((inputTokens * p.inPerM + outputTokens * p.outPerM) / 1_000_000) * USD_TO_EUR
}

/** Bricht früh ab, wenn der Gateway-Key fehlt. */
export function requireGatewayAuth(): void {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    console.error('✗ AI_GATEWAY_API_KEY (oder VERCEL_OIDC_TOKEN) fehlt in .env.local')
    console.error('  Lauf mit: pnpm exec tsx --env-file=.env.local <script>')
    process.exit(1)
  }
}

/**
 * Ruft ein Committee-Modell über den AI Gateway auf. Fehler werden gefangen
 * und als leeres Ergebnis zurückgegeben (Skripte filtern leere Drafts).
 */
export async function callCommitteeModel(
  member: CommitteeMember,
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens = 2048,
): Promise<CallResult> {
  try {
    const result = await generateText({
      model: member.model as Parameters<typeof generateText>[0]['model'],
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens,
    })
    const text = result.text?.trim() ?? ''
    if (!text) {
      console.warn(`  ⚠ ${member.label} returned empty text (finishReason: ${result.finishReason}, tokens: ${result.usage?.inputTokens ?? 0}/${result.usage?.outputTokens ?? 0})`)
    }
    return {
      text,
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
    }
  } catch (err) {
    console.warn(`  ⚠ ${member.label} failed: ${String(err).slice(0, 160)}`)
    return { text: '', inputTokens: 0, outputTokens: 0 }
  }
}
```

- [ ] **Step 4: Test ausführen (muss bestehen)**

Run: `pnpm exec vitest run test/scripts/committee.unit.test.ts`
Expected: PASS (5 Tests grün)

- [ ] **Step 5: Commit**

```bash
git add src/scripts/lib/committee.ts test/scripts/committee.unit.test.ts
git commit -m "feat(committee): zentrales Roster-Modul (Frontier-Modelle, AI-Gateway)"
```

---

## Task 2: `committee-review.ts` migrieren (Verifikations-Ziel)

**Files:**
- Modify: `src/scripts/committee-review.ts`

- [ ] **Step 1: Imports + alten Provider-Code entfernen**

Ersetze den Import-Block (die `createAnthropic`/`createOpenAI`/`createGoogleGenerativeAI`-Zeilen) — `generateText` wird hier nicht mehr direkt gebraucht:
```ts
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'
import { pathToFileURL } from 'url'
import {
  COMMITTEE_REVIEWERS, COMMITTEE_JUDGE,
  callCommitteeModel, estimateCost, requireGatewayAuth,
  type CallResult,
} from './lib/committee'
```

Lösche die vier Funktionen `getAnthropicModel`, `getOpenAIModel`, `getGeminiModel`, `getGrokModel` (ca. Zeilen 52–71) und die Konstanten `REVIEWER_MODEL`/`JUDGE_MODEL` (Zeilen 49–50).

Lösche die lokale `interface CallResult` (jetzt aus dem Modul importiert), die lokale `callProvider`-Funktion, die lokale `PRICE_TABLE`, `USD_TO_EUR` und `estimateCost` (jetzt aus dem Modul).

- [ ] **Step 2: Reviewer-Aufruf auf das Roster umstellen**

Ersetze den Promise.all-Block + `reviewerResults` (ca. Zeilen 219–232):
```ts
  // 4 reviewers in parallel
  console.log('\nRufe 4 Reviewer parallel auf…')
  const reviewerResults = await Promise.all(
    COMMITTEE_REVIEWERS.map(async (m) => ({
      label: m.label,
      model: m.model,
      ...(await callCommitteeModel(m, config.systemPrompt, fullUserPrompt)),
    })),
  )

  const costs: CostRecord[] = reviewerResults.map((r) => ({
    label: r.label,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    costEur: estimateCost(r.model, r.inputTokens, r.outputTokens),
  }))
```
(Die bestehende `CostRecord`-Interface-Zeile bleibt; falls sie unter der gelöschten `estimateCost` stand, behalte sie als eigene Zeile.)

- [ ] **Step 3: Judge-Aufruf umstellen**

Ersetze den Judge-Aufruf (ca. Zeilen 253–267):
```ts
  console.log('\nJudge (Opus) destilliert…')
  const judge = await callCommitteeModel(
    COMMITTEE_JUDGE,
    JUDGE_SYSTEM_PROMPT,
    buildJudgeUserPrompt(config.judgePrompt, drafts),
    4096,
  )

  costs.push({
    label: COMMITTEE_JUDGE.label,
    inputTokens: judge.inputTokens,
    outputTokens: judge.outputTokens,
    costEur: estimateCost(COMMITTEE_JUDGE.model, judge.inputTokens, judge.outputTokens),
  })
```

- [ ] **Step 4: Env-Check + Kostenschwelle anpassen**

In `main()`: ersetze `if (!process.env.ANTHROPIC_API_KEY) { … process.exit(1) }` durch `requireGatewayAuth()`.

Ändere die Kostenwarnung (ca. Zeile 295) von `if (totalCost > 0.50)` auf:
```ts
  if (totalCost > 1.50) {
    console.warn(`  ⚠ Kosten €${totalCost.toFixed(4)} überschreiten €1.50 Ziel`)
  }
```

Aktualisiere den Header-Kommentar `// Cost: ~€0.35–0.50 per review` → `// Cost: ~€0.50–1.00 per review (Frontier-Roster via AI Gateway)`.

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: keine Fehler in `committee-review.ts` / `lib/committee.ts`.

- [ ] **Step 6: Realer Smoke-Lauf**

Run: `pnpm exec tsx --env-file=.env.local src/scripts/committee-review.ts --config reviews/claude-md.ts`
Expected: `✓ 4/4 Reviewer erfolgreich`, Judge liefert Text, `✓ Gespeichert: docs/committee-reviews/claude-md-review.md`, Gesamtkosten plausibel (< €1.50). Falls ein Reviewer-Slug 404/Unauthorized wirft → Slug gegen `curl https://ai-gateway.vercel.sh/v1/models` prüfen und in `lib/committee.ts` korrigieren.

- [ ] **Step 7: Commit**

```bash
git add src/scripts/committee-review.ts
git commit -m "refactor(committee): committee-review.ts auf zentrales Gateway-Roster"
```

---

## Task 3: Vier Generierungs-Skripte migrieren (identische Transformation)

**Files:**
- Modify: `src/scripts/generate-agents.ts`
- Modify: `src/scripts/generate-corpus.ts`
- Modify: `src/scripts/generate-deep-agents.ts`
- Modify: `src/scripts/deepen-weak-agents.ts`

Alle vier haben dasselbe Muster: vier Provider-Funktionen (`getAnthropic*`/`getOpenAI*`/`getGemini*`/`getGrok*`), Konstanten `REVIEWER_MODEL`/`JUDGE_MODEL`, eine lokale `callProvider`-Funktion, ein Promise.all über vier Reviewer und einen Judge-Aufruf. Die Transformation ist für jede Datei dieselbe.

**Worked example (`generate-agents.ts`):**

- [ ] **Step 1 (pro Datei): Provider-Funktionen + Modell-Konstanten löschen**

Lösche in jeder Datei die vier Funktionen `getAnthropic(Model)?`, `getOpenAI(Model)?`, `getGemini(Model)?`, `getGrok(Model)?` und die Konstanten `REVIEWER_MODEL` + `JUDGE_MODEL`. Entferne nun ungenutzte Imports `createAnthropic`/`createOpenAI`/`createGoogleGenerativeAI`.

- [ ] **Step 2 (pro Datei): Modul-Import ergänzen**

Füge bei den Imports hinzu:
```ts
import { COMMITTEE_REVIEWERS, COMMITTEE_JUDGE, callCommitteeModel, requireGatewayAuth } from './lib/committee'
```

- [ ] **Step 3 (pro Datei): lokale `callProvider` durch `callCommitteeModel` ersetzen**

Diese Skripte haben eine eigene `callProvider(label, modelFn, …)`-Variante. Ersetze die vier Reviewer-Aufrufe (Promise.all) durch:
```ts
  const reviewerResults = await Promise.all(
    COMMITTEE_REVIEWERS.map(async (m) => ({
      label: m.label,
      ...(await callCommitteeModel(m, systemPrompt, userPrompt)),
    })),
  )
```
und den Judge-Aufruf durch:
```ts
  const judge = await callCommitteeModel(COMMITTEE_JUDGE, JUDGE_SYSTEM_PROMPT, judgeUserPrompt, 4096)
```
(Variablennamen `systemPrompt`/`userPrompt`/`judgeUserPrompt`/`JUDGE_SYSTEM_PROMPT` an die jeweils vorhandenen Bezeichner der Datei anpassen — vor dem Edit die Call-Site lesen.) Lösche danach die nun ungenutzte lokale `callProvider`-Funktion.

- [ ] **Step 4 (pro Datei): Env-Check umstellen**

Ersetze einen evtl. vorhandenen `if (!process.env.ANTHROPIC_API_KEY)`-Check am Anfang von `main()` durch `requireGatewayAuth()`. Entferne die veralteten Kommentare „(gateway not configured)".

- [ ] **Step 5: Typecheck nach jeder Datei**

Run: `pnpm exec tsc --noEmit`
Expected: keine neuen Fehler. Bei Bezeichner-Mismatch (z. B. `userPrompt` heißt anders) korrigieren.

- [ ] **Step 6: Commit (alle vier zusammen)**

```bash
git add src/scripts/generate-agents.ts src/scripts/generate-corpus.ts src/scripts/generate-deep-agents.ts src/scripts/deepen-weak-agents.ts
git commit -m "refactor(committee): vier Generierungs-Skripte auf zentrales Gateway-Roster"
```

> Hinweis: Diese Skripte sind teuer (Agent-/Korpus-Generierung). Kein voller Smoke-Lauf nötig — Typecheck + korrekte Imports genügen. Funktionaler Beweis kommt beim nächsten realen Generierungslauf.

---

## Task 4: `create-quality-agent.ts` auf Roster A vereinheitlichen

**Files:**
- Modify: `src/scripts/create-quality-agent.ts`

Dieses Skript nutzt schon Gateway-Strings, aber eine eigene 3-Reviewer-Aufstellung (`anthropic/claude-sonnet-4.6`, `openai/gpt-5.4`, `xai/grok-4`) + Judge `claude-opus-4.6`.

- [ ] **Step 1: Lokale Modell-Konstanten durch Modul ersetzen**

Lösche `REVIEWER_CLAUDE`, `REVIEWER_GPT`, `REVIEWER_GROK`, `JUDGE_MODEL` (Zeilen 20–23). Ergänze Import:
```ts
import { COMMITTEE_REVIEWERS, COMMITTEE_JUDGE, callCommitteeModel, requireGatewayAuth } from './lib/committee'
```

- [ ] **Step 2: Reviewer-/Judge-Aufrufe auf das Roster umstellen**

Lies die bestehende Aufruf-Logik (`callModel(...)` für die drei Reviewer + `callModel('Claude Opus 4.6 (judge)', JUDGE_MODEL, …)` ca. Zeile 251). Ersetze die drei Reviewer durch ein `Promise.all` über `COMMITTEE_REVIEWERS` (analog Task 3, Step 3) und den Judge durch `callCommitteeModel(COMMITTEE_JUDGE, …)`. Falls die lokale `callModel`-Funktion danach ungenutzt ist, löschen; falls sie an anderer Stelle gebraucht wird, belassen.

- [ ] **Step 3: Auth-Check**

Stelle sicher, dass `requireGatewayAuth()` zu Beginn von `main()` aufgerufen wird (ersetzt einen evtl. vorhandenen manuellen Key-Check).

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/create-quality-agent.ts
git commit -m "refactor(committee): create-quality-agent.ts auf Roster A vereinheitlicht"
```

---

## Task 5: CLAUDE.md aktualisieren

**Files:**
- Modify: `CLAUDE.md` (Abschnitt „AI-Modelle" / „Multi-Model Review")

- [ ] **Step 1: Modell-Tabelle aktualisieren**

Ersetze in der „AI-Modelle"-Tabelle die Multi-Model-Review-Zeilen durch das neue Roster:
```
| Multi-Model Review (Reviewer 1) | openai/gpt-5.5 via AI Gateway |
| Multi-Model Review (Reviewer 2) | google/gemini-3.1-pro-preview via AI Gateway |
| Multi-Model Review (Reviewer 3) | xai/grok-4.3 via AI Gateway |
| Multi-Model Review (Reviewer 4) | deepseek/deepseek-v3.2 via AI Gateway |
| Multi-Model Review (Judge) | anthropic/claude-opus-4.8 via AI Gateway |
```
Ergänze einen Satz: „Committee-CLI-Skripte ziehen Roster + Routing aus `src/scripts/lib/committee.ts` (eine Quelle der Wahrheit)."

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): Committee-Modell-Tabelle auf Frontier-Roster (Juni 2026)"
```

---

## Self-Review-Ergebnis (vom Plan-Autor)

- **Spec-Abdeckung:** Zentralisierung (Task 1+3+4), AI-Gateway-Routing (Task 1 `callCommitteeModel`), Roster A (Task 1 Konstanten), Migration aller Skripte (Task 2–4), Slug-Verifikation (Task 2 Step 6 + bereits live geprüft), Kostenschwelle €1,50 (Task 2 Step 4), `create-quality-agent.ts`-Default (Task 4), CLAUDE.md (Task 5). Abgedeckt.
- **Out-of-scope eingehalten:** Single-Model-Skripte (`generate-corpus-consolidate.ts`, `meta-review-agents.ts`) und die App-Laufzeit-Audit-Pipeline werden nicht angefasst.
- **Typ-Konsistenz:** `CommitteeMember`, `CallResult`, `callCommitteeModel(member, system, prompt, maxOut)`, `estimateCost(model, in, out)` über alle Tasks gleich verwendet.
