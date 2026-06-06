import { describe, it, expect } from 'vitest'
import { isThinInput } from '../run'

const gaps = (decided: number) => ({ red: [], yellow: [], decidedCount: decided, naCount: 0 })

describe('isThinInput', () => {
  it('kurzer Input ist dünn', () => {
    expect(isThinInput('Ich möchte ein LMS bauen', gaps(6))).toBe(true)
  })
  it('langer Input mit Substanz ist nicht dünn', () => {
    const long = 'Ein LMS für Firmen. '.repeat(40) // > 280 Zeichen
    expect(isThinInput(long, gaps(6))).toBe(false)
  })
  it('fast nichts entschieden ist dünn', () => {
    const long = 'x'.repeat(400)
    expect(isThinInput(long, gaps(1))).toBe(true)
  })
})
