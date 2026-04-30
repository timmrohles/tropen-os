// src/lib/audit/quick-wins.ts
// Computes the top quick-win findings sorted by impact-to-effort ratio.

import type { FixType, AuditDomain } from './types'
import { getDomainForRule } from './domain-filter'

export interface QuickWinFinding {
  id: string
  ruleId: string
  severity: string
  message: string
  suggestion: string | null
  filePath: string | null
  line: number | null
  categoryId: number
  fixType: FixType
  estimatedScoreGain: number
}

export interface QuickWinsResult {
  quickWins: QuickWinFinding[]
  groups: {
    today: QuickWinFinding[]
    thisWeek: QuickWinFinding[]
    someday: QuickWinFinding[]
  }
  counts: { today: number; thisWeek: number; someday: number }
}

export interface GlobalQuickWinFinding {
  id: string
  ruleId: string
  severity: string
  message: string
  title: string           // aus _recTitle oder message als Fallback
  suggestion: string | null
  filePath: string | null
  line: number | null
  categoryId: number
  fixType: FixType
  domain: AuditDomain
  estimatedScoreGain: number
  effortMinutes: number
}

interface RawFinding {
  id: string
  rule_id: string
  category_id: number
  severity: string
  message: string
  suggestion: string | null
  file_path: string | null
  line: number | null
  status: string
  /** Pre-computed server-side from rule registry */
  fix_type?: FixType | null
}

interface RawGlobalFinding {
  id: string
  rule_id: string
  category_id: number
  severity: string
  message: string
  suggestion: string | null
  file_path: string | null
  line: number | null
  status: string
  fix_type?: FixType | null
  _recTitle?: string
}

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
}

// Quick-Win-Trio: cat-2 (Code-Qualität/Error Handling), cat-12 (Observability), cat-19 (Git Governance)
// These three have the highest fix-rate and Aha-Moment potential — boost their score.
const QUICK_WIN_TRIO_CATEGORIES = new Set([2, 12, 19])

/**
 * Scores a finding by how quickly it can be fixed relative to its impact.
 * Higher = better quick-win candidate.
 */
function quickWinScore(f: { severity: string; suggestion: string | null; fixType: FixType; categoryId?: number }): number {
  const sev = SEVERITY_WEIGHT[f.severity] ?? 0
  const hasSuggestion = f.suggestion ? 2 : 0
  const typeBonus =
    f.fixType === 'code-gen' ? 3 :
    f.fixType === 'code-fix' ? 2 :
    f.fixType === 'refactoring' ? -1 : -2
  // Prefer findings from the Quick-Win-Trio categories (Error Handling, Observability, Git Governance)
  const trioBonus = (f.categoryId !== undefined && QUICK_WIN_TRIO_CATEGORIES.has(f.categoryId)) ? 2 : 0
  return sev + hasSuggestion + typeBonus + trioBonus
}

function estimateScoreGain(severity: string): number {
  return SEVERITY_WEIGHT[severity] ?? 1
}

function effortMinutesForFixType(fixType: FixType): number {
  switch (fixType) {
    case 'code-gen':    return 10
    case 'code-fix':    return 15
    case 'refactoring': return 45
    case 'manual':      return 60
    default:            return 60
  }
}

function toQuickWin(f: RawFinding, fixType: FixType): QuickWinFinding {
  return {
    id: f.id,
    ruleId: f.rule_id,
    severity: f.severity,
    message: f.message,
    suggestion: f.suggestion,
    filePath: f.file_path,
    line: f.line,
    categoryId: f.category_id,
    fixType,
    estimatedScoreGain: estimateScoreGain(f.severity),
  }
}

function toGlobalQuickWin(
  f: RawGlobalFinding,
  fixType: FixType,
  domain: AuditDomain,
): GlobalQuickWinFinding {
  return {
    id: f.id,
    ruleId: f.rule_id,
    severity: f.severity,
    message: f.message,
    title: f._recTitle ?? f.message,
    suggestion: f.suggestion,
    filePath: f.file_path,
    line: f.line,
    categoryId: f.category_id,
    fixType,
    domain,
    estimatedScoreGain: estimateScoreGain(f.severity),
    effortMinutes: effortMinutesForFixType(fixType),
  }
}

/**
 * Computes the top 5 quick-win findings (max 1 per category) from open findings,
 * then groups all open findings into today / thisWeek / someday buckets.
 */
