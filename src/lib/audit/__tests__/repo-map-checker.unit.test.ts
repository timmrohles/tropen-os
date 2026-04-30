// src/lib/audit/__tests__/repo-map-checker.unit.test.ts
import { describe, it, expect } from 'vitest'
import type { AuditContext } from '../types'
import type { RepoFile, FileDependency } from '@/lib/repo-map'
import {
  checkCircularDependencies,
  checkFileSizes,
  checkInputValidationCoverage,
  checkServiceKeyInFrontend,
  checkNamingConventions,
} from '../checkers/repo-map-checker'

function makeFile(path: string, lineCount: number, overrides: Partial<RepoFile> = {}): RepoFile {
  return { path, lineCount, language: 'typescript', symbols: [], imports: [], exports: [], ...overrides }
}

function makeDep(source: string, target: string): FileDependency {
  return { source, target, symbols: [] }
}

function makeCtx(files: RepoFile[], deps: FileDependency[] = [], fileContents?: Map<string, string>): AuditContext {
  return {
    rootPath: '/repo',
    repoMap: {
      files, dependencies: deps,
      rankedSymbols: [],
      stats: { totalFiles: files.length, totalSymbols: 0, totalLines: 0, includedSymbols: 0, tokenBudget: 4096, estimatedTokens: 0 },
      generatedAt: '', rootPath: '/repo', version: '1.0.0', compressedMap: '',
    },
    packageJson: {}, tsConfig: {},
    filePaths: files.map((f) => f.path),
    gitInfo: { hasGitDir: true, recentCommits: [] },
    fileContents,
  }
}

describe('checkCircularDependencies', () => {
  it('returns score 5 with no cycles', async () => {
    const ctx = makeCtx(
      [makeFile('a.ts', 10), makeFile('b.ts', 10)],
      [makeDep('a.ts', 'b.ts')]
    )
    const result = await checkCircularDependencies(ctx)
    expect(result.score).toBe(5)
    expect(result.findings).toHaveLength(0)
  })

  it('detects a direct cycle a->b->a', async () => {
    const ctx = makeCtx(
      [makeFile('a.ts', 10), makeFile('b.ts', 10)],
      [makeDep('a.ts', 'b.ts'), makeDep('b.ts', 'a.ts')]
    )
    const result = await checkCircularDependencies(ctx)
    expect(result.score).toBeLessThan(5)
    expect(result.findings.length).toBeGreaterThan(0)
    expect(result.findings[0].severity).toBe('high')
  })

  it('detects a 3-node cycle a->b->c->a', async () => {
    const ctx = makeCtx(
      [makeFile('a.ts', 10), makeFile('b.ts', 10), makeFile('c.ts', 10)],
      [makeDep('a.ts', 'b.ts'), makeDep('b.ts', 'c.ts'), makeDep('c.ts', 'a.ts')]
    )
    const result = await checkCircularDependencies(ctx)
    expect(result.findings.length).toBeGreaterThan(0)
  })
})

describe('checkFileSizes', () => {
  it('returns score 5 when all files < 300 lines', async () => {
    const ctx = makeCtx([makeFile('a.ts', 100), makeFile('b.ts', 299)])
    const result = await checkFileSizes(ctx)
    expect(result.score).toBe(5)
  })

  it('returns lower score for many large files', async () => {
    const largeFiles = Array.from({ length: 20 }, (_, i) => makeFile(`f${i}.ts`, 510))
    const ctx = makeCtx(largeFiles)
    const result = await checkFileSizes(ctx)
    expect(result.score).toBeLessThanOrEqual(2)
    expect(result.findings.some((f) => f.severity === 'high')).toBe(true)
  })

  it('penalizes files > 500 lines as violations', async () => {
    const ctx = makeCtx([makeFile('big.ts', 600)])
    const result = await checkFileSizes(ctx)
    expect(result.findings.some((f) => f.message.includes('violation'))).toBe(true)
  })
})

describe('checkInputValidationCoverage', () => {
  it('returns score 5 when all API routes use validateBody', async () => {
    const routeFile = makeFile('src/app/api/users/route.ts', 30, {
      imports: [{ source: 'src/app/api/users/route.ts', target: 'src/lib/validators/users', symbols: ['validateBody'] }],
    })
    const ctx = makeCtx([routeFile])
    const result = await checkInputValidationCoverage(ctx)
    expect(result.score).toBe(5)
  })

  it('returns low score when no API routes use validateBody', async () => {
    const routeFile = makeFile('src/app/api/users/route.ts', 30, { imports: [], exports: ['POST'] })
    const ctx = makeCtx([routeFile])
    const result = await checkInputValidationCoverage(ctx)
    expect(result.score).toBeLessThan(3)
  })
})

describe('checkServiceKeyInFrontend', () => {
  it('returns score 5 when supabaseAdmin not in components/', async () => {
    const file = makeFile('src/components/Layout.tsx', 50, {
      imports: [{ source: 'src/components/Layout.tsx', target: 'src/lib/auth', symbols: ['getAuthUser'] }],
    })
    const ctx = makeCtx([file])
    const result = await checkServiceKeyInFrontend(ctx)
    expect(result.score).toBe(5)
  })

  it('returns score 0 when supabaseAdmin imported in component', async () => {
    const file = makeFile('src/components/Layout.tsx', 50, {
      imports: [{ source: 'src/components/Layout.tsx', target: 'src/lib/supabase-admin', symbols: ['supabaseAdmin'] }],
    })
    const contents = new Map([
      ['src/components/Layout.tsx', "'use client'\nimport { supabaseAdmin } from '@/lib/supabase-admin'\n"],
    ])
    const ctx = makeCtx([file], [], contents)
    const result = await checkServiceKeyInFrontend(ctx)
    expect(result.score).toBe(0)
    expect(result.findings[0].severity).toBe('critical')
  })
})

describe('checkNamingConventions', () => {
  it('returns score 5 for correctly named files', async () => {
    const files = [
      makeFile('src/components/UserCard.tsx', 50),
      makeFile('src/hooks/useUserProfile.ts', 30),
      makeFile('src/lib/formatDate.ts', 20),
    ]
    const result = await checkNamingConventions(makeCtx(files))
    expect(result.score).toBe(5)
  })

  it('detects lowercase component filename as violation', async () => {
    const files = [makeFile('src/components/userCard.tsx', 50)]
    const result = await checkNamingConventions(makeCtx(files))
    expect(result.findings.length).toBeGreaterThan(0)
  })

  it('detects hook without use prefix as violation', async () => {
    const files = [makeFile('src/hooks/workspaceState.ts', 30)]
    const result = await checkNamingConventions(makeCtx(files))
    expect(result.findings.length).toBeGreaterThan(0)
  })
})
