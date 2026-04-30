// src/lib/review/response-parser.ts
// Normalizes raw provider findings into a consistent shape

import type { ProviderFinding } from '@/lib/llm/providers/types'

const VALID_SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'info'])

export function normalizeFindings(raw: unknown[]): ProviderFinding[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item): ProviderFinding[] => {
    if (typeof item !== 'object' || item === null) return []
    const f = item as Record<string, unknown>

    const severity = String(f.severity ?? 'info').toLowerCase()
    const message = String(f.message ?? '').trim()
    if (!message) return []

    return [{
      ruleRef: String(f.ruleRef ?? f.rule_ref ?? f.rule ?? '').trim() || 'general',
      severity: VALID_SEVERITIES.has(severity)
        ? (severity as ProviderFinding['severity'])
        : 'info',
      message,
      filePath: f.filePath == null ? undefined : String(f.filePath),
      suggestion: f.suggestion == null ? undefined : String(f.suggestion),
      confidence: clamp(Number(f.confidence ?? 0.7), 0, 1),
    }]
  })
}

function clamp(n: number, min: number, max: number) {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min
}
