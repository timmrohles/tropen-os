// src/lib/review/orchestrator.ts
// Runs all 4 providers in parallel, calculates consensus, runs judge

import { anthropicProvider, anthropicCostEur } from '@/lib/llm/providers/anthropic'
import { openaiProvider, openaiCostEur } from '@/lib/llm/providers/openai'
import { googleProvider, googleCostEur } from '@/lib/llm/providers/google'
import { xaiProvider, xaiCostEur } from '@/lib/llm/providers/xai'
import type { ReviewProvider, ReviewResponse, ProviderId } from '@/lib/llm/providers/types'
import type { MultiModelReviewResult, ProviderCost } from './types'
import { runJudge, JUDGE_MODEL } from './judge'
import { buildReviewPrompt, REVIEW_SYSTEM_PROMPT } from './prompt-builder'
import { createLogger } from '@/lib/logger'

const log = createLogger('review:orchestrator')

const ALL_PROVIDERS: ReviewProvider[] = [
  anthropicProvider,
  openaiProvider,
  googleProvider,
  xaiProvider,
]

const COST_FN: Record<ProviderId, (inp: number, out: number) => number> = {
  anthropic: anthropicCostEur,
  openai:    openaiCostEur,
  google:    googleCostEur,
  xai:       xaiCostEur,
}

// EUR per 1M tokens for Opus judge
const JUDGE_COST_IN_EUR  = 14.25
const JUDGE_COST_OUT_EUR = 71.25

interface RunOptions {
  repoSummary: string
  criticalFiles?: string[]
  recentFindings?: string[]
  runId: string
}

export async function runMultiModelReview(opts: RunOptions): Promise<MultiModelReviewResult> {
  const t0 = Date.now()
  const prompt = buildReviewPrompt({
    repoSummary: opts.repoSummary,
    criticalFiles: opts.criticalFiles ?? [],
    recentFindings: opts.recentFindings ?? [],
  })

  // Only call providers that have credentials
  const active = ALL_PROVIDERS.filter((p) => p.isAvailable())

  log.info('Starting review', { activeProviders: active.map((p) => p.id) })

  // Run all active providers in parallel
  const responses: ReviewResponse[] = await Promise.all(
    active.map((p) => p.callReview(prompt, REVIEW_SYSTEM_PROMPT))
  )

  for (const r of responses) {
    if (r.error) {
      log.error('Provider error', { provider: r.providerId, error: r.error })
    } else {
      log.info('Provider done', { provider: r.providerId, findings: r.findings.length, tokens: r.inputTokens + r.outputTokens })
    }
  }

  const quorumMet = responses.filter((r) => !r.error).length >= 2
  log.info('Quorum', { met: quorumMet, responding: responses.filter((r) => !r.error).length })

  // Judge receives all raw findings and does semantic deduplication + consensus
  const { refined, inputTokens: judgeIn, outputTokens: judgeOut } = quorumMet
    ? await runJudge(responses)
    : { refined: [], inputTokens: 0, outputTokens: 0 }

  // Build per-provider cost breakdown
  const providerCosts: ProviderCost[] = responses.map((r) => ({
    providerId: r.providerId,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    costEur: COST_FN[r.providerId](r.inputTokens, r.outputTokens),
    durationMs: r.durationMs,
    error: r.error,
  }))

  const judgeCostEur =
    (judgeIn / 1_000_000) * JUDGE_COST_IN_EUR +
    (judgeOut / 1_000_000) * JUDGE_COST_OUT_EUR

  const totalCostEur =
    providerCosts.reduce((s, c) => s + c.costEur, 0) + judgeCostEur

  return {
    runId: opts.runId,
    consensusFindings: refined,
    providerCosts,
    totalCostEur: parseFloat(totalCostEur.toFixed(4)),
    modelsUsed: responses.map((r) => r.providerId),
    judgeModel: JUDGE_MODEL,
    quorumMet,
    durationMs: Date.now() - t0,
  }
}
