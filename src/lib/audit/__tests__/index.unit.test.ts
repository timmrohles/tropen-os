// src/lib/audit/__tests__/index.unit.test.ts
import { describe, it, expect, vi } from 'vitest'

const mockExistsSync = vi.hoisted(() => vi.fn().mockReturnValue(false))
const mockReadFileSync = vi.hoisted(() => vi.fn().mockReturnValue('{}'))
const mockExecFileSync = vi.hoisted(() => vi.fn().mockReturnValue(''))

vi.mock('node:fs', () => ({
  default: { existsSync: mockExistsSync, readFileSync: mockReadFileSync, readdirSync: vi.fn().mockReturnValue([]) },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  readdirSync: vi.fn().mockReturnValue([]),
}))
vi.mock('node:child_process', () => ({
  default: { execFileSync: mockExecFileSync },
  execFileSync: mockExecFileSync,
}))
vi.mock('@/lib/repo-map', () => ({
  generateRepoMap: vi.fn().mockResolvedValue({
    files: [], dependencies: [], rankedSymbols: [],
    stats: { totalFiles: 0, totalSymbols: 0, totalLines: 0, includedSymbols: 0, tokenBudget: 4096, estimatedTokens: 0 },
    generatedAt: new Date().toISOString(), rootPath: '/repo', version: '1.0.0', compressedMap: '',
  }),
}))

import { buildAuditContext, runAudit } from '../index'

describe('buildAuditContext', () => {
  it('returns a valid AuditContext', async () => {
    mockExistsSync.mockImplementation((p: unknown) => {
      const path = String(p)
      return path.includes('package.json') || path.includes('tsconfig')
    })
    mockReadFileSync.mockImplementation((p: unknown) => {
      const path = String(p)
      if (path.includes('package.json')) return JSON.stringify({ name: 'test', version: '1.0.0' })
      if (path.includes('tsconfig')) return JSON.stringify({ compilerOptions: { strict: true } })
      return '{}'
    })
    mockExecFileSync.mockReturnValue('feat: test\nfix: bug\n')

    const ctx = await buildAuditContext('/repo')
    expect(ctx.rootPath).toBe('/repo')
    expect(ctx.packageJson.name).toBe('test')
    expect(ctx.tsConfig.compilerOptions?.strict).toBe(true)
  })
})

describe('runAudit', () => {
  it('returns an AuditReport with 25 categories', async () => {
    mockExistsSync.mockReturnValue(false)
    mockReadFileSync.mockReturnValue(JSON.stringify({}))
    mockExecFileSync.mockReturnValue('')

    const ctx = await buildAuditContext('/repo')
    const report = await runAudit(ctx, { rootPath: '/repo' })

    expect(report.categories).toHaveLength(26)
    expect(typeof report.automatedPercentage).toBe('number')
    expect(['production-grade', 'stable', 'risky', 'prototype']).toContain(report.status)
    expect(report.automatedRuleCount).toBeGreaterThan(0)
    expect(report.manualRuleCount).toBeGreaterThan(0)
  })

  it('skips CLI checks when skipModes includes cli', async () => {
    mockExistsSync.mockReturnValue(false)
    mockReadFileSync.mockReturnValue(JSON.stringify({}))
    mockExecFileSync.mockReturnValue('')

    const ctx = await buildAuditContext('/repo')
    const report = await runAudit(ctx, { rootPath: '/repo', skipModes: ['cli'] })

    const dependencyVulnResult = report.categories.flatMap((c) => c.ruleResults).find(
      (r) => r.ruleId === 'cat-3-rule-7'
    )
    expect(dependencyVulnResult?.score).toBeNull()
  })
})
