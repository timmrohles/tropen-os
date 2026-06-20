# Committee-Roster-Refresh — Design

**Goal:** Das Multi-Model-Committee auf den Juni-2026-Frontier-Stand heben, den Modell-Drift über alle Committee-Skripte beseitigen (eine Quelle der Wahrheit) und einheitlich über den Vercel AI Gateway routen.

**Status:** Brainstorming abgeschlossen + abgenommen (Timm, 2026-06-20). Nächster Schritt: Implementierungs-Plan (writing-plans).

---

## Kontext / Problem

Das Committee (4 Reviewer + Judge, destilliert Konsens für Architektur-/Qualitäts-Entscheidungen) ist über ~6 CLI-Skripte **hartkodiert und untereinander gedriftet**:

| Skript | Reviewer (Ist) | Judge (Ist) | Routing (Ist) |
|---|---|---|---|
| `committee-review.ts` | Sonnet-4-6, **gpt-4o**, gemini-2.5-**flash**, grok-4 | **sonnet-4-6** | Direkt-Keys |
| `generate-agents.ts` | Sonnet-4-6, **gpt-4o**, gemini-2.5-pro, grok-4 | opus-4-8 | Direkt-Keys |
| `generate-corpus.ts` | dito | opus-4-8 | Direkt-Keys |
| `generate-deep-agents.ts` | dito | opus-4-8 | Direkt-Keys |
| `deepen-weak-agents.ts` | Sonnet-4-6, gpt-4o, gemini-2.5-pro, grok-4 | opus-4-8 | Direkt-Keys |
| `create-quality-agent.ts` | sonnet-4.6, **gpt-5.4**, grok-4 | opus-4.6 | **AI Gateway** |

Zwei Defekte aus dem letzten realen Lauf (`committee-review.ts`):
- **OpenAI Direkt-Key**: 300 TPM (unverifizierte Org) → GPT-4o scheitert bei großem Kontext immer.
- **xAI/DeepSeek**: keine Direkt-Keys vorhanden → Reviewer nicht nutzbar.

