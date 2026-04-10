// src/lib/llm/providers/openai.ts
// GPT-4o via direct OpenAI API key

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type { ReviewProvider, ReviewResponse } from './types'

const MODEL = 'gpt-4o'

const COST_IN_EUR  = 4.55
const COST_OUT_EUR = 13.65

function getModel() {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })
  return openai(MODEL)
}

export const openaiProvider: ReviewProvider = {
  id: 'openai',
  displayName: 'GPT-4o',
  isAvailable: () => !!process.env.OPENAI_API_KEY,

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
        providerId: 'openai',
        findings: parseJson(text),
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        durationMs: Date.now() - t0,
      }
    } catch (err) {
      return errResp('openai', t0, err)
    }
  },
}

export function openaiCostEur(inp: number, out: number) {
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
