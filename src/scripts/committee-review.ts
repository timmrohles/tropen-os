#!/usr/bin/env node
// src/scripts/committee-review.ts
// Generisches Komitee-Review Script.
// Schickt eine technische Frage + Kontext an 4 Modelle, Opus destilliert den Konsens.
//
// Usage:
//   pnpm exec tsx src/scripts/committee-review.ts --config reviews/claude-md.ts
//   pnpm exec tsx src/scripts/committee-review.ts --config reviews/audit-scoring.ts
//   pnpm exec tsx src/scripts/committee-review.ts --config reviews/fix-engine.ts
//   pnpm exec tsx src/scripts/committee-review.ts --config reviews/agent-checker-alignment.ts
//   pnpm exec tsx src/scripts/committee-review.ts --all
//
// Output: docs/committee-reviews/[name]-review.md
// Cost:   ~€0.35–0.50 per review

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'
import { pathToFileURL } from 'url'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CommitteeReviewConfig {
  /** Name des Reviews (wird zum Dateinamen) */
  name: string
  /** Welche Dateien als Kontext geladen werden */
  contextFiles: string[]
  /** Optionale Transformationen (z.B. "nur erste 100 Zeilen") */
  contextTransforms?: Record<string, (content: string) => string>
  /** System-Prompt für die 4 Modelle */
  systemPrompt: string
  /** User-Prompt mit den konkreten Fragen (Platzhalter werden durch Dateiinhalte ersetzt) */
  userPrompt: string
  /** Judge-Prompt (Opus) — wie soll destilliert werden */
  judgePrompt: string
}

// ── Provider setup ─────────────────────────────────────────────────────────────
// Direct provider keys — intentional for CLI scripts.
// AI Gateway requires billing/OIDC setup not available in this project.

const ROOT = resolve(process.cwd())
const OUTPUT_DIR = join(ROOT, 'docs', 'committee-reviews')

// Model IDs — use latest stable aliases
const REVIEWER_MODEL = 'claude-sonnet-4-20250514'
const JUDGE_MODEL    = 'claude-opus-4-20250514'

function getAnthropicModel(modelId: string) {
  const sdk = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    baseURL: 'https://api.anthropic.com/v1',
  })
  return sdk(modelId)
}
function getOpenAIModel() {
  const sdk = createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })
  return sdk('gpt-4o')
}
function getGeminiModel() {
  const sdk = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '' })
  // gemini-2.5-flash: kein Extended Thinking, daher kein Output-Token-Problem bei 2048 Budget
  return sdk('gemini-2.5-flash')
}
function getGrokModel() {
  const sdk = createOpenAI({ apiKey: process.env.XAI_API_KEY ?? '', baseURL: 'https://api.x.ai/v1' })
  return sdk('grok-4')
}

// ── Context loading ────────────────────────────────────────────────────────────

function loadContextFiles(
  files: string[],
  transforms?: Record<string, (content: string) => string>,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const relPath of files) {
    try {
      let content = readFileSync(join(ROOT, relPath), 'utf-8').trim()
      if (transforms?.[relPath]) {
        content = transforms[relPath](content)
      }
      result[relPath] = content
    } catch {
      result[relPath] = `(file not found: ${relPath})`
    }
  }
  return result
}

