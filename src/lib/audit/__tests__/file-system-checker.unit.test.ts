// src/lib/audit/__tests__/file-system-checker.unit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted runs before vi.mock hoisting, so these refs are available in the factory
const mocks = vi.hoisted(() => ({
  existsSync: vi.fn<(p: string) => boolean>().mockReturnValue(false),
  readdirSync: vi.fn<(p: string) => string[]>().mockReturnValue([]),
  readFileSync: vi.fn<(p: string, enc?: string) => string>().mockReturnValue(''),
}))

vi.mock('node:fs', () => ({
  default: mocks,
  ...mocks,
}))

vi.mock('node:path', async () => {
  const actual = await vi.importActual<typeof import('node:path')>('node:path')
  return { ...actual, default: actual }
})

import {
  checkTypeScriptStrictMode,
  checkEsLintConfigured,
  checkPrettierConfigured,
  checkLockfileCommitted,
  checkNodeVersionFixed,
  checkMigrationsTool,
  checkCIPipelinePresent,
  checkDependabotConfigured,
  checkPWAManifest,
  checkServiceWorker,
  checkHealthEndpoint,
  checkApiVersioning,
  checkOpenApiSpec,
  checkErrorTrackingSentry,
  checkDistributedTracing,
  checkI18nFramework,
  checkVulnerabilityScanInCI,
  checkInfrastructureAsCode,
  checkJobQueuePresent,
  checkE2ETestsPresent,
  checkIntegrationTests,
  checkTestsInCIPipeline,
  checkKiCodeGate,
  checkSBOMGenerated,
  checkSemanticVersioning,
  checkBundleAnalyzer,
  checkProjectStructure,
} from '../checkers/file-system-checker'
import type { AuditContext } from '../types'

const { existsSync, readdirSync, readFileSync } = mocks

function makeCtx(overrides: Partial<AuditContext> = {}): AuditContext {
  return {
    rootPath: '/repo',
    repoMap: {
      files: [], dependencies: [], rankedSymbols: [],
      stats: { totalFiles: 0, totalSymbols: 0, totalLines: 0, includedSymbols: 0, tokenBudget: 4096, estimatedTokens: 0 },
      generatedAt: '', rootPath: '/repo', version: '1.0.0', compressedMap: '',
    },
    packageJson: { name: 'tropen-os', version: '0.1.0', dependencies: {}, devDependencies: {} },
    tsConfig: { compilerOptions: { strict: true } },
    filePaths: [],
    gitInfo: { hasGitDir: true, recentCommits: [] },
    ...overrides,
  }
}

beforeEach(() => {
  existsSync.mockReturnValue(false)
  readdirSync.mockReturnValue([])
  readFileSync.mockReturnValue('')
})

describe('checkTypeScriptStrictMode', () => {
  it('returns score 5 when strict: true', async () => {
    const ctx = makeCtx({ tsConfig: { compilerOptions: { strict: true } } })
    const result = await checkTypeScriptStrictMode(ctx)
    expect(result.score).toBe(5)
    expect(result.automated).toBe(true)
  })

  it('returns score 0 when strict is absent', async () => {
    const ctx = makeCtx({ tsConfig: { compilerOptions: {} } })
    const result = await checkTypeScriptStrictMode(ctx)
    expect(result.score).toBe(0)
  })

  it('returns score 0 when compilerOptions is absent', async () => {
    const ctx = makeCtx({ tsConfig: {} })
    const result = await checkTypeScriptStrictMode(ctx)
    expect(result.score).toBe(0)
  })
})

describe('checkEsLintConfigured', () => {
  it('returns score 5 when eslint.config.mjs exists', async () => {
    existsSync.mockImplementation((p) =>
      (p as string).includes('eslint.config.mjs')
    )
    const result = await checkEsLintConfigured(makeCtx())
    expect(result.score).toBe(5)
  })

  it('returns score 0 when no eslint config found', async () => {
    const result = await checkEsLintConfigured(makeCtx())
    expect(result.score).toBe(0)
  })
})

