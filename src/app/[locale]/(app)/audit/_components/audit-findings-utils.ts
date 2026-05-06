// audit-findings-utils.ts — Pure utilities + shared types for AuditFindingsClient
// No 'use client' — this is a pure module (no React, no browser APIs)

import type { AuditDomain } from '@/lib/audit/types'
import { effortLevel } from '@/lib/audit/killer-rule-ids'

// ── Shared types ───────────────────────────────────────────────────────────────

export interface EnrichedFinding {
  id: string
  rule_id: string
  severity: string
  message: string
  file_path: string | null
  suggestion: string | null
  status: string
  is_killer: boolean
  effort_minutes: number
  domain: AuditDomain
  fix_type: string | null
  _recTitle?: string
  _limitation?: string
  [key: string]: unknown
}

export interface FindingCluster {
  ruleId: string
  title: string
  findings: EnrichedFinding[]
  effortLevel: ReturnType<typeof effortLevel>
  severity: string
  totalScoreGain: number
}

// ── Domain labels ──────────────────────────────────────────────────────────────

export const DOMAIN_LABELS: Record<AuditDomain, string> = {
  'code-quality':  'Code-Qualität',
  'performance':   'Performance',
  'security':      'Sicherheit',
  'accessibility': 'Barrierefrei.',
  'dsgvo':         'DSGVO',
  'ki-act':        'KI-Act',
  'documentation': 'Doku',
  'oss':           'OSS-Lizenzen',
  'marketing':     'Tracking',
  'platform':      'App Store',
  'infrastructure':'Infrastruktur',
}

export const DOMAIN_ORDER: AuditDomain[] = [
  'security', 'dsgvo', 'code-quality', 'accessibility', 'ki-act', 'performance', 'documentation',
  // Sprint 9b — neue Domänen
  'oss', 'marketing', 'platform', 'infrastructure',
]

export const SEV_ORDER: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1, info: 0,
}

export const SEV_DOT: Record<string, string> = {
  critical: 'severity-dot--critical',
  high:     'severity-dot--high',
  medium:   'severity-dot--medium',
  low:      'severity-dot--low',
  info:     'severity-dot--info',
}

// ── Utility functions ──────────────────────────────────────────────────────────

export function bySev(a: EnrichedFinding, b: EnrichedFinding) {
  return (SEV_ORDER[b.severity] ?? 0) - (SEV_ORDER[a.severity] ?? 0)
}

export function clusterFindings(findings: EnrichedFinding[]): FindingCluster[] {
  const groups = new Map<string, EnrichedFinding[]>()
  for (const f of findings) {
    const key = f.rule_id
    groups.set(key, [...(groups.get(key) ?? []), f])
  }
  return Array.from(groups.values())
    .map(fs => ({
      ruleId: fs[0].rule_id,
      title: (fs[0]._recTitle ?? fs[0].message) as string,
      findings: fs,
      effortLevel: effortLevel(fs[0].effort_minutes),
      severity: fs[0].severity,
      totalScoreGain: fs.reduce((s, f) => s + (SEV_ORDER[f.severity] ?? 1), 0),
    }))
    .sort((a, b) => {
      // Quick Wins zuerst, dann nach Anzahl Dateien
      const effortOrder = { quick: 0, medium: 1, long: 2 }
      const ea = effortOrder[a.effortLevel]
      const eb = effortOrder[b.effortLevel]
      if (ea !== eb) return ea - eb
      return b.findings.length - a.findings.length
    })
}
