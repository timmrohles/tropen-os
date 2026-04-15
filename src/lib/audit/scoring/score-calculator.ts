// src/lib/audit/scoring/score-calculator.ts
import type { AuditRule, RuleResult, CategoryScore, AuditReport, Finding } from '../types'

export type AuditStatus = 'production-grade' | 'stable' | 'risky' | 'prototype'

// ─── Killer Criteria ──────────────────────────────────────────────────────────
// If any of these categories falls below its threshold, the status is capped at "risky"
// regardless of the overall score. Thresholds in automatedPercentage (0–100).
// minPct = minScore/5 * 100:  3.0/5 = 60%, 2.5/5 = 50%, 2.0/5 = 40%
const KILLER_CRITERIA: Record<number, { name: string; minPct: number }> = {
  3:  { name: 'Sicherheit',              minPct: 60 }, // Security < 3.0/5
  10: { name: 'Testing',                 minPct: 50 }, // Testing < 2.5/5
  13: { name: 'Backup & Disaster Recovery', minPct: 40 }, // Backup/DR < 2.0/5
}

// ─── Not-Applicable Categories ───────────────────────────────────────────────
// These categories are excluded from numerator AND denominator.
// Cat 17 = Internationalisierung, Cat 21 = PWA & Resilience
// (not applicable for Tropen OS — B2B SaaS, DE-only, no offline requirement)
export const NOT_APPLICABLE_CATEGORY_IDS: ReadonlySet<number> = new Set([17, 21])

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getStatus(percentage: number): AuditStatus {
  if (percentage >= 90) return 'production-grade'
  if (percentage >= 80) return 'stable'
  if (percentage >= 60) return 'risky'
  return 'prototype'
}

function statusRank(s: AuditStatus): number {
  return s === 'production-grade' ? 3 : s === 'stable' ? 2 : s === 'risky' ? 1 : 0
}

// ─── Category Score ───────────────────────────────────────────────────────────

export function calculateCategoryScore(
  categoryId: number,
  name: string,
  weight: 1 | 2 | 3,
  rules: AuditRule[],
  results: RuleResult[],
): CategoryScore {
  const resultMap = new Map(results.map((r) => [r.ruleId, r]))

  let weightedScore = 0
  let weightedMax = 0
  let automatedRuleCount = 0
  let manualRuleCount = 0
  const ruleResults: RuleResult[] = []

  for (const rule of rules) {
    const result = resultMap.get(rule.id)
    if (!result) continue
    ruleResults.push(result)
    if (result.score === null) {
      manualRuleCount++
    } else {
      automatedRuleCount++
      weightedScore += result.score * rule.weight
      weightedMax += 5 * rule.weight
    }
  }

  const automatedPercentage = weightedMax > 0
    ? Math.round((weightedScore / weightedMax) * 1000) / 10
    : null

  return { categoryId, name, weight, ruleResults, weightedScore, weightedMax, automatedPercentage, automatedRuleCount, manualRuleCount }
}

// ─── Complexity Factor ──────────────────────────────────────────────────────
// Small projects (< 50 files) get a score penalty because they have fewer
// opportunities to fail checks — their high scores are structural, not earned.
// log10(10)=1, log10(50)=1.7, log10(100)=2, log10(500)=2.7
// Normalized so 100 files = factor 1.0:
//   10 files → 0.5, 50 files → 0.85, 100 files → 1.0, 500 files → 1.35

function getComplexityFactor(fileCount: number): number {
  const clamped = Math.max(10, fileCount)
  return Math.log10(clamped) / Math.log10(100)
}

// ─── Overall Score ────────────────────────────────────────────────────────────

export function calculateOverallScore(
  categories: CategoryScore[],
  options?: { fileCount?: number },
): Pick<AuditReport, 'automatedPercentage' | 'status' | 'criticalFindings' | 'automatedRuleCount' | 'manualRuleCount'> {
  let totalWeightedScore = 0
  let totalWeightedMax = 0
  let automatedRuleCount = 0
  let manualRuleCount = 0
  const criticalFindings: Finding[] = []

  for (const cat of categories) {
    // Skip not-applicable categories from both numerator and denominator
    if (NOT_APPLICABLE_CATEGORY_IDS.has(cat.categoryId)) continue

    totalWeightedScore += cat.weightedScore
    totalWeightedMax += cat.weightedMax
    automatedRuleCount += cat.automatedRuleCount
    manualRuleCount += cat.manualRuleCount
    for (const result of cat.ruleResults) {
      criticalFindings.push(...result.findings.filter((f) => f.severity === 'critical'))
    }
  }

  let automatedPercentage = totalWeightedMax > 0
    ? (totalWeightedScore / totalWeightedMax) * 100
    : 0

  // Apply complexity factor: small projects get a penalty
  if (options?.fileCount != null) {
    const factor = getComplexityFactor(options.fileCount)
    if (factor < 1.0) {
      // Scale the score down for small projects (factor < 1.0)
      automatedPercentage = automatedPercentage * factor
    }
  }

  automatedPercentage = Math.round(automatedPercentage * 10) / 10

  // Base status from score
  let status: AuditStatus = getStatus(automatedPercentage)

  // Apply killer-criteria veto: cap status at "risky" if a critical category is too weak
  for (const cat of categories) {
    const crit = KILLER_CRITERIA[cat.categoryId]
    if (!crit) continue
    const pct = cat.automatedPercentage ?? 0
    if (pct < crit.minPct && statusRank(status) > statusRank('risky')) {
      status = 'risky'
    }
  }

  return {
    automatedPercentage,
    status,
    criticalFindings,
    automatedRuleCount,
    manualRuleCount,
  }
}
