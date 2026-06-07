import { describe, it, expect, vi } from 'vitest'
vi.mock('@/lib/llm/anthropic', () => ({ anthropic: () => 'model' }))
vi.mock('../analyze', () => ({ analyzeInput: vi.fn().mockResolvedValue({ nodes: [{ id: 'D1', status: 'open' }], projectLabel: 'LMS' }) }))
vi.mock('../gaps', () => ({ buildGapList: vi.fn().mockReturnValue({ red: [{ id: 'D1' }], yellow: [], decidedCount: 1, naCount: 0 }) }))

import { analyzePreflight } from '../run'

describe('analyzePreflight', () => {
  it('gibt summary+gaps+nodes ohne startpaket', async () => {
    const r = await analyzePreflight('Ein hinreichend langes Konzept '.repeat(20), { buildTool: 'cursor' } as never)
    expect(r).toHaveProperty('summary')
    expect(r).toHaveProperty('gaps')
    expect(r).toHaveProperty('nodes')
    expect(r).not.toHaveProperty('startpaket')
  })
})
