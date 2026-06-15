#!/usr/bin/env node
// src/scripts/generate-corpus.ts
// Transforms the 25 agent rule packs (docs/agents/*.md) into a typed corpus of
// ConventionRule objects via a multi-model committee (4 reviewers + Opus judge).
// Output is JSON-as-TS: src/lib/preflight/corpus/rule-corpus.generated.ts
//
// Run:  npx tsx src/scripts/generate-corpus.ts   (lädt .env.local selbst via load-env)
// Cost: ~€ (committee over 25 packs — 4 reviewers + judge per pack)

import './corpus-gen/load-env' // muss zuerst laufen: lädt .env.local, umgeht Empty-Key-Shadow
import { writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { ConventionRule } from '@/lib/preflight/corpus/types'
import { ALL_TAGS, CONTENT_SECTIONS } from '@/lib/preflight/corpus/vocabulary'
import { RULE_CORPUS } from '@/lib/preflight/corpus/rule-corpus'
import { readAgentPacks, type PackSource } from './corpus-gen/extract'
import { parseRules, validateAgainstVocab, dedupeRules } from './corpus-gen/postprocess'

// ── Provider setup ────────────────────────────────────────────────────────────
// Direct provider keys are intentional for this script (mirrors generate-agents.ts).
// Vercel AI Gateway requires billing/OIDC setup that is not available in this project.

const ROOT = resolve(process.cwd())

function getAnthropicModel(modelId: string) {
  // baseURL mit /v1 nötig: die installierte SDK-Version erzeugt sonst api.anthropic.com/messages → 404
  // (gleicher Fix wie in src/lib/llm/anthropic.ts).
  const sdk = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    baseURL: 'https://api.anthropic.com/v1',
  })
  return sdk(modelId)
}

function getOpenAIModel() {
  // noinspection JSIgnoredPromiseFromCall — direct OpenAI key, intentional (gateway not configured)
  const sdk = createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })
  return sdk('gpt-4o')
}

function getGeminiModel() {
  // noinspection JSIgnoredPromiseFromCall — direct Google key, intentional (gateway not configured)
  const sdk = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '' })
  return sdk('gemini-2.5-pro')
}

function getGrokModel() {
  // noinspection JSIgnoredPromiseFromCall — direct xAI key, intentional (gateway not configured)
  const sdk = createOpenAI({ apiKey: process.env.XAI_API_KEY ?? '', baseURL: 'https://api.x.ai/v1' })
  return sdk('grok-4')
}

// Aktuelle Anthropic-Modell-IDs (claude-api-Skill, Stand 2026-06): keine Datums-Suffixe.
// Die alten datierten IDs (claude-*-4-20250514) liefern auf diesem Account 404.
const REVIEWER_MODEL = 'claude-sonnet-4-6'
const JUDGE_MODEL    = 'claude-opus-4-8'

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You transform an agent rule document into a JSON array of ConventionRule objects for an automated code-convention corpus.

Each object has this exact shape:
{
  "id": string,            // kebab-case, stable, unique (e.g. "testing-cover-edge-cases")
  "section": string,       // MUST be one of: ${CONTENT_SECTIONS.join(', ')}
  "rule": string,          // imperative German ("tun"), concise, one actionable instruction
  "rationale": string,     // OPTIONAL — short "why" (omit if obvious)
  "appliesWhen": string[], // OPTIONAL — subset of: ${ALL_TAGS.join(', ')} (omit = universal)
  "severity": string,      // MUST be "must" or "should"
  "source": string         // MUST be "agent:<PACKNAME>"
}

HARD CONSTRAINTS:
- "section" MUST be exactly one of: ${CONTENT_SECTIONS.join(', ')}. Never invent a section.
- "appliesWhen" tags MUST be a subset of: ${ALL_TAGS.join(', ')}. Omit the field entirely for universal rules — never invent tags.
- "rule" is imperative ("tun"-Form), concise (one sentence), and actionable.
- Consolidate similar or overlapping rules into one. Drop vague or non-actionable advice.
- Maximum ~8 rules per pack. Fewer high-quality rules beat many weak ones.
- Output ONLY a JSON array. No prose, no Markdown headings, no explanation before or after.`
}

function buildSeedSummary(): string {
  return RULE_CORPUS
    .map(r => `- ${r.id}: ${r.rule.slice(0, 60)}`)
    .join('\n')
}

function buildUserPrompt(pack: PackSource, seedSummary: string): string {
  return `Transform the following agent rule pack into ConventionRule JSON objects.

source MUST be: "agent:${pack.name}"

=== AGENT PACK: ${pack.name} ===
${pack.content}
=== END AGENT PACK ===

ALREADY COVERED (do NOT duplicate these — the corpus already contains them):
${seedSummary}

Output ONLY the JSON array of ConventionRule objects.`
}

function buildJudgeSystemPrompt(): string {
  return `You are the Judge in a multi-model committee. Four AI models have each produced a JSON array of ConventionRule objects from the same agent rule pack.

Your task:
1. Merge the four drafts into ONE consolidated JSON array.
2. Keep the best, clearest rules. Deduplicate rules that say the same thing.
3. Enforce: "section" is one of ${CONTENT_SECTIONS.join(', ')}; "appliesWhen" (if present) is a subset of ${ALL_TAGS.join(', ')}; "severity" is "must" or "should"; "rule" imperative and concise.
4. Maximum ~8 rules total.

