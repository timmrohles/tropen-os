// src/lib/preflight/__tests__/run.unit.test.ts
import { describe, it, expect, vi } from 'vitest'
import type { PreflightPivots } from '../types'

const PIVOTS: PreflightPivots = {
  buildTool: 'cursor',
  businessModel: 'b2c',
  audienceRegion: 'eu',
  hosting: 'eu',
  stack: 'Next.js + Supabase',
  platform: 'web',
  commercialModel: 'none',
}

// Mock LLM-dependent modules — isolated orchestration test
vi.mock('../analyze', () => ({
  analyzeInput: vi.fn(async () => ({
    projectLabel: 'Next.js-LMS mit Supabase',
    nodes: [{ id: 'U1', status: 'open' }],
  })),
}))

vi.mock('../generate', () => ({
  generateStartpaket: vi.fn(async () => ({
    decisionLog: '# Log',
    conventions: { filename: '.cursorrules', content: '# rules' },
    envExample: 'OPENAI_API_KEY=',
    migrationDraft: {
      sql: 'CREATE VIEW v AS SELECT 1;',
      warnings: [],
    },
  })),
}))

vi.mock('../migration-audit', () => ({
  auditMigrationSql: vi.fn(async () => ['WARN: security_invoker']),
}))

// Real deterministic modules — NOT mocked
// '../ingest' and '../gaps' run their actual logic

import { runPreflight } from '../run'

describe('runPreflight', () => {
  it('returns { summary, gaps, startpaket }', async () => {
    const result = await runPreflight('a sufficiently long design doc input text', PIVOTS)
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('gaps')
    expect(result).toHaveProperty('startpaket')
  })

  it('summary.projectLabel kommt von analyzeInput', async () => {
    const result = await runPreflight('a sufficiently long design doc input text', PIVOTS)
    expect(result.summary.projectLabel).toBe('Next.js-LMS mit Supabase')
  })

  it('summary.headline zeigt Blocker-Anzahl wenn gaps.red > 0', async () => {
    const result = await runPreflight('a sufficiently long design doc input text', PIVOTS)
    // U1 ist open + red → headline zeigt Blocker
    expect(result.summary.headline).toMatch(/Dinge solltest du zuerst entscheiden/)
  })

  it('gaps.red enthält U1 Gap (real buildGapList ran)', async () => {
    const result = await runPreflight('a sufficiently long design doc input text', PIVOTS)
    const u1 = result.gaps.red.find((g) => g.id === 'U1')
    expect(u1).toBeDefined()
    expect(u1?.domain).toBe('Universell')
  })

  it('startpaket.migrationDraft.warnings von auditMigrationSql befüllt', async () => {
    const result = await runPreflight('a sufficiently long design doc input text', PIVOTS)
    expect(result.startpaket.migrationDraft?.warnings).toEqual(['WARN: security_invoker'])
  })

  it('summary.headline = keine Blocker wenn gaps.red leer', async () => {
    // Override analyze to return only decided nodes → no red gaps
    const { analyzeInput } = await import('../analyze')
    vi.mocked(analyzeInput).mockResolvedValueOnce({
      projectLabel: 'Einfaches Projekt',
      nodes: [{ id: 'D1', status: 'decided', evidence: 'vorhanden' }],
    })
    const result = await runPreflight('a sufficiently long design doc input text', PIVOTS)
    expect(result.summary.headline).toBe('Keine Blocker — du kannst loslegen.')
    expect(result.summary.projectLabel).toBe('Einfaches Projekt')
  })
})
