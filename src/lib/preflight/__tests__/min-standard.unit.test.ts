import { describe, it, expect } from 'vitest'
import { isMinStandardMet } from '../types'
import type { GapList, DecisionMap } from '../types'

const gaps = (redIds: string[]): GapList => ({
  red: redIds.map(id => ({ id, domain: 'D', frage: 'f', warum: 'w', default: 'd', kosten: 'red' })),
  yellow: [{ id: 'Y1', domain: 'D', frage: 'f', warum: 'w', default: 'd', kosten: 'yellow' }],
  decidedCount: 0, naCount: 0,
})

describe('isMinStandardMet', () => {
  it('false wenn eine rote Lücke ohne Entscheidung', () => {
    expect(isMinStandardMet(gaps(['A', 'B']), { A: { choice: 'default' } } as DecisionMap)).toBe(false)
  })
  it('true wenn alle roten entschieden oder geparkt', () => {
    const d: DecisionMap = { A: { choice: 'default' }, B: { choice: 'parked' } }
    expect(isMinStandardMet(gaps(['A', 'B']), d)).toBe(true)
  })
  it('gelbe Lücken sind egal', () => {
    expect(isMinStandardMet(gaps([]), {})).toBe(true)
  })
})
