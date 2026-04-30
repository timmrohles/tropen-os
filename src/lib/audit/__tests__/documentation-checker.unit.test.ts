// src/lib/audit/__tests__/documentation-checker.unit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockExistsSync = vi.hoisted(() => vi.fn())
const mockReaddirSync = vi.hoisted(() => vi.fn())
const mockReadFileSync = vi.hoisted(() => vi.fn())

vi.mock('node:fs', () => ({
  default: {
    existsSync: mockExistsSync,
    readdirSync: mockReaddirSync,
    readFileSync: mockReadFileSync,
  },
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  readFileSync: mockReadFileSync,
}))

import {
  checkADRsPresent,
  checkReadmePresent,
  checkConventionalCommits,
  checkFKConstraintsInMigrations,
} from '../checkers/documentation-checker'
import type { AuditContext } from '../types'

function makeCtx(overrides: Partial<AuditContext> = {}): AuditContext {
  return {
    rootPath: '/repo',
    repoMap: {
      files: [], dependencies: [], rankedSymbols: [],
      stats: { totalFiles: 0, totalSymbols: 0, totalLines: 0, includedSymbols: 0, tokenBudget: 4096, estimatedTokens: 0 },
      generatedAt: '', rootPath: '/repo', version: '1.0.0', compressedMap: '',
    },
    packageJson: {},
    tsConfig: {},
    filePaths: [],
    gitInfo: { hasGitDir: true, recentCommits: [] },
    ...overrides,
  }
}

beforeEach(() => vi.resetAllMocks())

describe('checkADRsPresent', () => {
  it('returns score 5 when >= 5 ADR files exist', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReaddirSync.mockReturnValue(['adr-001.md', 'adr-002.md', 'adr-003.md', 'adr-004.md', 'adr-005.md'])
    const result = await checkADRsPresent(makeCtx())
    expect(result.score).toBe(5)
  })

  it('returns score 3 when 2-4 ADR files exist', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReaddirSync.mockReturnValue(['adr-001.md', 'adr-002.md'])
    const result = await checkADRsPresent(makeCtx())
    expect(result.score).toBe(3)
  })

  it('returns score 0 when docs/adr/ not found', async () => {
    mockExistsSync.mockReturnValue(false)
    const result = await checkADRsPresent(makeCtx())
    expect(result.score).toBe(0)
  })
})

describe('checkReadmePresent', () => {
  it('returns score 5 when README.md has >= 100 lines', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(Array(110).fill('line').join('\n'))
    const result = await checkReadmePresent(makeCtx())
    expect(result.score).toBe(5)
  })

  it('returns score 2 when README.md < 20 lines', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue('# Title\nsome content\n')
    const result = await checkReadmePresent(makeCtx())
    expect(result.score).toBe(2)
  })

  it('returns score 0 when README.md absent', async () => {
    mockExistsSync.mockReturnValue(false)
    const result = await checkReadmePresent(makeCtx())
    expect(result.score).toBe(0)
  })
})

describe('checkConventionalCommits', () => {
  it('returns score 5 when >= 80% of commits follow conventional format', async () => {
    const commits = Array(10).fill(null).map((_, i) => `feat(scope): add feature ${i}`)
    const ctx = makeCtx({ gitInfo: { hasGitDir: true, recentCommits: commits } })
    const result = await checkConventionalCommits(ctx)
    expect(result.score).toBe(5)
  })

  it('returns score < 4 when < 40% follow conventional format', async () => {
    const commits = ['fix things', 'update', 'feat: good one', 'WIP', 'more stuff']
    const ctx = makeCtx({ gitInfo: { hasGitDir: true, recentCommits: commits } })
    const result = await checkConventionalCommits(ctx)
    expect(result.score).toBeLessThan(4)
  })

  it('returns score 0 when no git dir', async () => {
    const ctx = makeCtx({ gitInfo: { hasGitDir: false, recentCommits: [] } })
    const result = await checkConventionalCommits(ctx)
    expect(result.score).toBe(0)
  })
})

describe('checkFKConstraintsInMigrations', () => {
  it('returns score 5 when migrations have REFERENCES patterns', async () => {
    mockExistsSync.mockReturnValue(true)
    mockReaddirSync.mockReturnValue(['001.sql'])
    mockReadFileSync.mockReturnValue('CREATE TABLE t (id UUID, org_id UUID REFERENCES organizations(id) ON DELETE CASCADE)')
    const result = await checkFKConstraintsInMigrations(makeCtx())
    expect(result.score).toBe(5)
  })

  it('returns score 0 when no migration files found', async () => {
    mockExistsSync.mockReturnValue(false)
    const result = await checkFKConstraintsInMigrations(makeCtx())
    expect(result.score).toBe(0)
  })
})
