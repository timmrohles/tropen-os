// src/lib/preflight/__tests__/generate.unit.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('ai', () => ({
  generateObject: vi.fn(async () => ({
    object: {
      decisionLog: '# Log',
      claudeMd: '# CLAUDE',
      envExample: 'OPENAI_API_KEY=',
      migrationSql: 'CREATE TABLE x ();',
    },
  })),
}))
vi.mock('@/lib/llm/anthropic', () => ({ anthropic: () => 'mock' }))

import { generateStartpaket } from '../generate'

describe('generateStartpaket', () => {
  it('baut Startpaket inkl. Migration-Entwurf', async () => {
    const sp = await generateStartpaket('text', [])
    expect(sp.claudeMd).toBe('# CLAUDE')
    expect(sp.migrationDraft?.sql).toBe('CREATE TABLE x ();')
    expect(sp.migrationDraft?.warnings).toEqual([]) // Audit kommt in Task 7
  })

  it('mappt alle Felder korrekt', async () => {
    const sp = await generateStartpaket('text', [])
    expect(sp.decisionLog).toBe('# Log')
    expect(sp.envExample).toBe('OPENAI_API_KEY=')
  })
})
