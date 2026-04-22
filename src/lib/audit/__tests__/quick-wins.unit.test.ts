import { describe, it, expect } from 'vitest'
import { computeQuickWins } from '../quick-wins'
import type { FixType } from '../types'

function makeFinding(overrides: Partial<{
  id: string
  rule_id: string
  category_id: number
  severity: string
  message: string
  suggestion: string | null
  file_path: string | null
  line: number | null
  status: string
  fix_type: FixType | null
}> = {}) {
  return {
    id: 'f1',
    rule_id: 'cat-1-rule-1',
    category_id: 1,
    severity: 'medium',
    message: 'Some finding',
    suggestion: 'Fix it',
    file_path: 'src/lib/foo.ts',
    line: null,
    status: 'open',
    fix_type: 'code-fix' as FixType,
    ...overrides,
  }
}

describe('computeQuickWins', () => {
  it('returns empty result for empty findings', () => {
    const result = computeQuickWins([])
    expect(result.quickWins).toHaveLength(0)
    expect(result.counts).toEqual({ today: 0, thisWeek: 0, someday: 0 })
  })

  it('ignores non-open findings', () => {
    const findings = [
      makeFinding({ status: 'fixed' }),
      makeFinding({ status: 'dismissed' }),
    ]
    const result = computeQuickWins(findings)
    expect(result.quickWins).toHaveLength(0)
  })

  it('returns max 5 quick wins', () => {
    const findings = Array.from({ length: 10 }, (_, i) =>
      makeFinding({ id: `f${i}`, rule_id: `cat-${i}-rule-1`, category_id: i })
    )
    const result = computeQuickWins(findings)
    expect(result.quickWins.length).toBeLessThanOrEqual(5)
  })

  it('returns max 1 per category in quickWins', () => {
    const findings = [
      makeFinding({ id: 'f1', category_id: 3, severity: 'critical' }),
      makeFinding({ id: 'f2', category_id: 3, severity: 'high' }),
      makeFinding({ id: 'f3', category_id: 4, severity: 'medium' }),
    ]
    const result = computeQuickWins(findings)
    const catIds = result.quickWins.map((w) => w.categoryId)
    expect(new Set(catIds).size).toBe(catIds.length)
  })

  it('puts high-severity code-fix findings in today', () => {
    const findings = [
      makeFinding({ id: 'f1', severity: 'critical', fix_type: 'code-fix' }),
      makeFinding({ id: 'f2', category_id: 2, severity: 'high', fix_type: 'code-gen' }),
    ]
    const result = computeQuickWins(findings)
    expect(result.groups.today).toHaveLength(2)
    expect(result.counts.today).toBe(2)
  })

  it('puts medium-severity findings in thisWeek', () => {
    const findings = [makeFinding({ severity: 'medium', fix_type: 'manual' })]
    const result = computeQuickWins(findings)
    expect(result.groups.thisWeek).toHaveLength(1)
  })

  it('puts low-severity manual findings in someday', () => {
    const findings = [makeFinding({ severity: 'low', fix_type: 'manual', suggestion: null })]
    const result = computeQuickWins(findings)
    expect(result.groups.someday).toHaveLength(1)
  })

  it('boosts quick-win trio categories (2, 12, 19)', () => {
    const findings = [
      makeFinding({ id: 'f1', category_id: 99, severity: 'medium', fix_type: 'code-fix', rule_id: 'cat-99-rule-1' }),
      makeFinding({ id: 'f2', category_id: 12, severity: 'medium', fix_type: 'code-fix', rule_id: 'cat-12-rule-1' }),
    ]
    const result = computeQuickWins(findings)
    // Category 12 should rank higher due to trio bonus
    expect(result.quickWins[0].categoryId).toBe(12)
  })

  it('uses pre-computed fix_type from server', () => {
    const findings = [makeFinding({ fix_type: 'code-gen' })]
    const result = computeQuickWins(findings)
    expect(result.quickWins[0].fixType).toBe('code-gen')
  })

  it('defaults fix_type to manual when not provided', () => {
    const findings = [makeFinding({ fix_type: null })]
    const result = computeQuickWins(findings)
    expect(result.quickWins[0].fixType).toBe('manual')
  })

  it('estimatedScoreGain reflects severity weight', () => {
    const findings = [
      makeFinding({ id: 'f1', category_id: 1, severity: 'critical' }),
      makeFinding({ id: 'f2', category_id: 2, severity: 'info', rule_id: 'cat-2-rule-1' }),
    ]
    const result = computeQuickWins(findings)
    const critical = result.quickWins.find((w) => w.severity === 'critical')
    const info = result.quickWins.find((w) => w.severity === 'info')
    expect(critical!.estimatedScoreGain).toBeGreaterThan(info!.estimatedScoreGain)
  })
})