function buildFullPrompt(userPrompt: string, contextFiles: Record<string, string>): string {
  // Build context block header + all files
  const contextBlock = Object.entries(contextFiles)
    .map(([path, content]) => {
      const label = path.toUpperCase().replace(/\//g, '/').replace(/\./g, '.')
      return `=== ${label} ===\n${content}`
    })
    .join('\n\n')

  // Replace [Inhalt wird automatisch eingefügt] placeholders with actual content,
  // but also always prepend the full context at the top
  return `${contextBlock}\n\n---\n\n${userPrompt}`
}

// ── Provider call ──────────────────────────────────────────────────────────────

interface CallResult {
  text: string
  inputTokens: number
  outputTokens: number
}

async function callProvider(
  label: string,
  modelFn: () => ReturnType<typeof getAnthropicModel>,
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens = 2048,
): Promise<CallResult> {
  try {
    const result = await generateText({
      model: modelFn() as Parameters<typeof generateText>[0]['model'],
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens,
    })
    const text = result.text?.trim() ?? ''
    if (!text) {
      console.warn(`  ⚠ ${label} returned empty text (finishReason: ${result.finishReason}, tokens: ${result.usage?.inputTokens ?? 0}/${result.usage?.outputTokens ?? 0})`)
    }
    return {
      text,
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
    }
  } catch (err) {
    console.warn(`  ⚠ ${label} failed: ${String(err).slice(0, 160)}`)
    return { text: '', inputTokens: 0, outputTokens: 0 }
  }
}

// ── Cost estimation ────────────────────────────────────────────────────────────

const PRICE_TABLE: Record<string, { inPerM: number; outPerM: number }> = {
  'Claude Sonnet':  { inPerM: 3.0,  outPerM: 15.0 },
  'GPT-4o':        { inPerM: 2.5,  outPerM: 10.0 },
  'Gemini 2.5 Pro':{ inPerM: 1.25, outPerM: 10.0 },
  'Grok 4':        { inPerM: 3.0,  outPerM: 15.0 },
  'Judge (Opus)':  { inPerM: 15.0, outPerM: 75.0 },
}
const USD_TO_EUR = 0.93

function estimateCost(label: string, inputTokens: number, outputTokens: number): number {
  const p = PRICE_TABLE[label] ?? { inPerM: 3.0, outPerM: 15.0 }
  return ((inputTokens * p.inPerM + outputTokens * p.outPerM) / 1_000_000) * USD_TO_EUR
}

interface CostRecord { label: string; inputTokens: number; outputTokens: number; costEur: number }

function buildCostSection(costs: CostRecord[]): string {
  const total = costs.reduce((s, c) => s + c.costEur, 0)
  const rows = costs.map(c =>
    `| ${c.label.padEnd(16)} | ${String(c.inputTokens).padStart(7)} | ${String(c.outputTokens).padStart(7)} | €${c.costEur.toFixed(4)} |`
  ).join('\n')
  return `## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
${rows}
| **Gesamt**       |         |         | **€${total.toFixed(4)}** |`
}

// ── Judge prompt builder ───────────────────────────────────────────────────────

function buildJudgeUserPrompt(judgePrompt: string, drafts: Array<{ label: string; text: string }>): string {
  const sections = drafts
    .map(d => `\n=== ${d.label.toUpperCase()} ===\n${d.text}`)
    .join('\n')
  return `${drafts.length} Modelle haben unabhängig dieselben Fragen bewertet:\n${sections}\n\n---\n\n${judgePrompt}`
}

const JUDGE_SYSTEM_PROMPT = `Du bist der Judge in einem Multi-Model-Komitee für technische Architektur-Entscheidungen.
Mehrere KI-Modelle haben unabhängig dieselben technischen Fragen bewertet.

Deine Aufgabe: Destilliere den Konsens in einen strukturierten Abschlussbericht.

Format:
- Für jeden bewerteten Aspekt: **Konsens-Level** (EINIG | MEHRHEIT | GESPALTEN)
- Top-Findings mit konkreten Zitaten oder Beispielen
- Klare Empfehlungen mit Priorität (sofort / bald / später)
- Kein Jargon — konkrete, umsetzbare Sprache

Nutze Markdown-Überschriften (##) für jeden Aspekt.
Führe am Ende einen "Nächste Schritte" Block auf.`

// ── Core review runner ─────────────────────────────────────────────────────────

async function runReview(config: CommitteeReviewConfig): Promise<void> {
  console.log(`\n${'═'.repeat(55)}`)
  console.log(` Review: ${config.name}`)
  console.log('═'.repeat(55))

  // Load context
  console.log('\nLade Kontext-Dateien…')
  const contextFiles = loadContextFiles(config.contextFiles, config.contextTransforms)
  for (const [path, content] of Object.entries(contextFiles)) {
    const lines = content.split('\n').length
    console.log(`  ✓ ${path} (${lines} Zeilen)`)
  }

  const fullUserPrompt = buildFullPrompt(config.userPrompt, contextFiles)
  const estimatedTokens = Math.round(fullUserPrompt.length / 4)
  console.log(`  ~ Geschätzter Kontext: ${estimatedTokens} Tokens`)

  // 4 reviewers in parallel
  console.log('\nRufe 4 Reviewer parallel auf…')
  const [r1, r2, r3, r4] = await Promise.all([
    callProvider('Claude Sonnet',   () => getAnthropicModel(REVIEWER_MODEL) as ReturnType<typeof getAnthropicModel>, config.systemPrompt, fullUserPrompt),
    callProvider('GPT-4o',          () => getOpenAIModel()                  as ReturnType<typeof getAnthropicModel>, config.systemPrompt, fullUserPrompt),
    callProvider('Gemini 2.5 Pro',  () => getGeminiModel()                  as ReturnType<typeof getAnthropicModel>, config.systemPrompt, fullUserPrompt),
    callProvider('Grok 4',          () => getGrokModel()                    as ReturnType<typeof getAnthropicModel>, config.systemPrompt, fullUserPrompt),
  ])

  const reviewerResults = [
    { label: 'Claude Sonnet',  ...r1 },
    { label: 'GPT-4o',         ...r2 },
    { label: 'Gemini 2.5 Pro', ...r3 },
    { label: 'Grok 4',         ...r4 },
  ]

  const costs: CostRecord[] = reviewerResults.map(r => ({
    label: r.label,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    costEur: estimateCost(r.label, r.inputTokens, r.outputTokens),
  }))

  const drafts = reviewerResults.filter(r => r.text)
  console.log(`  ✓ ${drafts.length}/4 Reviewer erfolgreich`)
  for (const r of reviewerResults) {
    console.log(`  ${r.text ? '✓' : '✗'} ${r.label}: ${r.inputTokens} in / ${r.outputTokens} out`)
  }

  if (drafts.length === 0) {
    console.error('✗ Alle Reviewer sind fehlgeschlagen')
    return
  }

  // Judge
  console.log('\nJudge (Opus) destilliert…')
  const judge = await callProvider(
    'Judge (Opus)',
    () => getAnthropicModel(JUDGE_MODEL) as ReturnType<typeof getAnthropicModel>,
    JUDGE_SYSTEM_PROMPT,
    buildJudgeUserPrompt(config.judgePrompt, drafts),
    4096,
  )

  costs.push({
    label: 'Judge (Opus)',
    inputTokens: judge.inputTokens,
    outputTokens: judge.outputTokens,
    costEur: estimateCost('Judge (Opus)', judge.inputTokens, judge.outputTokens),
  })

  const totalCost = costs.reduce((s, c) => s + c.costEur, 0)
  console.log(`  ✓ Judge done (${judge.inputTokens} in / ${judge.outputTokens} out) — €${totalCost.toFixed(4)}`)

  if (!judge.text) {
    console.error('✗ Judge hat kein Ergebnis produziert')
    return
  }

  // Write output
  mkdirSync(OUTPUT_DIR, { recursive: true })
  const outputPath = join(OUTPUT_DIR, `${config.name}-review.md`)
  const report = `# Committee Review: ${config.name}

> Generiert am ${new Date().toISOString().slice(0, 10)} · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

${judge.text}

---

${buildCostSection(costs)}
`
  writeFileSync(outputPath, report, 'utf-8')
  console.log(`  ✓ Gespeichert: docs/committee-reviews/${config.name}-review.md`)

  if (totalCost > 0.50) {
    console.warn(`  ⚠ Kosten €${totalCost.toFixed(4)} überschreiten €0.50 Ziel`)
  }
}

// ── All configs ────────────────────────────────────────────────────────────────

const ALL_CONFIGS = [
  'reviews/claude-md.ts',
  'reviews/audit-scoring.ts',
  'reviews/fix-engine.ts',
  'reviews/agent-checker-alignment.ts',
  'reviews/repo-map.ts',
  'reviews/dogfooding-feedback.ts',
  'reviews/automated-testbench.ts',
  'reviews/benchmark-analysis.ts',
  'reviews/compliance-architecture.ts',
  'reviews/committee-final.ts',
]

// ── CLI entrypoint ─────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY fehlt in .env.local')
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const runAll = args.includes('--all')
  const configIdx = args.indexOf('--config')
  const configArg = configIdx === -1 ? null : args[configIdx + 1]

  if (!runAll && !configArg) {
    console.error('Usage: committee-review.ts --config <path> | --all')
    console.error('Available configs:', ALL_CONFIGS.join(', '))
    process.exit(1)
  }

  const configPaths = runAll ? ALL_CONFIGS : [configArg!]

  for (const configPath of configPaths) {
    const fullPath = join(ROOT, 'src', 'scripts', configPath)
    let mod: { config: CommitteeReviewConfig }
    try {
      mod = await import(pathToFileURL(fullPath).href)
    } catch (err) {
      console.error(`✗ Config konnte nicht geladen werden: ${configPath}`)
      console.error(String(err).slice(0, 200))
      continue
    }

    await runReview(mod.config)

    // Pause between runs to respect rate limits
    if (runAll && configPath !== configPaths[configPaths.length - 1]) {
      console.log('\n  … 5 s Pause …')
      await new Promise(r => setTimeout(r, 5000))
    }
  }

  console.log('\n' + '═'.repeat(55))
  console.log(` Fertig. Outputs: docs/committee-reviews/`)
  console.log('═'.repeat(55))
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
