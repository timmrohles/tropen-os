// src/lib/preflight/__tests__/analyze.unit.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('ai', () => ({
  generateObject: vi.fn(async () => ({
    object: { nodes: [{ id: 'U1', status: 'open' }, { id: 'D1', status: 'decided', evidence: 'org_id' }] },
  })),
}))
vi.mock('@/lib/llm/anthropic', () => ({ anthropic: () => 'mock-model' }))

import { analyzeInput } from '../analyze'

describe('analyzeInput', () => {
  it('gibt NodeAnalysis[] zurück', async () => {
    const res = await analyzeInput('irgendein design doc text')
    expect(res).toEqual([
      { id: 'U1', status: 'open' },
      { id: 'D1', status: 'decided', evidence: 'org_id' },
    ])
  })
})