export function computeQuickWins(findings: RawFinding[]): QuickWinsResult {
  const open = findings.filter((f) => f.status === 'open')

  // Use pre-computed fix_type from server (no rule-registry import — avoids Node.js in client)
  const enriched = open.map((f) => {
    const fixType: FixType = (f.fix_type as FixType) ?? 'manual'
    return { raw: f, fixType, score: quickWinScore({ severity: f.severity, suggestion: f.suggestion, fixType, categoryId: f.category_id }) }
  })

  // Sort by quick-win score DESC
  enriched.sort((a, b) => b.score - a.score)

  // Top 5, max 1 per category
  const seenCategories = new Set<number>()
  const quickWins: QuickWinFinding[] = []
  for (const item of enriched) {
    if (quickWins.length >= 5) break
    if (seenCategories.has(item.raw.category_id)) continue
    seenCategories.add(item.raw.category_id)
    quickWins.push(toQuickWin(item.raw, item.fixType))
  }

  // Group ALL open findings
  const allQuickWins = enriched.map((item) => toQuickWin(item.raw, item.fixType))

  const today: QuickWinFinding[] = []
  const thisWeek: QuickWinFinding[] = []
  const someday: QuickWinFinding[] = []

  for (const qw of allQuickWins) {
    const isHighSeverity = qw.severity === 'critical' || qw.severity === 'high'
    const isQuickFix = qw.fixType === 'code-gen' || qw.fixType === 'code-fix'

    if (isHighSeverity && isQuickFix) {
      today.push(qw)
    } else if (qw.severity === 'medium' || qw.fixType === 'refactoring') {
      thisWeek.push(qw)
    } else {
      someday.push(qw)
    }
  }

  return {
    quickWins,
    groups: { today, thisWeek, someday },
    counts: { today: today.length, thisWeek: thisWeek.length, someday: someday.length },
  }
}

/**
 * A cluster of quick-win findings that share a file (or have no file).
 * Findings within a cluster should be fixed together in one editor session.
 */
export interface QuickWinCluster {
  filePath: string | null
  findings: GlobalQuickWinFinding[]
  totalScoreGain: number
}

/**
 * Clusters open findings by file, selecting the most valuable files first.
 *
 * Algorithm:
 * 1. Score all open findings by quickWinScore
 * 2. Dedup globally by ruleId (same rule in 10 files → only appears in best file)
 * 3. Group deduplicated findings by filePath
 * 4. Score each file-group by sum of its findings' scores
 * 5. Return top maxFiles groups, each with top maxPerFile findings
 */
export function getGlobalQuickWinClusters(
  allFindings: Array<Record<string, unknown>>,
  maxFiles = 4,
  maxPerFile = 2,
): QuickWinCluster[] {
  const open = allFindings.filter((f) => f.status === 'open') as unknown as RawGlobalFinding[]

  const enriched = open.map((f) => {
    const fixType: FixType = f.fix_type ?? 'manual'
    const domain = getDomainForRule(f.rule_id)
    return {
      raw: f,
      fixType,
      domain,
      score: quickWinScore({ severity: f.severity, suggestion: f.suggestion, fixType, categoryId: f.category_id }),
    }
  })

  enriched.sort((a, b) => b.score - a.score)

  // Global ruleId dedup — each pattern appears only in its highest-scoring file
  const seenRuleIds = new Set<string>()
  const deduplicated = enriched.filter((item) => {
    if (seenRuleIds.has(item.raw.rule_id)) return false
    seenRuleIds.add(item.raw.rule_id)
    return true
  })

  // Group by filePath
  const byFile = new Map<string, typeof deduplicated>()
  for (const item of deduplicated) {
    const key = item.raw.file_path ?? '__no_file__'
    if (!byFile.has(key)) byFile.set(key, [])
    byFile.get(key)!.push(item)
  }

  // Score each file-group, sort DESC, take top maxFiles
  const sortedFiles = [...byFile.entries()]
    .map(([key, items]) => ({
      key,
      items,
      groupScore: items.slice(0, maxPerFile).reduce((s, i) => s + i.score, 0),
    }))
    .sort((a, b) => b.groupScore - a.groupScore)

  // no-file group always last
  const namedFiles = sortedFiles.filter(g => g.key !== '__no_file__').slice(0, maxFiles)
  const noFileGroup = sortedFiles.find(g => g.key === '__no_file__')

  const result: QuickWinCluster[] = []
  for (const group of [...namedFiles, ...(noFileGroup ? [noFileGroup] : [])]) {
    const topFindings = group.items.slice(0, maxPerFile)
    result.push({
      filePath: group.key === '__no_file__' ? null : group.key,
      findings: topFindings.map(i => toGlobalQuickWin(i.raw, i.fixType, i.domain)),
      totalScoreGain: topFindings.reduce((s, i) => s + estimateScoreGain(i.raw.severity), 0),
    })
  }

  return result
}

/** @deprecated use getGlobalQuickWinClusters */
export function getGlobalQuickWins(
  allFindings: Array<Record<string, unknown>>,
  limit = 5,
): GlobalQuickWinFinding[] {
  return getGlobalQuickWinClusters(allFindings, limit, 1).map(c => c.findings[0]).filter(Boolean)
}