Output ONLY the consolidated JSON array. No commentary, no Markdown headings.`
}

function buildJudgeUserPrompt(packName: string, drafts: string[]): string {
  const labels = ['Claude Sonnet', 'GPT-4o', 'Gemini 2.5 Pro', 'Grok 4']
  const draftSections = drafts.map((d, i) => `
=== DRAFT ${i + 1}: ${labels[i] ?? `Model ${i + 1}`} ===
${d}
`).join('\n')

  return `Consolidate the best ConventionRule JSON array for the "${packName}" pack from these ${drafts.length} independent drafts:
${draftSections}

Output the single consolidated JSON array.`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Provider calls ─────────────────────────────────────────────────────────────

async function callProvider(
  label: string,
  modelFn: () => ReturnType<typeof getAnthropicModel | typeof getOpenAIModel | typeof getGeminiModel | typeof getGrokModel>,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  try {
    const { text } = await generateText({
      model: modelFn() as Parameters<typeof generateText>[0]['model'],
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 4096,
    })
    return text.trim()
  } catch (err) {
    console.warn(`  ⚠ ${label} failed: ${String(err).slice(0, 120)}`)
    return ''
  }
}

// ── Per-pack generation ─────────────────────────────────────────────────────────

async function generateForPack(pack: PackSource, seedSummary: string): Promise<ConventionRule[]> {
  console.log(`\n[${pack.name}] Starting…`)

  const systemPrompt = buildSystemPrompt()
  const userPrompt   = buildUserPrompt(pack, seedSummary)

  // 1. Call all 4 providers in parallel
  const [claudeDraft, gptDraft, geminiDraft, grokDraft] = await Promise.all([
    callProvider('Claude Sonnet', () => getAnthropicModel(REVIEWER_MODEL), systemPrompt, userPrompt),
    callProvider('GPT-4o',        getOpenAIModel, systemPrompt, userPrompt),
    callProvider('Gemini 2.5',    getGeminiModel, systemPrompt, userPrompt),
    callProvider('Grok 4',        getGrokModel,   systemPrompt, userPrompt),
  ])

  const drafts = [claudeDraft, gptDraft, geminiDraft, grokDraft].filter(Boolean)
  if (drafts.length === 0) {
    console.warn(`  ✗ All providers failed for ${pack.name} — skipping`)
    return []
  }
  console.log(`  ✓ Got ${drafts.length}/4 drafts`)

  // 2. Judge consolidates
  let judgeText: string
  if (drafts.length === 1) {
    judgeText = drafts[0]
    console.log('  ℹ Only 1 draft — using directly (no judge)')
  } else {
    console.log('  Judging…')
    judgeText = await callProvider(
      'Judge (Opus)',
      () => getAnthropicModel(JUDGE_MODEL),
      buildJudgeSystemPrompt(),
      buildJudgeUserPrompt(pack.name, drafts),
    )
    if (!judgeText) {
      console.warn('  ⚠ Judge failed — using first draft')
      judgeText = drafts[0]
    }
  }

  const rules = parseRules(judgeText)
  console.log(`  ✓ Parsed ${rules.length} rules from ${pack.name}`)
  return rules
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log(' Pre-Flight C2 — Corpus via Multi-Model Committee')
  console.log('═══════════════════════════════════════════════════════')

  // Verify providers
  const available = [
    process.env.ANTHROPIC_API_KEY ? 'Claude' : null,
    process.env.OPENAI_API_KEY    ? 'GPT-4o' : null,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Gemini' : null,
    process.env.XAI_API_KEY       ? 'Grok 4' : null,
  ].filter(Boolean)
  console.log(`Available providers: ${available.join(', ')}`)
  if (available.length < 2) {
    console.error('✗ Need at least 2 providers. Set API keys in .env.local')
    process.exit(1)
  }

  const packs = readAgentPacks()
  console.log(`Agent packs to process: ${packs.length}\n`)

  const seedSummary = buildSeedSummary()
  const all: ConventionRule[] = []

  for (const pack of packs) {
    const rules = await generateForPack(pack, seedSummary)
    all.push(...rules)
    // Pause between packs to respect rate limits
    if (pack !== packs[packs.length - 1]) {
      console.log('  … waiting 5 s before next pack …')
      await sleep(5000)
    }
  }

  // Post-process: validate against vocabulary, then dedupe against seed + internally
  const validated = validateAgainstVocab(all)
  const seedIds = new Set(RULE_CORPUS.map(r => r.id))
  const final = dedupeRules(validated, seedIds)

  console.log(`\nRaw rules: ${all.length} → validated: ${validated.length} → final (deduped): ${final.length}`)

  const fileBody = `// AUTO-GENERIERT von generate-corpus.ts — nicht von Hand editieren.\n`
    + `import type { ConventionRule } from './types'\n\n`
    + `export const GENERATED_CORPUS: ConventionRule[] = ${JSON.stringify(final, null, 2)}\n`
  writeFileSync(join(ROOT, 'src/lib/preflight/corpus/rule-corpus.generated.ts'), fileBody, 'utf-8')
  console.log(`✓ ${final.length} Regeln → rule-corpus.generated.ts`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
