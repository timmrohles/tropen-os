// src/lib/llm/providers/xai.ts
// Grok 4 via xAI API (OpenAI-compatible endpoint)
// Skipped gracefully when key not present

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type { ReviewProvider, ReviewResponse } from './types'

const MODEL = 'grok-4'

const COST_IN_EUR  = 2.25
const COST_OUT_EUR = 9.00

function getModel() {
  const xai = createOpenAI({
    apiKey: process.env.XAI_API_KEY ?? '',
    baseURL: 'https://api.x.ai/v1',
  })
  return xai(MODEL)
}

export const xaiProvider: ReviewProvider = {
  id: 'xai',
  displayName: 'Grok 4',
  isAvailable: () => !!process.env.XAI_API_KEY,

  async callReview(prompt, systemPrompt): Promise<ReviewResponse> {
    const t0 = Date.now()
    try {
      const { text, usage } = await generateText({
        model: getModel(),
        system: systemPrompt,
        prompt,
        maxOutputTokens: 4096,
      })
      return {
        providerId: 'xai',
        findings: parseJson(text),
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        durationMs: Date.now() - t0,
      }
    } catch (err) {
      return errResp(t0, err)
    }
  },
}

export function xaiCostEur(inp: number, out: number) {
  return (inp / 1_000_000) * COST_IN_EUR + (out / 1_000_000) * COST_OUT_EUR
}

function parseJson(text: string) {
  try {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    return JSON.parse(m ? m[1].trim() : text.trim())
  } catch { return [] }
}

function errResp(t0: number, err: unknown): ReviewResponse {
  return { providerId: 'xai', findings: [], inputTokens: 0, outputTokens: 0, durationMs: Date.now() - t0, error: String(err) }
}
