import { AUDIT_RULES } from './rule-registry'

type AuditTier = 'code' | 'metric' | 'compliance'

export function getFindingsByTier(
  findings: Array<Record<string, unknown>>,
  tier: AuditTier
): Array<Record<string, unknown>> {
  return findings.filter(f => {
    const rule = AUDIT_RULES.find(r => r.id === (f.rule_id as string))
    return (rule?.tier ?? 'code') === tier
  })
}

export function getTierCounts(findings: Array<Record<string, unknown>>): Record<AuditTier, number> {
  const open = findings.filter(f => f.status === 'open')
  return {
    code:       open.filter(f => (AUDIT_RULES.find(r => r.id === (f.rule_id as string))?.tier ?? 'code') === 'code').length,
    metric:     open.filter(f => AUDIT_RULES.find(r => r.id === (f.rule_id as string))?.tier === 'metric').length,
    compliance: open.filter(f => AUDIT_RULES.find(r => r.id === (f.rule_id as string))?.tier === 'compliance').length,
  }
}
