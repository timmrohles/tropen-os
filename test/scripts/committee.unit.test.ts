import { describe, it, expect } from 'vitest'
import { COMMITTEE_REVIEWERS, COMMITTEE_JUDGE, PRICE_TABLE, estimateCost } from '../../src/scripts/lib/committee'

describe('committee roster', () => {
  it('hat genau 4 Reviewer, keiner davon Anthropic (kein Selbst-Bias zum Judge)', () => {
    expect(COMMITTEE_REVIEWERS).toHaveLength(4)
    for (const r of COMMITTEE_REVIEWERS) expect(r.model.startsWith('anthropic/')).toBe(false)
  })

  it('Judge ist Anthropic Opus 4.8', () => {
    expect(COMMITTEE_JUDGE.model).toBe('anthropic/claude-opus-4.8')
  })

  it('jeder Roster-Slug hat einen Preis-Eintrag', () => {
    for (const m of [...COMMITTEE_REVIEWERS, COMMITTEE_JUDGE]) {
      expect(PRICE_TABLE[m.model], m.model).toBeDefined()
    }
  })

  it('estimateCost rechnet Input+Output in EUR (USD*0.93)', () => {
    const eur = estimateCost('openai/gpt-5.5', 1_000_000, 1_000_000)
    expect(eur).toBeCloseTo((2.5 + 10) * 0.93, 4)
  })

  it('estimateCost nutzt Fallback-Preis für unbekannte Slugs', () => {
    expect(estimateCost('unknown/model', 1_000_000, 0)).toBeGreaterThan(0)
  })
})
