import { describe, it, expect } from 'vitest'
import { calculateCategoryScore, calculateOverallScore, getStatus } from '../scoring/score-calculator'
import type { AuditRule, RuleResult } from '../types'

function rule(id: string, weight: 1 | 2 | 3): AuditRule {
  return { id, categoryId: 1, name: id, weight, checkMode: 'file-system', automatable: true }
}

function result(ruleId: string, score: number | null): RuleResult {
  return { ruleId, score, reason: 'test', findings: [], automated: score !== null }
}

describe('calculateCategoryScore', () => {
  it('calculates score correctly for automated rules', () => {
    const rules = [rule('r1', 3), rule('r2', 2)]
    const results = [result('r1', 5), result('r2', 4)]
    const cat = calculateCategoryScore(1, 'Architektur', 2, rules, results)
    // weightedScore = 5×3 + 4×2 = 23; weightedMax = 5×3 + 5×2 = 25
    expect(cat.weightedScore).toBe(23)
    expect(cat.weightedMax).toBe(25)
    expect(cat.automatedPercentage).toBeCloseTo(92, 0)
    expect(cat.automatedRuleCount).toBe(2)
    expect(cat.manualRuleCount).toBe(0)
  })

  it('excludes null scores from denominator', () => {
    const rules = [rule('r1', 3), rule('r2', 2)]
    const results = [result('r1', 5), result('r2', null)]
    const cat = calculateCategoryScore(1, 'Architektur', 2, rules, results)
    // weightedScore = 5×3 = 15; weightedMax = 5×3 = 15 (r2 excluded)
    expect(cat.weightedScore).toBe(15)
    expect(cat.weightedMax).toBe(15)
    expect(cat.automatedPercentage).toBe(100)
    expect(cat.automatedRuleCount).toBe(1)
    expect(cat.manualRuleCount).toBe(1)
  })

  it('returns null percentage when all rules are manual', () => {
    const rules = [rule('r1', 3)]
    const results = [result('r1', null)]
    const cat = calculateCategoryScore(1, 'Architektur', 2, rules, results)
    expect(cat.automatedPercentage).toBeNull()
    expect(cat.weightedScore).toBe(0)
    expect(cat.weightedMax).toBe(0)
  })
})

describe('calculateOverallScore', () => {
  it('aggregates across categories correctly', () => {
    const cats = [
      { weightedScore: 15, weightedMax: 15, automatedPercentage: 100, categoryId: 1, name: 'A', weight: 2 as const, ruleResults: [], automatedRuleCount: 1, manualRuleCount: 0 },
      { weightedScore: 10, weightedMax: 25, automatedPercentage: 40, categoryId: 2, name: 'B', weight: 1 as const, ruleResults: [], automatedRuleCount: 2, manualRuleCount: 0 },
    ]
    const result = calculateOverallScore(cats)
    // total weightedScore = 15 + 10 = 25; total weightedMax = 15 + 25 = 40
    expect(result.automatedPercentage).toBeCloseTo(62.5, 1)
  })

  it('returns 0% when all max is 0', () => {
    const cats = [
      { weightedScore: 0, weightedMax: 0, automatedPercentage: null, categoryId: 1, name: 'A', weight: 1 as const, ruleResults: [], automatedRuleCount: 0, manualRuleCount: 1 },
    ]
    const result = calculateOverallScore(cats)
    expect(result.automatedPercentage).toBe(0)
  })
})

describe('getStatus', () => {
  it('returns production-grade for >= 85', () => expect(getStatus(85)).toBe('production-grade'))
  it('returns production-grade for 100', () => expect(getStatus(100)).toBe('production-grade'))
  it('returns stable for 70-84', () => expect(getStatus(75)).toBe('stable'))
  it('returns risky for 50-69', () => expect(getStatus(60)).toBe('risky'))
  it('returns prototype for < 50', () => expect(getStatus(49)).toBe('prototype'))
  it('returns prototype for 0', () => expect(getStatus(0)).toBe('prototype'))
})
