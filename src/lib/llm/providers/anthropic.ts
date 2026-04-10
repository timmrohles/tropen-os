// src/lib/llm/providers/anthropic.ts
// Claude Sonnet via direct Anthropic API key

import { generateText } from 'ai'
import { anthropic as anthropicInstance } from '@/lib/llm/anthropic'
import type { ReviewProvider, ReviewResponse } from './types'

const MODEL = 'claude-sonnet-4-20250514'

const COST_IN_EUR  = 2.85
const COST_OUT_EUR = 14.25

export const anthropicProvider: ReviewProvider = {
  id: 'anthropic',
  displayName: 'Claude Sonnet',
  isAvailable: () => !!process.env.ANTHROPIC_API_KEY,

  async callReview(prompt, systemPrompt): Promise<ReviewResponse> {
    const t0 = Date.now()
    try {
      const { text, usage } = await generateText({
        model: anthropicInstance(MODEL),
        system: systemPrompt,
        prompt,
        maxOutputTokens: 4096,
      })
      return {
        providerId: 'anthropic',
        findings: parseJson(text),
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        durationMs: Date.now() - t0,
      }
    } catch (err) {
      return errResp('anthropic', t0, err)
    }
  },
}

export function anthropicCostEur(inp: number, out: number) {
  return (inp / 1_000_000) * COST_IN_EUR + (out / 1_000_000) * COST_OUT_EUR
}

function parseJson(text: string) {
  try {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    return JSON.parse(m ? m[1].trim() : text.trim())
  } catch { return [] }
}

function errResp(providerId: ReviewProvider['id'], t0: number, err: unknown): ReviewResponse {
  return { providerId, findings: [], inputTokens: 0, outputTokens: 0, durationMs: Date.now() - t0, error: String(err) }
}
