// src/lib/audit/scoring/score-calculator.ts
import type { AuditRule, RuleResult, CategoryScore, AuditReport, Finding } from '../types'

export type AuditStatus = 'production-grade' | 'stable' | 'risky' | 'prototype'

export function getStatus(percentage: number): AuditStatus {
  if (percentage >= 85) return 'production-grade'
  if (percentage >= 70) return 'stable'
  if (percentage >= 50) return 'risky'
  return 'prototype'
}

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

export function calculateOverallScore(categories: CategoryScore[]): Pick<AuditReport, 'automatedPercentage' | 'status' | 'criticalFindings' | 'automatedRuleCount' | 'manualRuleCount'> {
  let totalWeightedScore = 0
  let totalWeightedMax = 0
  let automatedRuleCount = 0
  let manualRuleCount = 0
  const criticalFindings: Finding[] = []

  for (const cat of categories) {
    totalWeightedScore += cat.weightedScore
    totalWeightedMax += cat.weightedMax
    automatedRuleCount += cat.automatedRuleCount
    manualRuleCount += cat.manualRuleCount
    for (const result of cat.ruleResults) {
      criticalFindings.push(...result.findings.filter((f) => f.severity === 'critical'))
    }
  }

  const automatedPercentage = totalWeightedMax > 0
    ? Math.round((totalWeightedScore / totalWeightedMax) * 1000) / 10
    : 0

  return {
    automatedPercentage,
    status: getStatus(automatedPercentage),
    criticalFindings,
    automatedRuleCount,
    manualRuleCount,
  }
}
