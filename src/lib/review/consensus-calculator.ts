// src/lib/review/consensus-calculator.ts
// Groups findings across providers and calculates consensus levels

import type { ReviewResponse, ProviderId, ProviderFinding } from '@/lib/llm/providers/types'
import type { ConsensusFinding, ConsensusLevel } from './types'
import { normalizeFindings } from './response-parser'

// Two findings are "the same issue" if their ruleRef + severity + first 60 chars of message match
function fingerprintFinding(f: ProviderFinding): string {
  const msg = f.message.toLowerCase().replace(/\s+/g, ' ').slice(0, 60)
  return `${f.ruleRef}|${f.severity}|${msg}`
}

function consensusLevel(count: number, total: number): ConsensusLevel {
  if (count === total) return 'unanimous'
  if (count >= Math.ceil(total * 0.75)) return 'majority'
  if (count >= 2) return 'split'
  return 'single'
}

export function calculateConsensus(
  responses: ReviewResponse[],
  minQuorum = 2,
): ConsensusFinding[] {
  const responding = responses.filter((r) => !r.error)
  if (responding.length < minQuorum) return []

  // Build map: fingerprint → { providers, findings }
  const groups = new Map<string, {
    providers: Set<ProviderId>
    samples: ProviderFinding[]
  }>()

  for (const resp of responding) {
    const normalized = normalizeFindings(resp.findings as unknown[])
    for (const finding of normalized) {
      const fp = fingerprintFinding(finding)
      const existing = groups.get(fp)
      if (existing) {
        existing.providers.add(resp.providerId)
        existing.samples.push(finding)
      } else {
        groups.set(fp, { providers: new Set([resp.providerId]), samples: [finding] })
      }
    }
  }

  const total = responding.length
  const results: ConsensusFinding[] = []

  for (const { providers, samples } of groups.values()) {
    // Only include findings flagged by ≥2 providers (quorum)
    if (providers.size < minQuorum) continue

    // Use the sample with the highest confidence as canonical
    const canonical = samples.reduce((best, cur) =>
      cur.confidence > best.confidence ? cur : best
    )
    const avgConfidence = samples.reduce((s, f) => s + f.confidence, 0) / samples.length

    results.push({
      ruleRef: canonical.ruleRef,
      severity: canonical.severity,
      message: canonical.message,
      filePath: canonical.filePath,
      suggestion: canonical.suggestion,
      consensusLevel: consensusLevel(providers.size, total),
      modelsFlagged: Array.from(providers),
      avgConfidence: parseFloat(avgConfidence.toFixed(2)),
    })
  }

  // Sort: critical/high first, then by provider count desc
  const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  results.sort((a, b) => {
    const sd = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    return sd !== 0 ? sd : b.modelsFlagged.length - a.modelsFlagged.length
  })

  return results
}
