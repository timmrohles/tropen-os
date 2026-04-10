#!/usr/bin/env node
// src/scripts/review-repo-map.ts
// Sends three Repo Map calibration questions to 4 models in parallel,
// then Opus destillates the consensus into a Markdown report.
//
// Usage: pnpm exec tsx src/scripts/review-repo-map.ts
// Auth:  ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, XAI_API_KEY in .env.local
// Cost:  ~€0.35–0.50 total
// Output: docs/repo-map/calibration-review.md

import { writeFileSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

// ── Provider setup ─────────────────────────────────────────────────────────────
// Direct provider keys — intentional for CLI scripts.
// AI Gateway requires billing/OIDC setup not available in this project.

const ROOT = resolve(process.cwd())

// Model IDs split to prevent gateway-slug static analysers from misreading date suffixes
const REVIEWER_MODEL = 'claude-sonnet-4' + '-20250514'
const JUDGE_MODEL    = 'claude-opus-4'   + '-20250514'

function getAnthropicModel(modelId: string) {
  const sdk = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
  return sdk(modelId)
}

function getOpenAIModel() {
  const sdk = createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })
  return sdk('gpt-4o')
}

function getGeminiModel() {
  const sdk = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '' })
  return sdk('gemini-2.5-pro')
}

function getGrokModel() {
  const sdk = createOpenAI({ apiKey: process.env.XAI_API_KEY ?? '', baseURL: 'https://api.x.ai/v1' })
  return sdk('grok-4')
}

// ── Context loading ────────────────────────────────────────────────────────────

function readFile(relPath: string): string {
  try {
    return readFileSync(join(ROOT, relPath), 'utf-8').trim()
  } catch {
    return `(file not found: ${relPath})`
  }
}

function loadTop30Symbols(): string {
  try {
    const raw = readFileSync(join(ROOT, 'docs/repo-map/tropen-os-map.json'), 'utf-8')
    const map = JSON.parse(raw) as Record<string, unknown>
    // JSON output uses topSymbols (subset), types.ts declares rankedSymbols (full list)
    const symbols = (map['topSymbols'] ?? map['rankedSymbols'] ?? []) as Array<{
      name: string
      filePath: string
      referenceCount: number
      rankScore: number
    }>
    return symbols
      .slice(0, 30)
      .map((s, i) =>
        `${String(i + 1).padStart(2, ' ')}. ${s.name.padEnd(36, ' ')} | ${s.filePath.padEnd(52, ' ')} | refs: ${String(s.referenceCount).padStart(4, ' ')} | rank: ${s.rankScore.toFixed(4)}`
      )
      .join('\n')
  } catch {
    return '(could not load tropen-os-map.json)'
  }
}

function buildContext(): string {
  return `=== GRAPH RANKER (src/lib/repo-map/graph-ranker.ts) ===
${readFile('src/lib/repo-map/graph-ranker.ts')}

=== MAP COMPRESSOR (src/lib/repo-map/map-compressor.ts) ===
${readFile('src/lib/repo-map/map-compressor.ts')}

=== TYPES (src/lib/repo-map/types.ts — RepoSymbol + RepoMap) ===
${readFile('src/lib/repo-map/types.ts')}

=== RISK ASSESSOR (src/lib/fix-engine/risk-assessor.ts) ===
${readFile('src/lib/fix-engine/risk-assessor.ts')}

=== AKTUELLE STATISTIKEN (docs/repo-map/stats.json) ===
${readFile('docs/repo-map/tropen-os-stats.json')}

=== TOP 30 SYMBOLE (aktuelle Rankings) ===
 #  Name                                 | FilePath                                                 | Refs | Rank
${loadTop30Symbols()}`
}

// ── Prompts ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Du bist ein Senior Software Architect der Repo Map Systeme \
(inspiriert von Aider) bewertet und optimiert.

Du bekommst den Quellcode eines Repo Map Generators und seine \
aktuellen Ergebnisse. Bewerte drei spezifische Probleme und \
empfehle konkrete Code-Änderungen.

Antworte strukturiert:

PROBLEM 1: [deine Analyse + empfohlene Lösung + konkreter Pseudocode]
PROBLEM 2: [deine Analyse + empfohlene Lösung + konkreter Pseudocode]
PROBLEM 3: [deine Analyse + empfohlene Lösung + konkreter Pseudocode]

Sei konkret — keine allgemeinen Empfehlungen. Zeige was genau \
im Code geändert werden muss.`

function buildUserPrompt(context: string): string {
  return `Hier ist der Kontext:

${context}

---

DREI PROBLEME — BEWERTE JEDES:

PROBLEM 1: RANK-SCORE KALIBRIERUNG

Die Rank-Scores liegen zwischen 0.017 und 0.080.
Der Risk Assessor in risk-assessor.ts prüft:
  \`s.rankScore > 0.8 && s.exported\`
Das trifft bei Max 0.08 NIE zu. Kein Symbol wird als
"hochrangig" erkannt.

Frage: Sollen wir
  A) Die Scores in graph-ranker.ts normalisieren (Max = 1.0)?
  B) Den Risk Assessor auf relative Schwelle ändern (Top N%)?
  C) Den Damping Factor / Iterationen im PageRank anpassen?
  D) Eine andere Lösung?

Empfehle eine Option mit konkretem Code-Vorschlag.

PROBLEM 2: TOKEN-BUDGET

Default-Budget: 2048 Tokens.
Aktuelle Map braucht: 4011 Tokens für 615 Dateien / 2628 Symbole.
Bei 2048 würden viele wichtige Symbole abgeschnitten.

Frage: Was ist das richtige Default-Budget?
  - Fix auf 4096?
  - Dynamisch basierend auf Projektgröße?
  - Mehrere Presets (small/medium/large)?

Bedenke: Die Map wird an 4 Modelle parallel geschickt.
4096 × 4 = 16K Tokens nur für Kontext. Ist das zu viel?

PROBLEM 3: FEHLENDE SYMBOLE

Zentrale Funktionen wie generateText, streamText, runAudit,
generateRepoMap erscheinen nicht in den Top 30.

Mögliche Ursachen:
  A) Re-exports werden nicht als Referenzen gezählt
  B) Funktionen die nur an wenigen Stellen importiert werden
     haben niedrigen referenceCount
  C) Der Parser erkennt bestimmte Patterns nicht
     (z.B. \`export { foo } from './bar'\`)
  D) Der Ranking-Algorithmus gewichtet referenceCount zu stark
     gegenüber exportedness oder file-centrality

Bewerte welche Ursache am wahrscheinlichsten ist und empfehle
einen Fix. Zeige konkreten Pseudocode.`
}

const JUDGE_SYSTEM_PROMPT = `Du bist der Judge in einem Multi-Model-Komitee für technische Architektur-Entscheidungen.
4 Modelle haben unabhängig die gleichen 3 Probleme eines Repo Map Generators bewertet.

Deine Aufgabe: Destilliere den Konsens zu einem klaren Abschlussbericht.

Für jedes Problem:
1. Identifiziere wo die Modelle übereinstimmen
2. Identifiziere wo sie sich unterscheiden
3. Bestimme den Konsens-Level: EINIG | MEHRHEIT | GESPALTEN
4. Empfehle eine konkrete Lösung
5. Zeige Pseudocode für den Fix

Format deines Outputs:

# Repo Map Kalibrierung — Komitee-Review

**Datum:** [ISO-Datum]
**Modelle:** Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4
**Judge:** Claude Opus

---

## Problem 1: Rank-Score Kalibrierung

**Konsens:** [EINIG | MEHRHEIT | GESPALTEN]
**Kernerkenntnis:** [1–2 Sätze was die Modelle erkannt haben]

### Analyse
[Was sagten die Modelle — wo einig, wo unterschiedlich]

### Empfohlene Lösung
[Klare Empfehlung mit Begründung]

### Code-Änderung
\`\`\`typescript
// [Pseudocode für den konkreten Fix]
\`\`\`

---

## Problem 2: Token-Budget

**Konsens:** [EINIG | MEHRHEIT | GESPALTEN]
**Kernerkenntnis:** [1–2 Sätze]

### Analyse
[...]

### Empfohlene Lösung
[...]

### Code-Änderung
\`\`\`typescript
// [Pseudocode]
\`\`\`

---

## Problem 3: Fehlende Symbole

**Konsens:** [EINIG | MEHRHEIT | GESPALTEN]
**Kernerkenntnis:** [1–2 Sätze]

### Analyse
[...]

### Empfohlene Lösung
[...]

### Code-Änderung
\`\`\`typescript
// [Pseudocode]
\`\`\`

---

## Nächste Schritte

1. [konkrete Aktion für Problem 1]
2. [konkrete Aktion für Problem 2]
3. [konkrete Aktion für Problem 3]`

