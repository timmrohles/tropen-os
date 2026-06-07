import { describe, it, expect } from 'vitest'
import { RULE_CORPUS } from '../rule-corpus'
import type { ConventionSection } from '../types'

const MUST_SECTIONS: ConventionSection[] = ['code-rules', 'naming', 'structure', 'error-handling', 'security', 'maintenance']

describe('RULE_CORPUS', () => {
  it('jede Pflicht-Sektion hat ≥3 universelle Regeln', () => {
    for (const s of MUST_SECTIONS) {
      const universal = RULE_CORPUS.filter((r) => r.section === s && !r.appliesWhen)
      expect(universal.length, `Sektion ${s}`).toBeGreaterThanOrEqual(3)
    }
  })
  it('IDs sind eindeutig', () => {
    const ids = RULE_CORPUS.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('enthält bedingte Regeln für react + db', () => {
    expect(RULE_CORPUS.some((r) => r.appliesWhen?.includes('stack:react'))).toBe(true)
    expect(RULE_CORPUS.some((r) => r.appliesWhen?.includes('db:true'))).toBe(true)
  })
  it('Regeltexte sind nicht leer', () => {
    expect(RULE_CORPUS.every((r) => r.rule.trim().length > 8)).toBe(true)
  })
})
