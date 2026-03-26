import { describe, it, expect } from 'vitest'
import { buildChipsPrompt, parseChipsResponse } from './chips-prompt'

describe('buildChipsPrompt', () => {
  it('includes truncated response in prompt', () => {
    const prompt = buildChipsPrompt('Hier sind 5 Newsletter-Ideen: 1. Tipp ...')
    expect(prompt).toContain('Newsletter')
  })

  it('truncates long responses to 500 chars', () => {
    const longText = 'a'.repeat(1000)
    const prompt = buildChipsPrompt(longText)
    expect(prompt).toContain('a'.repeat(500))
    expect(prompt).not.toContain('a'.repeat(501))
  })
})

describe('parseChipsResponse', () => {
  it('parses valid JSON chips', () => {
    const raw = '{"chips":[{"label":"Mehr Ideen","prompt":"Gib mir 5 weitere"},{"label":"Ausarbeiten","prompt":"Arbeite Idee 1 aus"}]}'
    const chips = parseChipsResponse(raw)
    expect(chips).toHaveLength(2)
    expect(chips[0].label).toBe('Mehr Ideen')
  })

  it('returns empty array on invalid JSON', () => {
    expect(parseChipsResponse('not json')).toEqual([])
  })

  it('caps at 4 chips', () => {
    const raw = JSON.stringify({ chips: Array(6).fill({ label: 'x', prompt: 'y' }) })
    expect(parseChipsResponse(raw)).toHaveLength(4)
  })

  it('filters chips with empty label or prompt', () => {
    const raw = JSON.stringify({ chips: [{ label: '', prompt: 'x' }, { label: 'ok', prompt: 'do it' }] })
    expect(parseChipsResponse(raw)).toHaveLength(1)
  })
})