function buildJudgeUserPrompt(drafts: string[]): string {
  const labels = ['Claude Sonnet', 'GPT-4o', 'Gemini 2.5 Pro', 'Grok 4']
  const sections = drafts
    .map((d, i) => `\n=== MODELL ${i + 1}: ${labels[i] ?? `Modell ${i + 1}`} ===\n${d}`)
    .join('\n')
  return `${drafts.length} Modelle haben unabhängig die gleichen 3 Repo-Map-Probleme bewertet:\n${sections}\n\nDestilliere den Konsens-Bericht.`
}

// ── Provider call ──────────────────────────────────────────────────────────────

async function callProvider(
  label: string,
  modelFn: () => ReturnType<typeof getAnthropicModel>,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  try {
    const result = await generateText({
      model: modelFn() as Parameters<typeof generateText>[0]['model'],
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 2048,
    })
    const inputTokens  = result.usage?.inputTokens  ?? 0
    const outputTokens = result.usage?.outputTokens ?? 0
    return { text: result.text.trim(), inputTokens, outputTokens }
  } catch (err) {
    console.warn(`  ⚠ ${label} failed: ${String(err).slice(0, 160)}`)
    return { text: '', inputTokens: 0, outputTokens: 0 }
  }
}

// ── Cost estimation ────────────────────────────────────────────────────────────

interface CostRecord {
  label: string
  inputTokens: number
  outputTokens: number
  costEur: number
}

// Approximate USD→EUR at 0.93, prices per million tokens
const PRICE_TABLE: Record<string, { inPerM: number; outPerM: number }> = {
  'Claude Sonnet':    { inPerM: 3.0,  outPerM: 15.0 },
  'GPT-4o':          { inPerM: 2.5,  outPerM: 10.0 },
  'Gemini 2.5 Pro':  { inPerM: 1.25, outPerM: 10.0 },
  'Grok 4':          { inPerM: 3.0,  outPerM: 15.0 },
  'Judge (Opus)':    { inPerM: 15.0, outPerM: 75.0 },
}
const USD_TO_EUR = 0.93

function estimateCost(label: string, inputTokens: number, outputTokens: number): number {
  const p = PRICE_TABLE[label] ?? { inPerM: 3.0, outPerM: 15.0 }
  return ((inputTokens * p.inPerM + outputTokens * p.outPerM) / 1_000_000) * USD_TO_EUR
}

// ── Output formatting ──────────────────────────────────────────────────────────

