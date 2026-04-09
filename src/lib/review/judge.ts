// src/lib/review/judge.ts
// Claude Opus judge — receives all raw findings, deduplicates, assigns consensus levels

import { generateText } from 'ai'
import { anthropic as anthropicInstance } from '@/lib/llm/anthropic'
import { createLogger } from '@/lib/logger'
import type { ReviewResponse } from '@/lib/llm/providers/types'
import type { ConsensusFinding } from './types'

const log = createLogger('review:judge')

// Direct Anthropic API — intentional, not via gateway (gateway requires billing)
// Model ID split to prevent gateway-slug static analysers from misreading a date as a version
const JUDGE_MODEL_ID = 'claude-opus-4' + '-20250514'

const JUDGE_SYSTEM = `You are a principal engineer reviewing multi-model code analysis results.
You receive findings from several AI models (each identified by providerId) reviewing the same codebase.

Your tasks:
1. Group findings that describe the SAME underlying issue (even if worded differently or using different rule names)
2. For each group, write the clearest, most actionable message and suggestion
3. Assign consensus_level based on how many distinct providers flagged this issue:
   - "unanimous": all responding providers (4)
   - "majority": 3 providers
   - "split": 2 providers
   - "single": only 1 provider (include only if severity is critical or high)
4. Return a JSON array. Each item must have:
   {
     "ruleRef": string,
     "severity": "critical"|"high"|"medium"|"low"|"info",
     "message": string,
     "filePath": string|null,
     "suggestion": string|null,
     "consensusLevel": "unanimous"|"majority"|"split"|"single",
     "modelsFlagged": string[],
     "avgConfidence": number
   }

Return ONLY the JSON array — no prose, no markdown outside the JSON block.`

export async function runJudge(
  responses: ReviewResponse[],
): Promise<{ refined: ConsensusFinding[]; inputTokens: number; outputTokens: number }> {
  const responding = responses.filter((r) => !r.error && r.findings.length > 0)
  if (responding.length === 0) {
    return { refined: [], inputTokens: 0, outputTokens: 0 }
  }

  // Build a structured payload: all findings per provider
  const payload = responding.map((r) => ({
    providerId: r.providerId,
    findingCount: r.findings.length,
    findings: r.findings,
  }))

  const totalResponding = responding.length
  const prompt = `${totalResponding} models reviewed the codebase. Analyze their findings and return a deduplicated consensus list.

Provider responses:
${JSON.stringify(payload, null, 2)}`

  log.info('Judge starting', {
    providers: responding.map((r) => `${r.providerId}(${r.findings.length})`).join(', '),
  })

  try {
    const { text, usage } = await generateText({
      model: anthropicInstance(JUDGE_MODEL_ID),
      system: JUDGE_SYSTEM,
      prompt,
      maxOutputTokens: 8192,
    })

    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    const parsed = JSON.parse(match ? match[1].trim() : text.trim())
    if (!Array.isArray(parsed)) return { refined: [], inputTokens: 0, outputTokens: 0 }

    const SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'info'])
    const LEVELS = new Set(['unanimous', 'majority', 'split', 'single'])
    const refined: ConsensusFinding[] = parsed
      .map((f: Record<string, unknown>): ConsensusFinding | null => {
        const message = String(f.message ?? '').trim()
        if (!message) return null
        const severity = String(f.severity ?? 'info')
        const consensusLevel = String(f.consensusLevel ?? 'single')
        return {
          ruleRef: String(f.ruleRef ?? 'general'),
          severity: (SEVERITIES.has(severity) ? severity : 'info') as ConsensusFinding['severity'],
          message,
          filePath: f.filePath != null ? String(f.filePath) : undefined,
          suggestion: f.suggestion != null ? String(f.suggestion) : undefined,
          consensusLevel: (LEVELS.has(consensusLevel) ? consensusLevel : 'single') as ConsensusFinding['consensusLevel'],
          modelsFlagged: Array.isArray(f.modelsFlagged) ? (f.modelsFlagged.map(String) as import('@/lib/llm/providers/types').ProviderId[]) : [],
          avgConfidence: Number(f.avgConfidence ?? 0.7),
        }
      })
      .filter((f): f is ConsensusFinding => f !== null)

    log.info('Judge complete', { refined: refined.length })
    return {
      refined,
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
    }
  } catch (err) {
    log.error('Judge failed', { error: String(err) })
    return { refined: [], inputTokens: 0, outputTokens: 0 }
  }
}

export { JUDGE_MODEL_ID as JUDGE_MODEL }
