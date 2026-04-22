import { describe, it, expect } from 'vitest'
import { groupFindings, cleanRuleId } from '../group-findings'
import type { AuditFinding } from '../group-findings'

function makeFinding(overrides: Partial<AuditFinding> = {}): AuditFinding {
  return {
    id: 'f1',
    rule_id: 'cat-1-rule-1',
    severity: 'medium',
    message: 'Missing validateBody: src/app/api/users/route.ts',
    file_path: 'src/app/api/users/route.ts',
    status: 'open',
    agent_source: 'core',
    fix_type: 'code-fix',
    ...overrides,
  }
}

describe('cleanRuleId', () => {
  it('strips agent source suffix', () => {
    expect(cleanRuleId('cat-1-rule-1::security')).toBe('cat-1-rule-1')
  })

  it('returns rule id unchanged when no suffix', () => {
    expect(cleanRuleId('cat-1-rule-1')).toBe('cat-1-rule-1')
  })
})

describe('groupFindings', () => {
  it('returns empty array for empty input', () => {
    expect(groupFindings([])).toHaveLength(0)
  })

  it('groups findings by rule_id', () => {
    const findings = [
      makeFinding({ id: 'f1', file_path: 'src/a.ts' }),
      makeFinding({ id: 'f2', file_path: 'src/b.ts' }),
    ]
    const groups = groupFindings(findings)
    expect(groups).toHaveLength(1)
    expect(groups[0].count).toBe(2)
  })

  it('creates separate groups for different rule_ids', () => {
    const findings = [
      makeFinding({ id: 'f1', rule_id: 'cat-1-rule-1' }),
      makeFinding({ id: 'f2', rule_id: 'cat-2-rule-1' }),
    ]
    const groups = groupFindings(findings)
    expect(groups).toHaveLength(2)
  })

  it('creates separate groups for same rule_id but different agent_source', () => {
    const findings = [
      makeFinding({ id: 'f1', agent_source: 'core' }),
      makeFinding({ id: 'f2', agent_source: 'security' }),
    ]
    const groups = groupFindings(findings)
    expect(groups).toHaveLength(2)
  })

  it('sorts by severity: critical before high before medium', () => {
    const findings = [
      makeFinding({ id: 'f1', rule_id: 'cat-1-rule-1', severity: 'medium' }),
      makeFinding({ id: 'f2', rule_id: 'cat-2-rule-1', severity: 'critical' }),
      makeFinding({ id: 'f3', rule_id: 'cat-3-rule-1', severity: 'high' }),
    ]
    const groups = groupFindings(findings)
    expect(groups[0].severity).toBe('critical')
    expect(groups[1].severity).toBe('high')
    expect(groups[2].severity).toBe('medium')
  })

  it('uses highest severity in group when mixed', () => {
    const findings = [
      makeFinding({ id: 'f1', severity: 'medium', file_path: 'a.ts' }),
      makeFinding({ id: 'f2', severity: 'critical', file_path: 'b.ts' }),
    ]
    const groups = groupFindings(findings)
    expect(groups[0].severity).toBe('critical')
  })

  it('counts unique file paths', () => {
    const findings = [
      makeFinding({ id: 'f1', file_path: 'src/a.ts' }),
      makeFinding({ id: 'f2', file_path: 'src/a.ts' }),
      makeFinding({ id: 'f3', file_path: 'src/b.ts' }),
    ]
    const groups = groupFindings(findings)
    expect(groups[0].uniqueFileCount).toBe(2)
  })

  it('uses uniqueFileCount as tiebreaker within same severity', () => {
    const findings = [
      makeFinding({ id: 'f1', rule_id: 'cat-1-rule-1', severity: 'high', file_path: 'a.ts' }),
      makeFinding({ id: 'f2', rule_id: 'cat-2-rule-1', severity: 'high', file_path: 'b.ts' }),
      makeFinding({ id: 'f3', rule_id: 'cat-2-rule-1', severity: 'high', file_path: 'c.ts' }),
    ]
    const groups = groupFindings(findings)
    expect(groups[0].ruleId).toContain('cat-2-rule-1')
  })

  it('includes composite ruleId with agent source', () => {
    const findings = [makeFinding({ agent_source: 'security' })]
    const groups = groupFindings(findings)
    expect(groups[0].ruleId).toBe('cat-1-rule-1::security')
  })

  it('uses manual as default fixType when null', () => {
    const findings = [makeFinding({ fix_type: null })]
    const groups = groupFindings(findings)
    expect(groups[0].fixType).toBe('manual')
  })

  it('handles null file_path gracefully', () => {
    const findings = [makeFinding({ file_path: null })]
    const groups = groupFindings(findings)
    expect(groups[0].uniqueFileCount).toBe(0)
  })
})
