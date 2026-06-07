// src/lib/preflight/__tests__/generate.unit.test.ts
import { describe, it, expect, vi } from 'vitest'
import type { PreflightPivots } from '../types'
import { CONVENTIONS_FILENAME } from '../types'

vi.mock('ai', () => ({
  generateObject: vi.fn(async () => ({
    object: {
      decisionLog: '# Log',
      conventionsContent: '# .cursorrules content',
      envExample: 'OPENAI_API_KEY=',
      migrationSql: 'CREATE TABLE x ();',
    },
  })),
}))
vi.mock('@/lib/llm/anthropic', () => ({ anthropic: () => 'mock' }))
vi.mock('../migration-audit', () => ({ auditMigrationSql: vi.fn(async () => []) }))

import { generateStartpaket } from '../generate'

const PIVOTS: PreflightPivots = {
  buildTool: 'cursor',
  businessModel: 'b2c',
  audienceRegion: 'eu',
  hosting: 'eu',
  stack: 'Next.js + Supabase',
  platform: 'web',
  commercialModel: 'none',
}

describe('generateStartpaket', () => {
  it('baut Startpaket inkl. Migration-Entwurf', async () => {
    const sp = await generateStartpaket('text', [], PIVOTS)
    expect(sp.conventions.content).toBe('# .cursorrules content')
    expect(sp.migrationDraft?.sql).toBe('CREATE TABLE x ();')
    expect(sp.migrationDraft?.warnings).toEqual([])
  })

  it('conventions.filename entspricht dem buildTool-Pivot', async () => {
    const sp = await generateStartpaket('text', [], PIVOTS)
    expect(sp.conventions.filename).toBe(CONVENTIONS_FILENAME['cursor'])
    expect(sp.conventions.filename).toBe('.cursorrules')
  })

  it('mappt alle Felder korrekt', async () => {
    const sp = await generateStartpaket('text', [], PIVOTS)
    expect(sp.decisionLog).toBe('# Log')
    expect(sp.envExample).toBe('OPENAI_API_KEY=')
  })

  it('conventions.filename ist CLAUDE.md für claude-code', async () => {
    const claudeCodePivots: PreflightPivots = { ...PIVOTS, buildTool: 'claude-code' }
    const sp = await generateStartpaket('text', [], claudeCodePivots)
    expect(sp.conventions.filename).toBe('CLAUDE.md')
  })
})