`AI_GATEWAY_API_KEY` **ist** in `.env.local` gesetzt (das Kommentar „Gateway nicht eingerichtet" in `committee-review.ts` ist veraltet). Der Gateway routet mit einem Key zu allen Anbietern und behebt beide Defekte.

Marktstand Juni 2026 (geprüft): Frontier = Claude Opus 4.8 (Leader), GPT-5.5, Gemini 3.1 Pro, Grok 4.3, DeepSeek V3.2. Das Committee läuft ~2 Generationen zurück.

---

## Entscheidungen (abgenommen)

1. **Scope:** Zentralisieren — ein gemeinsames Roster-Modul, alle Committee-Skripte ziehen daraus. Behebt Drift dauerhaft.
2. **Routing:** Einheitlich AI Gateway. Plain `"provider/model"`-Strings; das AI SDK routet bei gesetztem `AI_GATEWAY_API_KEY` automatisch. Keine Per-Provider-SDK-/Key-Logik mehr in den Skripten.
3. **Roster (Variante A — keine Anthropic-Reviewer, um Selbst-Konsens-Bias des Claude-Judge zu vermeiden):**
   - **Reviewer:** GPT-5.5 · Gemini 3.1 Pro · Grok 4.3 · DeepSeek V3.2
   - **Judge:** Claude Opus 4.8
   - 5 verschiedene Anbieter insgesamt; Open-Weights-Stimme (DeepSeek) dabei.

---

## Architektur

Neue Datei **`src/scripts/lib/committee.ts`** als einzige Quelle der Wahrheit. Alle Committee-Skripte importieren Roster + Aufruf-Helfer daraus. Kein hartkodiertes Modell, kein `createAnthropic`/`createOpenAI`/`createGoogleGenerativeAI`-Setup mehr in den Skripten.

```
src/scripts/
  lib/
    committee.ts        ← NEU: Roster + callCommitteeModel + PRICE_TABLE
  committee-review.ts   ← importiert aus lib/committee
  generate-agents.ts    ← dito
  generate-corpus.ts    ← dito
  generate-deep-agents.ts
  deepen-weak-agents.ts
  create-quality-agent.ts
  reviews/*.ts          ← unverändert (Review-Configs)
```

### Modul-Interface (`src/scripts/lib/committee.ts`)

```ts
export interface CommitteeMember { label: string; model: string }

export const COMMITTEE_REVIEWERS: readonly CommitteeMember[] = [
  { label: 'GPT-5.5',        model: 'openai/gpt-5.5' },
  { label: 'Gemini 3.1 Pro', model: 'google/gemini-3.1-pro' },
  { label: 'Grok 4.3',       model: 'xai/grok-4.3' },
  { label: 'DeepSeek V3.2',  model: 'deepseek/deepseek-v3.2' },
] as const

export const COMMITTEE_JUDGE: CommitteeMember = { label: 'Judge (Opus 4.8)', model: 'anthropic/claude-opus-4.8' }

export interface CallResult { text: string; inputTokens: number; outputTokens: number }

/** generateText über AI Gateway (plain provider/model string). Fehler → leeres Ergebnis, kein throw. */
export async function callCommitteeModel(
  member: CommitteeMember,
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens?: number,
): Promise<CallResult>

/** Geschätzte Kosten in EUR pro Modell-Slug (grobe Listenpreise, USD→EUR). */
export const PRICE_TABLE: Record<string, { inPerM: number; outPerM: number }>
export function estimateCost(model: string, inputTokens: number, outputTokens: number): number
```

- `callCommitteeModel` kapselt `generateText({ model: member.model, system, prompt, maxOutputTokens })` aus `ai`. Liest `usage.inputTokens`/`usage.outputTokens` (AI SDK v6). Fehler werden gefangen und als `{ text:'', inputTokens:0, outputTokens:0 }` zurückgegeben (bestehendes Verhalten der Skripte).
- `PRICE_TABLE` ist nach Modell-Slug gekeyt (nicht nach Label), damit alle Skripte dieselben Preise nutzen.

### Datenfluss (unverändert pro Skript)

`Kontext laden → COMMITTEE_REVIEWERS parallel via callCommitteeModel → erfolgreiche Drafts sammeln → COMMITTEE_JUDGE destilliert → Report schreiben + Kostentabelle`. Nur die Modell-Quelle und das Routing ändern sich; die Orchestrierung jedes Skripts bleibt.

---

## Error-Handling

- Fehlender `AI_GATEWAY_API_KEY` → früher, klarer Abbruch mit Hinweis (statt kryptischem Provider-Fehler). `committee-review.ts` prüft heute `ANTHROPIC_API_KEY`; die Prüfung wird auf `AI_GATEWAY_API_KEY` umgestellt.
- Einzelner Reviewer-Fehler (Rate-Limit, Timeout) → `callCommitteeModel` fängt, gibt leeres Ergebnis; Skript läuft mit den verbleibenden Drafts weiter (bestehende `drafts.filter(r => r.text)`-Logik).
- Judge ohne Ergebnis → Skript meldet Fehler und schreibt keinen Report (bestehendes Verhalten).

---

## Verifikation / Testing

1. **Modell-Slugs gegen die Gateway-Modellliste verifizieren** (Pflicht, kein Raten): `openai/gpt-5.5`, `google/gemini-3.1-pro`, `xai/grok-4.3`, `deepseek/deepseek-v3.2`, `anthropic/claude-opus-4.8` sind aus Jan-2026-Wissen + Juni-Suche abgeleitet. Vor dem Smoke-Lauf gegen die echte Gateway-Liste prüfen und exakte Slugs eintragen.
2. **Smoke-Lauf:** `pnpm exec tsx --env-file=.env.local src/scripts/committee-review.ts --config reviews/claude-md.ts` → alle 4 Reviewer + Judge liefern Text, Report wird geschrieben, Kosten plausibel.
3. **`tsc --noEmit`** grün.
4. Kurzer Smoke-Lauf eines `generate-*`-Skripts ist optional (teuer); mindestens Typcheck + Import-Korrektheit sicherstellen.

> `.env.local` wird via Nodes `--env-file` geladen (das `env $(… | xargs)`-Pattern aus CLAUDE.md zerbricht an Key-Werten mit Sonderzeichen).

---

## Kosten

Frontier-Reviewer statt gemini-flash/gpt-4o heben die Kosten pro Lauf grob auf €0,50–1,00 (vorher ~€0,35). Bei seltener CLI-Nutzung vernachlässigbar. Die `€0.50`-Warnschwelle in `committee-review.ts` wird auf einen realistischen Wert (z. B. €1,50) angehoben.

---

## Out of Scope

- **Single-Model-Skripte** (`generate-corpus-consolidate.ts` = nur Opus, `meta-review-agents.ts` = nur Opus) — kein Committee, bleiben unverändert (ggf. nur Slug-Aktualisierung auf opus-4.8, falls sie veraltete IDs nutzen — separat prüfen).
- **Audit-Laufzeit-Pipeline** (`src/lib/...` Multi-Model-Review in der App) — nutzt schon Gateway + aktuelle Slugs laut CLAUDE.md; nicht Teil dieses CLI-Refactors. Falls dort dieselben Konstanten sinnvoll wären → eigener Schritt.
- Quorum-/Konsens-Logik-Änderungen — Verhalten bleibt.

## Offene Punkte (in Implementierung zu klären)

- Exakte Gateway-Slugs (siehe Verifikation 1).
- Ob `create-quality-agent.ts` (eigene Gateway-Strings, inkl. Grok als Reviewer) exakt auf Roster A umgestellt wird oder seine spezielle 3-Reviewer-Aufstellung behält — Default: auf Roster A vereinheitlichen.
- CLAUDE.md-Tabelle „AI-Modelle / Multi-Model Review" nach Umsetzung aktualisieren.
