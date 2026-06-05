// src/lib/preflight/__tests__/ingest.unit.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeInput } from '../ingest'

describe('normalizeInput', () => {
  it('trimmt und behält Text', () => {
    expect(normalizeInput('  hallo welt dies ist ein laengerer text  ')).toBe('hallo welt dies ist ein laengerer text')
  })
  it('wirft bei zu kurzem Input', () => {
    expect(() => normalizeInput('hi')).toThrow(/zu kurz/i)
  })
})
