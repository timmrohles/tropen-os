import { describe, it, expect } from 'vitest'
import { filterBySource, groupBySection, EXCLUDED_SOURCES } from '../consolidate'
import type { ConventionRule } from '@/lib/preflight/corpus/types'

const R = (id: string, section: string, source: string): ConventionRule =>
  ({ id, section: section as ConventionRule['section'], rule: 'tu etwas konkretes', severity: 'must', source })

describe('filterBySource', () => {
  it('droppt Compliance-Pack-Quellen, behält Engineering', () => {
    const rules = [R('a', 'security', 'agent:DSGVO'), R('b', 'code-rules', 'agent:CODE_STYLE'), R('c', 'security', 'agent:AI_ACT'), R('d', 'code-rules', 'agent:AI_INTEGRATION')]
    const kept = filterBySource(rules).map((r) => r.id)
    expect(kept).toContain('b'); expect(kept).toContain('d')
    expect(kept).not.toContain('a'); expect(kept).not.toContain('c')
  })
  it('EXCLUDED_SOURCES enthält DSGVO/AI_ACT/BFSG/LEGAL/AGENT_QUALITY', () => {
    for (const s of ['DSGVO', 'AI_ACT', 'BFSG', 'LEGAL', 'AGENT_QUALITY']) expect(EXCLUDED_SOURCES).toContain(s)
  })
})
describe('groupBySection', () => {
  it('gruppiert nach section', () => {
    const g = groupBySection([R('a', 'security', 's'), R('b', 'security', 's'), R('c', 'naming', 's')])
    expect(g['security']?.length).toBe(2); expect(g['naming']?.length).toBe(1)
  })
})