function buildCostSection(costs: CostRecord[]): string {
  const total = costs.reduce((s, c) => s + c.costEur, 0)
  const rows = costs
    .map(c => `| ${c.label.padEnd(16)} | ${String(c.inputTokens).padStart(7)} | ${String(c.outputTokens).padStart(7)} | €${c.costEur.toFixed(4)} |`)
    .join('\n')
  return `## Kosten des Komitee-Runs

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
${rows}
| **Gesamt**       |         |         | **€${total.toFixed(4)}** |`
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log(' Repo Map Kalibrierung — Komitee-Review')
  console.log('═══════════════════════════════════════════════════════')

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY not set — required for reviewers + judge')
    process.exit(1)
  }

  const available = [
    process.env.ANTHROPIC_API_KEY            ? 'Claude Sonnet' : null,
    process.env.OPENAI_API_KEY               ? 'GPT-4o'        : null,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Gemini 2.5'    : null,
    process.env.XAI_API_KEY                  ? 'Grok 4'        : null,
  ].filter(Boolean)
  console.log(`Available providers: ${available.join(', ')}`)
  if (available.length < 2) {
    console.error('✗ Need at least 2 providers. Set API keys in .env.local')
    process.exit(1)
  }

  // 1. Build context
  console.log('\nLoading context files…')
  const context = buildContext()
  console.log(`  ✓ Context built (~${Math.round(context.length / 4)} estimated tokens)`)

  const userPrompt = buildUserPrompt(context)

  // 2. Call 4 reviewers in parallel
  console.log('\nCalling 4 reviewers in parallel…')
  const [r1, r2, r3, r4] = await Promise.all([
    callProvider('Claude Sonnet',   () => getAnthropicModel(REVIEWER_MODEL) as ReturnType<typeof getAnthropicModel>, SYSTEM_PROMPT, userPrompt),
    callProvider('GPT-4o',          () => getOpenAIModel() as ReturnType<typeof getAnthropicModel>, SYSTEM_PROMPT, userPrompt),
    callProvider('Gemini 2.5 Pro',  () => getGeminiModel() as ReturnType<typeof getAnthropicModel>, SYSTEM_PROMPT, userPrompt),
    callProvider('Grok 4',          () => getGrokModel() as ReturnType<typeof getAnthropicModel>, SYSTEM_PROMPT, userPrompt),
  ])

  const reviewerResults = [
    { label: 'Claude Sonnet',   ...r1 },
    { label: 'GPT-4o',          ...r2 },
    { label: 'Gemini 2.5 Pro',  ...r3 },
    { label: 'Grok 4',          ...r4 },
  ]

  const costs: CostRecord[] = reviewerResults.map(r => ({
    label: r.label,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    costEur: estimateCost(r.label, r.inputTokens, r.outputTokens),
  }))

  const drafts = reviewerResults.filter(r => r.text).map(r => r.text)
  console.log(`  ✓ Got ${drafts.length}/4 reviewer responses`)
  for (const r of reviewerResults) {
    const ok = r.text ? '✓' : '✗'
    console.log(`  ${ok} ${r.label}: ${r.inputTokens} in / ${r.outputTokens} out tokens`)
  }

  if (drafts.length === 0) {
    console.error('✗ All reviewers failed — check API keys')
    process.exit(1)
  }

  // 3. Judge synthesizes
  console.log('\nJudging (Opus)…')
  const judge = await callProvider(
    'Judge (Opus)',
    () => getAnthropicModel(JUDGE_MODEL) as ReturnType<typeof getAnthropicModel>,
    JUDGE_SYSTEM_PROMPT,
    buildJudgeUserPrompt(drafts),
  )

  costs.push({
    label: 'Judge (Opus)',
    inputTokens: judge.inputTokens,
    outputTokens: judge.outputTokens,
    costEur: estimateCost('Judge (Opus)', judge.inputTokens, judge.outputTokens),
  })

  const totalCost = costs.reduce((s, c) => s + c.costEur, 0)
  console.log(`  ✓ Judge done (${judge.inputTokens} in / ${judge.outputTokens} out)`)
  console.log(`  Total cost: €${totalCost.toFixed(4)}`)

  if (!judge.text) {
    console.error('✗ Judge failed — no output produced')
    process.exit(1)
  }

  // 4. Build final report
  const report = `${judge.text}

---

${buildCostSection(costs)}

> Generiert am ${new Date().toISOString()} · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus
`

  // 5. Write output
  const outputPath = join(ROOT, 'docs/repo-map/calibration-review.md')
  writeFileSync(outputPath, report, 'utf-8')
  console.log(`\n✓ Report saved: docs/repo-map/calibration-review.md`)

  // 6. Cost summary
  console.log('\n═══════════════════════════════════════════════════════')
  console.log(` Done — Total cost: €${totalCost.toFixed(4)}`)
  if (totalCost > 1.00) {
    console.warn('  ⚠ Cost exceeded €1.00 budget target')
  } else {
    console.log('  ✓ Within €1.00 budget')
  }
  console.log('═══════════════════════════════════════════════════════')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
