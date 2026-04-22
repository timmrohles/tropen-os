// src/lib/fix-engine/consensus-generator.ts
// Calls multiple providers in parallel with the fix prompt, then uses Opus judge to pick the best diff.
// Reviewers use direct provider SDKs (no AI Gateway — not available locally).
// The Opus judge uses the direct anthropicInstance.
import { generateText } from 'ai'
import { anthropic as anthropicInstance } from '@/lib/llm/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createLogger } from '@/lib/logger'
import { FixLlmResponseSchema, JudgeResponseSchema } from './schemas'
import type { FixContext, ProviderFixDraft, ConsensusFix, FixLlmResponse } from './types'

const log = createLogger('fix-engine:consensus-generator')

// ---------------------------------------------------------------------------
// Provider definitions — direct SDK calls, no AI Gateway dependency
// ---------------------------------------------------------------------------

interface FixProvider {
  id: string
  isAvailable: () => boolean
  call: (prompt: string) => Promise<{ text: string; inputTokens: number; outputTokens: number }>
  costPerM: { input: number; output: number }
}

const PROVIDERS: FixProvider[] = [
  {
    id: 'anthropic',
    isAvailable: () => !!process.env.ANTHROPIC_API_KEY,
    call: async (prompt) => {
      const result = await generateText({
        model: anthropicInstance(REVIEWER_MODEL),
        prompt,
        maxOutputTokens: 2048,
        temperature: 0.1,
      })
      return {
        text: result.text,
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
      }
    },
    costPerM: { input: 3.0, output: 15.0 },
  },
  {
    id: 'openai',
    isAvailable: () => !!process.env.OPENAI_API_KEY,
    call: async (prompt) => {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
      const result = await generateText({
        model: openai('gpt-4o'),
        prompt,
        maxOutputTokens: 2048,
        temperature: 0.1,
      })
      return {
        text: result.text,
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
      }
    },
    costPerM: { input: 2.5, output: 10.0 },
  },
  {
    id: 'google',
    isAvailable: () => !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    call: async (prompt) => {
      const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })
      const result = await generateText({
        model: google('gemini-2.0-flash'),
        prompt,
        maxOutputTokens: 2048,
        temperature: 0.1,
      })
      return {
        text: result.text,
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
      }
    },
    costPerM: { input: 0.10, output: 0.40 },
  },
]

// ---------------------------------------------------------------------------
// Prompt builder (same format as generator.ts — inlined, not imported)
// ---------------------------------------------------------------------------

