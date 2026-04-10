// src/lib/review/types.ts
// Types for the multi-model review pipeline

import type { ProviderId } from '@/lib/llm/providers/types'

export type ConsensusLevel = 'unanimous' | 'majority' | 'split' | 'single'

export interface ConsensusFinding {
  ruleRef: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  filePath?: string
  suggestion?: string
  consensusLevel: ConsensusLevel
  modelsFlagged: ProviderId[]    // which providers raised this finding
  avgConfidence: number          // average confidence across flagging providers
}

export interface ProviderCost {
  providerId: ProviderId
  inputTokens: number
  outputTokens: number
  costEur: number
  durationMs: number
  error?: string
}

export interface MultiModelReviewResult {
  runId: string
  consensusFindings: ConsensusFinding[]
  providerCosts: ProviderCost[]
  totalCostEur: number
  modelsUsed: ProviderId[]
  judgeModel: string
  quorumMet: boolean            // true if ≥2 providers responded
  durationMs: number
}
