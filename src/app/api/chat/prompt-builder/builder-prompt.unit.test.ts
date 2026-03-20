import { describe, it, expect } from 'vitest'
import { buildBuilderStep } from './builder-prompt'

describe('buildBuilderStep', () => {
  it('builds initial step with empty history', () => {
    const result = buildBuilderStep({
      originalPrompt: 'Schreib einen Newsletter',
      history: [],
    })
    expect(result).toContain('Newsletter')
    expect(result).toContain('Ergebnis')
  })

  it('includes conversation history in step 2+', () => {
    const result = buildBuilderStep({
      originalPrompt: 'Schreib einen Newsletter',
      history: [
        { role: 'assistant', content: 'Was genau soll das Ergebnis sein?' },
        { role: 'user', content: 'Ein E-Mail-Text für Bestandskunden' },
      ],
    })
    expect(result).toContain('Bestandskunden')
  })
})
