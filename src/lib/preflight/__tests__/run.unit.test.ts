// src/lib/preflight/__tests__/run.unit.test.ts
import { describe, it, expect, vi } from 'vitest'

// Mock LLM-dependent modules — isolated orchestration test
vi.mock('../analyze', () => ({
  analyzeInput: vi.fn(async () => [{ id: 'U1', status: 'open' }]),
}))

vi.mock('../generate', () => ({
  generateStartpaket: vi.fn(async () => ({
    decisionLog: '# Log',
    claudeMd: '# CLAUDE',
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
  it('returns { gaps, startpaket }', async () => {
    const result = await runPreflight('a sufficiently long design doc input text')
    expect(result).toHaveProperty('gaps')
    expect(result).toHaveProperty('startpaket')
  })

  it('gaps.red contains the U1 gap (real buildGapList ran)', async () => {
    const result = await runPreflight('a sufficiently long design doc input text')
    const u1 = result.gaps.red.find((g) => g.id === 'U1')
    expect(u1).toBeDefined()
    expect(u1?.domain).toBe('Universell')
  })

  it('startpaket.migrationDraft.warnings filled by auditMigrationSql', async () => {
    const result = await runPreflight('a sufficiently long design doc input text')
    expect(result.startpaket.migrationDraft?.warnings).toEqual(['WARN: security_invoker'])
  })
})
