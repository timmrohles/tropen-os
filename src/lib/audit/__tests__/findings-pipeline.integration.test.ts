// Integration test: findings grouping + audit score calculation flow
import { describe, it, expect } from 'vitest'
import { groupFindings, cleanRuleId } from '../group-findings'
import type { AuditFinding } from '../group-findings'
import { buildAuditContextFromFiles, runAudit } from '../index'

function makeFinding(overrides: Partial<AuditFinding> = {}): AuditFinding {
  return {
    id: `finding-${Math.random().toString(36).slice(2)}`,
    rule_id: 'cat-1-rule-4',
    severity: 'high',
    message: 'File size violation: src/lib/big.ts has 550 lines',
    file_path: 'src/lib/big.ts',
    status: 'open',
    ...overrides,
  }
}

describe('Integration: findings grouping pipeline', () => {
  it('groups multiple findings by rule_id', () => {
    const findings = [
      makeFinding({ file_path: 'src/a.ts' }),
      makeFinding({ file_path: 'src/b.ts' }),
      makeFinding({ rule_id: 'cat-2-rule-12', message: 'CC violation', file_path: 'src/c.ts', severity: 'medium' }),
    ]
    const groups = groupFindings(findings)
    expect(groups).toHaveLength(2)
    const largeFileGroup = groups.find((g) => cleanRuleId(g.ruleId) === 'cat-1-rule-4')
    expect(largeFileGroup?.count).toBe(2)
    expect(largeFileGroup?.uniqueFileCount).toBe(2)
  })

  it('orders groups by severity descending', () => {
    const findings = [
      makeFinding({ rule_id: 'cat-9-rule-6', severity: 'info', message: 'prop drilling' }),
      makeFinding({ rule_id: 'cat-3-rule-1', severity: 'critical', message: 'security issue' }),
      makeFinding({ rule_id: 'cat-1-rule-4', severity: 'high', message: 'file size' }),
    ]
    const groups = groupFindings(findings)
    expect(groups[0].severity).toBe('critical')
    expect(groups[1].severity).toBe('high')
    expect(groups[2].severity).toBe('info')
  })

  it('excludes dismissed findings from open group', () => {
    const findings = [
      makeFinding({ status: 'open' }),
      makeFinding({ status: 'dismissed', file_path: 'src/ignored.ts' }),
    ]
    const open = groupFindings(findings.filter((f) => f.status === 'open'))
    expect(open[0].count).toBe(1)
    expect(open[0].findings.every((f) => f.status === 'open')).toBe(true)
  })

  it('cleanRuleId strips composite suffix', () => {
    expect(cleanRuleId('cat-1-rule-4::architecture')).toBe('cat-1-rule-4')
    expect(cleanRuleId('cat-2-rule-12')).toBe('cat-2-rule-12')
  })

  it('audit produces findings with expected structure', async () => {
    const bigFile = Array.from({ length: 520 }, (_, i) => `export const x${i} = ${i}`).join('\n')
    const ctx = await buildAuditContextFromFiles([
      { path: 'package.json', content: JSON.stringify({ name: 'test', dependencies: { next: '^15' } }) },
      { path: 'tsconfig.json', content: JSON.stringify({ compilerOptions: { strict: true } }) },
      { path: 'src/lib/large.ts', content: bigFile },
    ])
    const report = await runAudit(ctx, { rootPath: '' })

    // All ruleResults must have a ruleId
    const allResults = report.categories.flatMap((c) => c.ruleResults)
    for (const result of allResults) {
      expect(typeof result.ruleId).toBe('string')
      expect(result.ruleId).toMatch(/^cat-\d+-rule-\d+/)
    }

    // All findings must have required fields
    for (const result of allResults) {
      for (const finding of result.findings ?? []) {
        expect(finding.severity).toMatch(/^(critical|high|medium|low|info)$/)
        expect(typeof finding.message).toBe('string')
      }
    }
  })
})