describe('checkLockfileCommitted', () => {
  it('returns score 5 when pnpm-lock.yaml exists', async () => {
    existsSync.mockReturnValue(true)
    const result = await checkLockfileCommitted(makeCtx())
    expect(result.score).toBe(5)
  })

  it('returns score 0 when pnpm-lock.yaml is absent', async () => {
    const result = await checkLockfileCommitted(makeCtx())
    expect(result.score).toBe(0)
  })
})

describe('checkMigrationsTool', () => {
  it('returns score 5 when supabase/migrations has files', async () => {
    existsSync.mockReturnValue(true)
    readdirSync.mockReturnValue(['001_init.sql', '002_auth.sql'])
    const result = await checkMigrationsTool(makeCtx())
    expect(result.score).toBe(5)
  })

  it('returns score 2 when supabase/migrations exists but is empty', async () => {
    existsSync.mockReturnValue(true)
    readdirSync.mockReturnValue([])
    const result = await checkMigrationsTool(makeCtx())
    expect(result.score).toBe(2)
  })

  it('returns score 0 when supabase/migrations does not exist', async () => {
    const result = await checkMigrationsTool(makeCtx())
    expect(result.score).toBe(0)
  })
})

describe('checkCIPipelinePresent', () => {
  it('returns score 5 when .github/workflows has 3+ yml files', async () => {
    existsSync.mockReturnValue(true)
    readdirSync.mockReturnValue(['ci.yml', 'deploy.yml', 'release.yml'])
    const result = await checkCIPipelinePresent(makeCtx())
    expect(result.score).toBe(5)
  })

  it('returns score 0 when no workflow files exist', async () => {
    const result = await checkCIPipelinePresent(makeCtx())
    expect(result.score).toBe(0)
  })
})

describe('checkDependabotConfigured', () => {
  it('returns score 5 when .github/dependabot.yml exists', async () => {
    existsSync.mockReturnValue(true)
    const result = await checkDependabotConfigured(makeCtx())
    expect(result.score).toBe(5)
  })

  it('returns score 0 when absent', async () => {
    const result = await checkDependabotConfigured(makeCtx())
    expect(result.score).toBe(0)
  })
})

describe('checkErrorTrackingSentry', () => {
  it('returns score 5 when @sentry/nextjs in dependencies', async () => {
    const ctx = makeCtx({ packageJson: { dependencies: { '@sentry/nextjs': '^10.0.0' } } })
    const result = await checkErrorTrackingSentry(ctx)
    expect(result.score).toBe(5)
  })

  it('returns score 0 when @sentry/nextjs absent', async () => {
    const ctx = makeCtx({ packageJson: { dependencies: {} } })
    const result = await checkErrorTrackingSentry(ctx)
    expect(result.score).toBe(0)
  })
})

describe('checkE2ETestsPresent', () => {
  it('returns score 5 when playwright.config.ts + spec files exist', async () => {
    existsSync.mockImplementation((p) =>
      (p as string).includes('playwright.config.ts')
    )
    const ctx = makeCtx({ filePaths: ['e2e/login.spec.ts', 'e2e/chat.spec.ts'] })
    const result = await checkE2ETestsPresent(ctx)
    expect(result.score).toBe(5)
  })

  it('returns score 0 when no e2e tests', async () => {
    const result = await checkE2ETestsPresent(makeCtx())
    expect(result.score).toBe(0)
  })
})

describe('checkSemanticVersioning', () => {
  it('returns score 3 when version is 0.1.0 (pre-stable)', async () => {
    const ctx = makeCtx({ packageJson: { version: '0.1.0' } })
    const result = await checkSemanticVersioning(ctx)
    expect(result.score).toBe(3)
  })

  it('returns score 5 when version is >= 1.0.0', async () => {
    const ctx = makeCtx({ packageJson: { version: '1.0.0' } })
    const result = await checkSemanticVersioning(ctx)
    expect(result.score).toBe(5)
  })
})
