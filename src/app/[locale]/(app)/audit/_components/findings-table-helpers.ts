// findings-table-helpers.ts — Pure filter utilities for FindingsTable
// No 'use client' — pure module (no React, no browser APIs)

import type { AgentSource, FixType } from '@/lib/audit/types'

export type FixTypeFilter  = 'all' | FixType
export type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low' | 'info'
export type StatusFilter   = 'all' | 'open' | 'acknowledged' | 'fixed' | 'dismissed'
export type AgentFilter    = 'all' | AgentSource

export interface DbFinding {
  id: string
  rule_id: string
  category_id: number
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  file_path: string | null
  line: number | null
  suggestion: string | null
  status: 'open' | 'acknowledged' | 'fixed' | 'dismissed'
  resolved_at: string | null
  agent_source?: AgentSource | null
  agent_rule_id?: string | null
  enforcement?: string | null
  consensus_level?: 'unanimous' | 'majority' | 'split' | 'single' | null
  models_flagged?: string[] | null
  affected_files?: string[] | null
  fix_hint?: string | null
  fix_type?: FixType | null
}

// ── Filter parse helpers ──────────────────────────────────────────────────────

const VALID_FIX_TYPES: FixTypeFilter[] = ['all', 'code-fix', 'code-gen', 'refactoring', 'manual']
const VALID_SEVERITIES: SeverityFilter[] = ['all', 'critical', 'high', 'medium', 'low', 'info']
const VALID_STATUSES: StatusFilter[] = ['all', 'open', 'acknowledged', 'fixed', 'dismissed']

export function parseFixTypeFilter(raw: string): FixTypeFilter {
  if (VALID_FIX_TYPES.includes(raw as FixTypeFilter)) return raw as FixTypeFilter
  return 'all'
}

export function parseSeverityFilter(raw: string): SeverityFilter {
  if (VALID_SEVERITIES.includes(raw as SeverityFilter)) return raw as SeverityFilter
  return 'all'
}

export function parseStatusFilter(raw: string): StatusFilter {
  if (VALID_STATUSES.includes(raw as StatusFilter)) return raw as StatusFilter
  return 'open'
}

/** Apply severity / status / agent filters (not fixType — that's a second pass). */
export function applyBaseFilters(
  findings: DbFinding[],
  severityFilter: SeverityFilter,
  statusFilter: StatusFilter,
  agentFilter: AgentFilter,
): DbFinding[] {
  return findings.filter((f) => {
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false
    if (statusFilter === 'open' && f.status !== 'open' && f.status !== 'acknowledged') return false
    if (statusFilter === 'fixed' && f.status !== 'fixed') return false
    if (statusFilter === 'dismissed' && f.status !== 'dismissed') return false
    if (agentFilter !== 'all' && (f.agent_source ?? 'core') !== agentFilter) return false
    return true
  })
}

export const SEVERITY_COUNTS = (findings: DbFinding[], sev: string): number =>
  findings.filter((f) => f.severity === sev).length
