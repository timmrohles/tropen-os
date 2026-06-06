// src/lib/preflight/__tests__/analyze.unit.test.ts
import { describe, it, expect, vi } from 'vitest'
import type { PreflightPivots } from '../types'

vi.mock('ai', () => ({
  generateObject: vi.fn(async () => ({
    object: {
      projectLabel: 'Next.js-LMS mit Supabase',
      nodes: [
        { id: 'U1', status: 'open', plain: 'Du hast noch kein klares Ziel definiert.', action: 'Schreibe in einem Satz was die App tun soll.' },
        { id: 'D1', status: 'decided', evidence: 'org_id auf allen Tabellen vorhanden' },
      ],
    },
  })),
}))
vi.mock('@/lib/llm/anthropic', () => ({ anthropic: () => 'mock-model' }))

import { analyzeInput } from '../analyze'

const PIVOTS: PreflightPivots = {
  buildTool: 'cursor',
  businessModel: 'b2c',
  audienceRegion: 'eu',
  hosting: 'eu',
  stack: 'Next.js + Supabase',
  platform: 'web',
  commercialModel: 'none',
}

describe('analyzeInput', () => {
  it('gibt { nodes, projectLabel } zurück', async () => {
    const res = await analyzeInput('irgendein design doc text', PIVOTS)
    expect(res.projectLabel).toBe('Next.js-LMS mit Supabase')
    expect(res.nodes).toEqual([
      { id: 'U1', status: 'open', plain: 'Du hast noch kein klares Ziel definiert.', action: 'Schreibe in einem Satz was die App tun soll.' },
      { id: 'D1', status: 'decided', evidence: 'org_id auf allen Tabellen vorhanden' },
    ])
  })

  it('nodes enthält plain und action für offene Knoten', async () => {
    const res = await analyzeInput('irgendein design doc text', PIVOTS)
    const u1 = res.nodes.find(n => n.id === 'U1')!
    expect(u1.plain).toBeDefined()
    expect(u1.action).toBeDefined()
  })
})
