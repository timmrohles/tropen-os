import { describe, it, expect, vi } from 'vitest'

vi.mock('ai', () => ({
  generateObject: vi.fn(async () => ({ object: {
    title: 'LMS Plattform', overview: 'Ein Lernmanagementsystem.', architecture: 'Next.js + Supabase, Multi-Tenant.',
  } })),
}))
vi.mock('@/lib/llm/anthropic', () => ({ anthropic: () => 'mock' }))

import { renderConventions } from '../render'
import type { PreflightPivots } from '../../types'

const PIVOTS: PreflightPivots = {
  buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu',
  stack: 'Next.js + Supabase', platform: 'web', commercialModel: 'none',
}

describe('renderConventions', () => {
  it('enthält die deterministische Baseline WÖRTLICH + die LLM-Projekt-Schicht', async () => {
    const md = await renderConventions('Ein LMS', [], PIVOTS, {})
    // Baseline kann nicht verdünnt werden:
    expect(md).toContain('Dateien > 300 Zeilen')
    expect(md).toContain('Auth-Check als erste Zeile')
    // bedingte db-Regel ist drin (Supabase → db:true):
    expect(md).toContain('Migrationsdatei')
    // LLM-Projekt-Schicht:
    expect(md).toContain('Ein Lernmanagementsystem.')
    expect(md).toContain('Multi-Tenant')
  })
})
