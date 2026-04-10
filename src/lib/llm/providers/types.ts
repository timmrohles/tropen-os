// src/lib/llm/providers/types.ts
// Shared types for the multi-model review provider layer

export type ProviderId = 'anthropic' | 'openai' | 'google' | 'xai'

export interface ProviderFinding {
  ruleRef: string          // e.g. "cat-3-rule-3" or free-form identifier
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  filePath?: string
  suggestion?: string
  confidence: number       // 0–1
}

export interface ReviewResponse {
  providerId: ProviderId
  findings: ProviderFinding[]
  inputTokens: number
  outputTokens: number
  durationMs: number
  error?: string           // set when provider failed (graceful degradation)
}

export interface ReviewProvider {
  id: ProviderId
  displayName: string
  isAvailable: () => boolean
  callReview: (prompt: string, systemPrompt: string) => Promise<ReviewResponse>
}