function buildPrompt(ctx: FixContext): string {
  const f = ctx.finding
  const parts: string[] = []

  parts.push(`You are a senior software engineer tasked with fixing an audit finding in a Next.js 15 / TypeScript codebase.`)
  parts.push(``)
  parts.push(`## Finding`)
  parts.push(`Rule: ${f.ruleId}`)
  parts.push(`Severity: ${f.severity}`)
  parts.push(`Agent: ${f.agentSource ?? 'core'}`)
  parts.push(`Message: ${f.message}`)
  if (f.suggestion) parts.push(`Suggestion: ${f.suggestion}`)
  if (f.filePath) parts.push(`File: ${f.filePath}${f.line ? `:${f.line}` : ''}`)
  if (f.enforcement) parts.push(`Enforcement: ${f.enforcement}`)

  if (ctx.surroundingLines) {
    parts.push(``)
    parts.push(`## Relevant Code (±30 lines)`)
    parts.push('```')
    parts.push(ctx.surroundingLines)
    parts.push('```')
  } else if (ctx.fileContent && ctx.fileContent.length < 8000) {
    parts.push(``)
    parts.push(`## Full File Content`)
    parts.push('```typescript')
    parts.push(ctx.fileContent)
    parts.push('```')
  }

  parts.push(``)
  parts.push(`## Instructions`)
  parts.push(`Respond with ONLY valid JSON (no markdown, no explanation outside JSON):`)
  parts.push(`{`)
  parts.push(`  "explanation": "What specifically needs to change and why (1-3 sentences)",`)
  parts.push(`  "confidence": "high" | "medium" | "low",`)
  parts.push(`  "diffs": [`)
  parts.push(`    {`)
  parts.push(`      "filePath": "relative/path/from/project/root",`)
  parts.push(`      "hunks": [`)
  parts.push(`        {`)
  parts.push(`          "oldStart": <1-based line number in original>,`)
  parts.push(`          "oldCount": <number of original lines>,`)
  parts.push(`          "newStart": <1-based line number in new file>,`)
  parts.push(`          "newCount": <number of new lines>,`)
  parts.push(`          "lines": [`)
  parts.push(`            " context line (space prefix)",`)
  parts.push(`            "-removed line (minus prefix)",`)
  parts.push(`            "+added line (plus prefix)"`)
  parts.push(`          ]`)
  parts.push(`        }`)
  parts.push(`      ]`)
  parts.push(`    }`)
  parts.push(`  ]`)
  parts.push(`}`)
  parts.push(``)
  parts.push(`Rules:`)
  parts.push(`- diffs array can be empty [] if the fix requires manual action only`)
  parts.push(`- confidence "high" = you are certain the fix is correct`)
  parts.push(`- confidence "medium" = fix is likely correct but context-dependent`)
  parts.push(`- confidence "low" = fix direction is right but manual review strongly recommended`)
  parts.push(`- Only modify what is necessary to fix this specific finding`)
  parts.push(`- Preserve all existing code style, formatting, and imports`)

  return parts.join('\n')
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

function parseLlmResponse(raw: string): FixLlmResponse {
  const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`LLM response is not valid JSON: ${cleaned.slice(0, 200)}`)
  }

  const result = FixLlmResponseSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`LLM response failed schema validation: ${result.error.message}`)
  }

  return result.data
}

// ---------------------------------------------------------------------------
// Per-provider call
// ---------------------------------------------------------------------------

