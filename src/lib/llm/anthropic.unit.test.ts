import { describe, it, expect } from 'vitest'

describe('anthropic provider', () => {
  it('exports an anthropic function', async () => {
    const { anthropic } = await import('./anthropic')
    expect(typeof anthropic).toBe('function')
  })

  it('returns a model when called with a model ID', async () => {
    const { anthropic } = await import('./anthropic')
    const model = anthropic('claude-haiku-4-5-20251001')
    expect(model).toBeDefined()
    expect(typeof model).toBe('object')
  })
})
