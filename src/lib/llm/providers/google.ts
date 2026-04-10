// src/lib/llm/providers/google.ts
// Gemini via direct Google AI key (GOOGLE_GENERATIVE_AI_API_KEY)
// Skipped gracefully when key not present

import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createLogger } from '@/lib/logger'
import type { ReviewProvider, ReviewResponse, ProviderFinding } from './types'

const log = createLogger('google-provider')
const MODEL = 'gemini-2.5-pro'

const COST_IN_EUR  = 1.25
const COST_OUT_EUR = 5.00

function getModel() {
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '' })
  return google(MODEL)
}

export const googleProvider: ReviewProvider = {
  id: 'google',
  displayName: 'Gemini 2.5 Pro',
  isAvailable: () => !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,

  async callReview(prompt, systemPrompt): Promise<ReviewResponse> {
    const t0 = Date.now()
    try {
      const { text, usage } = await generateText({
        model: getModel(),
        system: systemPrompt,
        prompt,
        maxOutputTokens: 16384,
      })
      const findings = parseJson(text)
      if (findings.length === 0) {
        log.warn('Gemini returned 0 findings', {
          rawLength: text.length,
          rawPreview: text.slice(0, 500),
        })
      }
      return {
        providerId: 'google',
        findings,
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        durationMs: Date.now() - t0,
      }
    } catch (err) {
      return errResp('google', t0, err)
    }
  },
}

export function googleCostEur(inp: number, out: number) {
  return (inp / 1_000_000) * COST_IN_EUR + (out / 1_000_000) * COST_OUT_EUR
}

/**
 * Robustly extract a JSON array from Gemini output.
 *
 * Gemini 2.5 Pro may return:
 *  1. Thinking blocks wrapped in <thinking>...</thinking> before the JSON
 *  2. A fenced code block  ```json [...] ```
 *  3. A bare JSON array starting with [
 *  4. Prose followed by an embedded JSON array
 */
function parseJson(text: string): ProviderFinding[] {
  // Strip <thinking>...</thinking> blocks (Gemini 2.5 extended thinking)
  const stripped = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim()

  // 1. Fenced code block: ```json ... ``` or ``` ... ```
  const fenced = stripped.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) {
    try { return asArray(JSON.parse(fenced[1].trim())) } catch { /* try next */ }
  }

  // 2. Bare JSON array starting with [
  const arrayStart = stripped.indexOf('[')
  if (arrayStart !== -1) {
    const candidate = stripped.slice(arrayStart)
    // Find the matching closing bracket
    try { return asArray(JSON.parse(candidate)) } catch { /* try next */ }

    // Gemini sometimes truncates — try to parse up to the last complete object
    const lastBrace = candidate.lastIndexOf('}')
    if (lastBrace !== -1) {
      try { return asArray(JSON.parse(candidate.slice(0, lastBrace + 1) + ']')) } catch { /* try next */ }
    }
  }

  // 3. Whole text as JSON
  try { return asArray(JSON.parse(stripped)) } catch { /* fall through */ }

  log.error('parseJson: could not extract JSON array from Gemini response', {
    strippedLength: stripped.length,
    strippedPreview: stripped.slice(0, 300),
  })
  return []
}

function asArray(val: unknown): ProviderFinding[] {
  if (Array.isArray(val)) return val as ProviderFinding[]
  throw new Error('not an array')
}

function errResp(providerId: ReviewProvider['id'], t0: number, err: unknown): ReviewResponse {
  return { providerId, findings: [], inputTokens: 0, outputTokens: 0, durationMs: Date.now() - t0, error: String(err) }
}
