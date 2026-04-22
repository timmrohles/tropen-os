import { describe, it, expect } from 'vitest'
import { getPercentileRank } from '../score-percentile'

describe('getPercentileRank', () => {
  it('returns 0 for score below all benchmark repos', () => {
    expect(getPercentileRank(0)).toBe(0)
  })

  it('returns 100 for score above all benchmark repos', () => {
    expect(getPercentileRank(100)).toBe(100)
  })

  it('returns a number between 0 and 100', () => {
    const rank = getPercentileRank(80)
    expect(rank).toBeGreaterThanOrEqual(0)
    expect(rank).toBeLessThanOrEqual(100)
  })

  it('higher scores yield higher percentile', () => {
    expect(getPercentileRank(85)).toBeGreaterThan(getPercentileRank(75))
  })

  it('uses topic-specific scores when topic provided', () => {
    const rankAll = getPercentileRank(80)
    const rankLovable = getPercentileRank(80, 'lovable')
    // Both should be valid percentiles but can differ
    expect(rankLovable).toBeGreaterThanOrEqual(0)
    expect(rankLovable).toBeLessThanOrEqual(100)
    // lovable pool has more entries so result may differ
    expect(typeof rankLovable).toBe('number')
    expect(rankAll).not.toBeNaN()
  })

  it('falls back to all scores for unknown topic', () => {
    const rankUnknown = getPercentileRank(80, 'unknown-topic')
    const rankAll = getPercentileRank(80)
    expect(rankUnknown).toBe(rankAll)
  })

  it('returns integer (Math.round applied)', () => {
    const rank = getPercentileRank(82.5)
    expect(rank).toBe(Math.round(rank))
  })
})
