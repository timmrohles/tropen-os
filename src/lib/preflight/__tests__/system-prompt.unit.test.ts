import { describe, it, expect } from 'vitest'
import { buildPreflightSystemPrompt } from '../system-prompt'

describe('buildPreflightSystemPrompt', () => {
  it('nennt Toro + alle 4 Konzept-Dimensionen als Agenda', () => {
    const p = buildPreflightSystemPrompt({ name: 'MeinShop', pivots: { branche: 'Handel' } })
    expect(p).toMatch(/Toro/)
    expect(p).toMatch(/was.*für wen/i)
    expect(p).toMatch(/Kern-?Funktionen/i)
    expect(p).toMatch(/Nutzer.*Daten/i)
    expect(p).toMatch(/Verkauf|Geschäftsmodell/i)
  })

  it('bettet den Projektnamen ein', () => {
    expect(buildPreflightSystemPrompt({ name: 'MeinShop', pivots: null })).toMatch(/MeinShop/)
  })

  it('verlangt Nachfragen bei dünnem Input statt Weiterreichen (ADR-030)', () => {
    expect(buildPreflightSystemPrompt({ name: 'X', pivots: null })).toMatch(/nachfrag|dünn|unklar/i)
  })
})
