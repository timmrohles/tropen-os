// src/lib/feed-cost-estimator.ts
// Pure client-side cost estimation for feed sources — no DB access required.

import type { FeedSourceType } from '@/types/feeds'

const COST = {
  // Stage 2: Haiku scoring (title + snippet → score + reason)
  stage2Input:      500,         // tokens
  stage2Output:     50,          // tokens
  stage2InputRate:  0.00000025,  // $/token (Haiku input)
  stage2OutputRate: 0.00000125,  // $/token (Haiku output)

  // Stage 3: Sonnet deep summary (full content → summary + key_facts)
  stage3Input:      2000,        // tokens
  stage3Output:     300,         // tokens
  stage3InputRate:  0.000003,    // $/token (Sonnet input)
  stage3OutputRate: 0.000015,    // $/token (Sonnet output)

  // Filter rates (fraction removed at each stage)
  stage1FilterRate: 0.65,
  scoreFilterRates: { 1: 0.05, 2: 0.1, 3: 0.2, 4: 0.3, 5: 0.4, 6: 0.5, 7: 0.6, 8: 0.7, 9: 0.8, 10: 0.9 },
} as const

// Default articles-per-week estimates by source type
const DEFAULT_WEEKLY: Record<FeedSourceType, number> = {
  rss:   15,
  url:   10,
  api:   20,
  email: 5,
}

export function estimateArticlesPerWeek(type: FeedSourceType): number {
  return DEFAULT_WEEKLY[type] ?? 10
}

export interface CostEstimate {
  articlesPerWeek: number
  articlesAfterFilter: number
  weeklyEur: number
  monthlyEur: number
}

export function estimateFeedCost(articlesPerWeek: number, minScore: number): CostEstimate {
  const afterStage1 = Math.round(articlesPerWeek * (1 - COST.stage1FilterRate))
  const scoreRate = COST.scoreFilterRates[minScore as keyof typeof COST.scoreFilterRates] ?? 0.5
  const afterStage2 = Math.round(afterStage1 * (1 - scoreRate))

  const stage2Cost = afterStage1 * (
    COST.stage2Input  * COST.stage2InputRate +
    COST.stage2Output * COST.stage2OutputRate
  )
  const stage3Cost = afterStage2 * (
    COST.stage3Input  * COST.stage3InputRate +
    COST.stage3Output * COST.stage3OutputRate
  )

  const weeklyEur = stage2Cost + stage3Cost
  return {
    articlesPerWeek,
    articlesAfterFilter: afterStage2,
    weeklyEur,
    monthlyEur: weeklyEur * 4.3,
  }
}

export function formatCostPerWeek(eur: number): string {
  if (eur < 0.001) return '< 0,001 €'
  return `~${eur.toFixed(3)} €`
}
