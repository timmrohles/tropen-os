// src/lib/audit/group-findings.ts
// Shared grouping logic — single source of truth for FindingsTable.
// No LLM calls. No duplication.

import type { FixType } from './types'

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

/**
 * Minimal finding fields required for grouping.
 * Both the Top5 Finding interface and DbFinding satisfy this structurally.
 */
export interface AuditFinding {
  id: string
  rule_id: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  file_path: string | null
  line?: number | null
  suggestion?: string | null
  status: 'open' | 'acknowledged' | 'fixed' | 'dismissed'
  agent_source?: string | null
  /** Granular rule ID (e.g. lighthouse-performance-critical-request-chains) — used as group key when set */
  agent_rule_id?: string | null
  /** Resolved server-side from the rule registry */
  fix_type?: FixType | null
  consensus_level?: 'unanimous' | 'majority' | 'split' | 'single' | null
  models_flagged?: string[] | null
  avg_confidence?: number | string | null
}

export interface FindingGroup {
  ruleId: string
  baseMessage: string
  agentSource: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  findings: AuditFinding[]
  count: number
  /** Number of unique affected file paths — used as impact tiebreaker */
  uniqueFileCount: number
  /** How this finding should be fixed — resolved from rule registry */
  fixType: FixType
  /** Other rule groups that also target at least one file in this group */
  alsoAffectedByRules?: Array<{ ruleId: string; label: string }>
}

/** Strips the ::agentSource suffix from composite group keys for display / API calls */
export function cleanRuleId(compositeRuleId: string): string {
  return compositeRuleId.split('::')[0]
}

function getRuleShortLabel(ruleId: string): string {
  if (ruleId.includes('cat-1-rule-4') || ruleId.includes('file-size') || ruleId.includes('file-sizes')) return 'Dateigröße'
  if (ruleId.includes('cat-1-rule-10') || ruleId.includes('god-component')) return 'God Component'
  if (ruleId.includes('cat-2-rule-12') || ruleId.includes('cyclomatic') || ruleId.includes('complexity')) return 'CC'
  if (ruleId.includes('cat-25-rule-2') || ruleId.includes('component-length') || ruleId.includes('cat-25')) return 'Länge'
  if (ruleId.includes('cat-9-rule-6') || ruleId.includes('prop-drilling')) return 'Prop Drilling'
  return ruleId.split('::')[0].split('-').slice(-2).join('-') // fallback: last 2 segments
}

function extractBaseMessage(message: string): string {
  const colonIdx = message.lastIndexOf(': src/')
  if (colonIdx > 0) return message.substring(0, colonIdx)
  // Strip `: /absolute/path` suffixes — but NOT measurement expressions like "target: < 400 KB"
  const absPathIdx = message.lastIndexOf(': /')
  if (absPathIdx > 0) return message.substring(0, absPathIdx)
  return message
}

function getHighestSeverity(findings: AuditFinding[]): FindingGroup['severity'] {
  return findings.reduce<FindingGroup['severity']>((best, f) => {
    return SEV_ORDER[f.severity] < SEV_ORDER[best] ? f.severity : best
  }, 'info')
}

/**
 * Groups findings by rule_id and sorts by impact score:
 * 1. Severity (critical first)
 * 2. Unique file count as tiebreaker (more files = higher impact)
 *
 * Every finding belongs to a group — single findings become groups of 1.
 * This guarantees no duplicate rule IDs in the result.
 */
export function groupFindings(findings: AuditFinding[]): FindingGroup[] {
  const map = new Map<string, AuditFinding[]>()
  for (const f of findings) {
    // Use agent_rule_id as the group key when set (e.g. each Lighthouse audit gets its own card).
    // Fall back to rule_id so that multi-file findings still group correctly.
    const agent = f.agent_source ?? 'core'
    const ruleKey = f.agent_rule_id ?? f.rule_id ?? 'unknown'
    const key = `${ruleKey}::${agent}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(f)
  }

  const groups: FindingGroup[] = []
  for (const [compositeKey, items] of map) {
    const ruleId = compositeKey.split('::')[0]
    const uniqueFileCount = new Set(
      items.map((f) => f.file_path).filter(Boolean)
    ).size
    groups.push({
      ruleId: compositeKey,
      baseMessage: extractBaseMessage(items[0].message),
      agentSource: items[0].agent_source ?? 'core',
      severity: getHighestSeverity(items),
      findings: items,
      count: items.length,
      uniqueFileCount,
      fixType: (items[0].fix_type as FixType) ?? 'manual',
    })
  }

  // Build file → group index map for cross-referencing
  const fileToGroupIndices = new Map<string, number[]>()
  for (let i = 0; i < groups.length; i++) {
    for (const f of groups[i].findings) {
      if (!f.file_path) continue
      const existing = fileToGroupIndices.get(f.file_path) ?? []
      existing.push(i)
      fileToGroupIndices.set(f.file_path, existing)
    }
  }
  // Annotate each group with other groups that share files
  for (let i = 0; i < groups.length; i++) {
    const otherGroupIndices = new Set<number>()
    for (const f of groups[i].findings) {
      if (!f.file_path) continue
      for (const idx of fileToGroupIndices.get(f.file_path) ?? []) {
        if (idx !== i) otherGroupIndices.add(idx)
      }
    }
    if (otherGroupIndices.size > 0) {
      groups[i].alsoAffectedByRules = [...otherGroupIndices]
        .map((idx) => ({ ruleId: groups[idx].ruleId, label: getRuleShortLabel(groups[idx].ruleId) }))
        .filter((v, j, arr) => arr.findIndex((x) => x.label === v.label) === j) // dedupe by label
        .slice(0, 4) // max 4 secondary labels
    }
  }

  return groups.sort((a, b) => {
    const sevDiff = SEV_ORDER[a.severity] - SEV_ORDER[b.severity]
    if (sevDiff !== 0) return sevDiff
    const fileDiff = b.uniqueFileCount - a.uniqueFileCount
    if (fileDiff !== 0) return fileDiff
    // Stable tiebreaker: ruleId ensures deterministic order across server/client renders
    return a.ruleId.localeCompare(b.ruleId)
  })
}
