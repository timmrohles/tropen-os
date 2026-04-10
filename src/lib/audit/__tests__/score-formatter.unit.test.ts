import { describe, it, expect } from 'vitest'
import { formatReportMarkdown, formatReportText } from '../scoring/score-formatter'
import type { AuditReport } from '../types'

function makeReport(overrides: Partial<AuditReport> = {}): AuditReport {
  return {
    project: 'test-project',
    date: '2026-04-07',
    rootPath: '/repo',
    categories: [],
    automatedPercentage: 65.5,
    status: 'risky',
    criticalFindings: [],
    automatedRuleCount: 40,
    manualRuleCount: 80,
    ...overrides,
  }
}

describe('formatReportText', () => {
  it('includes project name and score', () => {
    const report = makeReport()
    const text = formatReportText(report)
    expect(text).toContain('test-project')
    expect(text).toContain('65.5%')
    expect(text).toContain('Risky')
  })

  it('includes prior audit delta when provided', () => {
    const report = makeReport({ priorAudit: { date: '2026-03-30', percentage: 59.1, delta: 6.4 } })
    const text = formatReportText(report)
    expect(text).toContain('59.1%')
    expect(text).toContain('+6.4')
  })
})

describe('formatReportMarkdown', () => {
  it('produces valid markdown with headings', () => {
    const report = makeReport()
    const md = formatReportMarkdown(report)
    expect(md).toContain('# Audit Report')
    expect(md).toContain('## ')
    expect(md).toContain('65.5%')
  })
})