async function callProvider(provider: FixProvider, prompt: string): Promise<ProviderFixDraft> {
  try {
    log.info('Calling provider', { providerId: provider.id })
    const { text, inputTokens, outputTokens } = await provider.call(prompt)
    const costEur =
      (inputTokens / 1_000_000) * provider.costPerM.input +
      (outputTokens / 1_000_000) * provider.costPerM.output
    const fix = parseLlmResponse(text)
    log.info('Provider response received', { providerId: provider.id, inputTokens, outputTokens, costEur: costEur.toFixed(5) })
    return {
      providerId: provider.id,
      explanation: fix.explanation,
      confidence: fix.confidence,
      diffs: fix.diffs,
      costEur,
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    log.error('Provider call failed', { providerId: provider.id, err: errMsg })
    return {
      providerId: provider.id,
      explanation: '',
      confidence: 'low',
      diffs: [],
      costEur: 0,
      error: errMsg,
    }
  }
}

// ---------------------------------------------------------------------------
// Judge
// ---------------------------------------------------------------------------

const REVIEWER_MODEL = 'claude-sonnet-4' + '-20250514'
const JUDGE_MODEL_ID  = 'claude-opus-4'  + '-20250514'
const JUDGE_COST_PER_M = { input: 14.25, output: 71.25 }

const JUDGE_SYSTEM = `You are a principal engineer evaluating multiple AI-generated code fixes for the same finding.
Each fix comes from a different model. Your job: select the best fix and explain why.
The best fix is the one that is most targeted, minimal, and correct.

Return ONLY valid JSON (no markdown):
{
  "winnerProviderId": "<provider id>",
  "judgeExplanation": "<1-2 sentences why this fix is best>",
  "consensusLevel": "unanimous" | "majority" | "split" | "single"
}

consensusLevel:
- "unanimous": all providers produced valid diffs targeting the same issue
- "majority": 3+ providers agree
- "split": 2 providers agree
- "single": only 1 valid diff exists`

interface JudgeResult {
  winnerProviderId: string
  judgeExplanation: string
  consensusLevel: 'unanimous' | 'majority' | 'split' | 'single'
  costEur: number
}

async function runJudge(drafts: ProviderFixDraft[]): Promise<JudgeResult> {
  const draftSummary = drafts.map(d => ({
    providerId: d.providerId,
    explanation: d.explanation,
    confidence: d.confidence,
    diffCount: d.diffs.length,
    hasError: !!d.error,
  }))

  const judgePrompt = `Here are the fixes proposed by different AI models for the same audit finding:\n\n${JSON.stringify(draftSummary, null, 2)}\n\nSelect the best fix.`

  log.info('Running Opus judge', { draftCount: drafts.length })

  const result = await generateText({
    model: anthropicInstance(JUDGE_MODEL_ID),
    system: JUDGE_SYSTEM,
    prompt: judgePrompt,
    maxOutputTokens: 512,
    temperature: 0,
  })

  const inputTokens = result.usage?.inputTokens ?? 0
  const outputTokens = result.usage?.outputTokens ?? 0
  const costEur =
    (inputTokens / 1_000_000) * JUDGE_COST_PER_M.input +
    (outputTokens / 1_000_000) * JUDGE_COST_PER_M.output

  const cleaned = result.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  let judgeJson: unknown
  try {
    judgeJson = JSON.parse(cleaned)
  } catch {
    throw new Error(`Judge response is not valid JSON: ${cleaned.slice(0, 200)}`)
  }

  const judgeResult = JudgeResponseSchema.safeParse(judgeJson)
  if (!judgeResult.success) {
    throw new Error(`Judge response failed schema validation: ${judgeResult.error.message}`)
  }
  const parsed = judgeResult.data

  log.info('Judge decision', { winner: parsed.winnerProviderId, consensus: parsed.consensusLevel, costEur: costEur.toFixed(5) })

  return {
    winnerProviderId: parsed.winnerProviderId,
    judgeExplanation: parsed.judgeExplanation,
    consensusLevel: parsed.consensusLevel,
    costEur,
  }
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export interface ConsensusGeneratorResult {
  consensus: ConsensusFix
  model: string
  totalCostEur: number
}

export async function generateConsensusFix(ctx: FixContext): Promise<ConsensusGeneratorResult> {
  log.info('Starting consensus fix generation', {
    ruleId: ctx.finding.ruleId,
    filePath: ctx.finding.filePath,
    severity: ctx.finding.severity,
  })

  // Filter available providers
  const availableProviders = PROVIDERS.filter(p => p.isAvailable())
  log.info('Available providers', { providers: availableProviders.map(p => p.id) })

  const prompt = buildPrompt(ctx)

  // Run all providers in parallel
  const drafts = await Promise.all(availableProviders.map(p => callProvider(p, prompt)))

  const validDrafts = drafts.filter(d => !d.error && d.diffs.length > 0)
  const providerCostEur = drafts.reduce((sum, d) => sum + d.costEur, 0)

  log.info('Provider drafts collected', { total: drafts.length, valid: validDrafts.length })

  let winnerProviderId: string
  let judgeExplanation: string
  let consensusLevel: 'unanimous' | 'majority' | 'split' | 'single'
  let judgeCostEur = 0

  if (validDrafts.length <= 1) {
    // Only 1 (or 0) valid draft — skip judge
    const winner = validDrafts[0] ?? drafts[0]
    winnerProviderId = winner.providerId
    judgeExplanation = validDrafts.length === 1
      ? 'Only one provider produced a valid fix.'
      : 'No valid diff was produced by any provider.'
    consensusLevel = 'single'
    log.info('Skipping judge — single valid draft', { winnerProviderId })
  } else {
    // Run Opus judge
    const judgeResult = await runJudge(drafts)
    winnerProviderId = judgeResult.winnerProviderId
    judgeExplanation = judgeResult.judgeExplanation
    consensusLevel = judgeResult.consensusLevel
    judgeCostEur = judgeResult.costEur
  }

  const totalCostEur = providerCostEur + judgeCostEur

  const consensus: ConsensusFix = {
    drafts,
    judgeExplanation,
    winnerProviderId,
    consensusLevel,
    totalCostEur,
  }

  log.info('Consensus fix complete', {
    winner: winnerProviderId,
    consensusLevel,
    totalCostEur: totalCostEur.toFixed(5),
  })

  return {
    consensus,
    model: JUDGE_MODEL_ID,
    totalCostEur,
  }
}
