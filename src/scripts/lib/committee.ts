// src/scripts/lib/committee.ts
// Einzige Quelle der Wahrheit für das Multi-Model-Committee (CLI-Skripte).
// Routing: Vercel AI Gateway via plain "provider/model"-Strings (AI SDK v6).
// Auth: AI_GATEWAY_API_KEY in .env.local (mit `tsx --env-file=.env.local` laden).
import { generateText } from 'ai'

export interface CommitteeMember { label: string; model: string }

// Roster A (Stand 2026-06-20): 4 fremde Reviewer + Anthropic-Judge → kein Selbst-Bias.
// Slugs gegen die Live-Gateway-Liste verifiziert.
export const COMMITTEE_REVIEWERS: readonly CommitteeMember[] = [
  { label: 'GPT-5.5',        model: 'openai/gpt-5.5' },
  { label: 'Gemini 3.1 Pro', model: 'google/gemini-3.1-pro-preview' },
  { label: 'Grok 4.3',       model: 'xai/grok-4.3' },
  { label: 'DeepSeek V3.2',  model: 'deepseek/deepseek-v3.2' }, // Upgrade-Option: 'deepseek/deepseek-v4-pro'
] as const

export const COMMITTEE_JUDGE: CommitteeMember = {
  label: 'Judge (Opus 4.8)',
  model: 'anthropic/claude-opus-4.8',
}

export interface CallResult { text: string; inputTokens: number; outputTokens: number }

// Approx. Listenpreise USD/Mio Token (Stand 2026-06) — nur für Schätzung, kein Billing.
export const PRICE_TABLE: Record<string, { inPerM: number; outPerM: number }> = {
  'openai/gpt-5.5':                  { inPerM: 2.5,  outPerM: 10.0 },
  'google/gemini-3.1-pro-preview':   { inPerM: 1.25, outPerM: 10.0 },
  'xai/grok-4.3':                    { inPerM: 3.0,  outPerM: 15.0 },
  'deepseek/deepseek-v3.2':          { inPerM: 0.3,  outPerM: 0.5 },
  'anthropic/claude-opus-4.8':       { inPerM: 15.0, outPerM: 75.0 },
}
const USD_TO_EUR = 0.93
const FALLBACK_PRICE = { inPerM: 3.0, outPerM: 15.0 }

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICE_TABLE[model] ?? FALLBACK_PRICE
  return ((inputTokens * p.inPerM + outputTokens * p.outPerM) / 1_000_000) * USD_TO_EUR
}

/** Bricht früh ab, wenn der Gateway-Key fehlt. */
export function requireGatewayAuth(): void {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    console.error('✗ AI_GATEWAY_API_KEY (oder VERCEL_OIDC_TOKEN) fehlt in .env.local')
    console.error('  Lauf mit: pnpm exec tsx --env-file=.env.local <script>')
    process.exit(1)
  }
}

/**
 * Ruft ein Committee-Modell über den AI Gateway auf. Fehler werden gefangen
 * und als leeres Ergebnis zurückgegeben (Skripte filtern leere Drafts).
 */
export async function callCommitteeModel(
  member: CommitteeMember,
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens = 2048,
): Promise<CallResult> {
  try {
    const result = await generateText({
      model: member.model as Parameters<typeof generateText>[0]['model'],
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens,
    })
    const text = result.text?.trim() ?? ''
    if (!text) {
      console.warn(`  ⚠ ${member.label} returned empty text (finishReason: ${result.finishReason}, tokens: ${result.usage?.inputTokens ?? 0}/${result.usage?.outputTokens ?? 0})`)
    }
    return {
      text,
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
    }
  } catch (err) {
    console.warn(`  ⚠ ${member.label} failed: ${String(err).slice(0, 160)}`)
    return { text: '', inputTokens: 0, outputTokens: 0 }
  }
}
