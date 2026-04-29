// src/lib/audit/domain-filter.ts
// Domain-based finding filter for the 7-tab audit UI (ADR-025 + ADR-026).
// Replaces tier-based filtering (getFindingsByTier) for UI purposes.
// tier still exists for internal scoring; domain is for display.

import type { AuditDomain } from './types'
import { AUDIT_RULES } from './rule-registry'

export const ALL_DOMAINS: AuditDomain[] = [
  'code-quality',
  'performance',
  'security',
  'accessibility',
  'dsgvo',
  'ki-act',
  'documentation',
]

export function getDomainForRule(ruleId: string): AuditDomain {
  const rule = AUDIT_RULES.find(r => r.id === ruleId)
  return rule?.domain ?? 'code-quality'
}

export function getFindingsByDomain(
  findings: Array<Record<string, unknown>>,
  domain: AuditDomain
): Array<Record<string, unknown>> {
  return findings.filter(f => getDomainForRule(f.rule_id as string) === domain)
}

export function getDomainCounts(
  findings: Array<Record<string, unknown>>
): Record<AuditDomain, number> {
  const open = findings.filter(f => f.status === 'open')
  const counts: Record<AuditDomain, number> = {
    'code-quality': 0,
    'performance': 0,
    'security': 0,
    'accessibility': 0,
    'dsgvo': 0,
    'ki-act': 0,
    'documentation': 0,
  }
  for (const f of open) {
    const domain = getDomainForRule(f.rule_id as string)
    counts[domain]++
  }
  return counts
}
