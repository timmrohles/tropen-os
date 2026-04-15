// src/lib/audit/quick-wins.ts
// Computes the top quick-win findings sorted by impact-to-effort ratio.

import type { FixType } from './types'

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

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
}

/**
 * Scores a finding by how quickly it can be fixed relative to its impact.
 * Higher = better quick-win candidate.
 */
function quickWinScore(f: { severity: string; suggestion: string | null; fixType: FixType }): number {
  const sev = SEVERITY_WEIGHT[f.severity] ?? 0
  const hasSuggestion = f.suggestion ? 2 : 0
  const typeBonus =
    f.fixType === 'code-gen' ? 3 :
    f.fixType === 'code-fix' ? 2 :
    f.fixType === 'refactoring' ? -1 : -2
  return sev + hasSuggestion + typeBonus
}

function estimateScoreGain(severity: string): number {
  return SEVERITY_WEIGHT[severity] ?? 1
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

/**
 * Computes the top 5 quick-win findings (max 1 per category) from open findings,
 * then groups all open findings into today / thisWeek / someday buckets.
 */
export function computeQuickWins(findings: RawFinding[]): QuickWinsResult {
  const open = findings.filter((f) => f.status === 'open')

  // Use pre-computed fix_type from server (no rule-registry import — avoids Node.js in client)
  const enriched = open.map((f) => {
    const fixType: FixType = (f.fix_type as FixType) ?? 'manual'
    return { raw: f, fixType, score: quickWinScore({ severity: f.severity, suggestion: f.suggestion, fixType }) }
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
