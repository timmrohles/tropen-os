// src/lib/audit/__tests__/cli-checker.unit.test.ts
import { describe, it, expect, vi } from 'vitest'
import type { AuditContext } from '../types'
import { createCliChecks } from '../checkers/cli-checker'
import type { RunCommand } from '../checkers/cli-checker'

function makeCtx(): AuditContext {
  return {
    rootPath: '/repo',
    repoMap: {
      files: [], dependencies: [], rankedSymbols: [],
      stats: { totalFiles: 0, totalSymbols: 0, totalLines: 0, includedSymbols: 0, tokenBudget: 4096, estimatedTokens: 0 },
      generatedAt: '', rootPath: '/repo', version: '1.0.0', compressedMap: '',
    },
    packageJson: {}, tsConfig: {},
    filePaths: [],
    gitInfo: { hasGitDir: true, recentCommits: [] },
  }
}

function pnpmAuditOutput(critical: number, high: number): string {
  const advisories: Record<string, unknown> = {}
  let i = 0
  for (let c = 0; c < critical; c++) {
    advisories[String(++i)] = { id: i, title: `Critical vuln ${c}`, severity: 'critical', module_name: `pkg-${i}`, cves: [], findings: [] }
  }
  for (let h = 0; h < high; h++) {
    advisories[String(++i)] = { id: i, title: `High vuln ${h}`, severity: 'high', module_name: `pkg-${i}`, cves: [], findings: [] }
  }
  return JSON.stringify({
    metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high, critical, total: critical + high } },
    advisories,
  })
}

describe('checkDependencyVulnerabilities', () => {
  it('returns score 5 with 0 vulnerabilities', async () => {
    const runner: RunCommand = vi.fn().mockReturnValue(pnpmAuditOutput(0, 0))
    const { checkDependencyVulnerabilities } = createCliChecks(runner)
    const result = await checkDependencyVulnerabilities(makeCtx())
    expect(result.score).toBe(5)
    expect(result.findings).toHaveLength(0)
  })

  it('returns score 3 with high but no critical', async () => {
    const runner: RunCommand = vi.fn().mockReturnValue(pnpmAuditOutput(0, 3))
    const { checkDependencyVulnerabilities } = createCliChecks(runner)
    const result = await checkDependencyVulnerabilities(makeCtx())
    expect(result.score).toBe(3)
    expect(result.findings[0].severity).toBe('high')
  })

  it('returns score 1 with 1 critical vulnerability', async () => {
    const runner: RunCommand = vi.fn().mockReturnValue(pnpmAuditOutput(1, 2))
    const { checkDependencyVulnerabilities } = createCliChecks(runner)
    const result = await checkDependencyVulnerabilities(makeCtx())
    expect(result.score).toBe(1)
    expect(result.findings.some((f) => f.severity === 'critical')).toBe(true)
  })

  it('returns score null when pnpm audit fails completely', async () => {
    const runner: RunCommand = vi.fn().mockImplementation(() => { throw new Error('pnpm not found') })
    const { checkDependencyVulnerabilities } = createCliChecks(runner)
    const result = await checkDependencyVulnerabilities(makeCtx())
    expect(result.score).toBeNull()
    expect(result.automated).toBe(false)
  })
})

describe('checkNoSecretsInRepo', () => {
  it('returns score 5 when gitleaks finds no secrets', async () => {
    const runner: RunCommand = vi.fn().mockReturnValue('{"findings":[]}')
    const { checkNoSecretsInRepo } = createCliChecks(runner)
    const result = await checkNoSecretsInRepo(makeCtx())
    expect(result.score).toBe(5)
  })

  it('returns score null when gitleaks not installed', async () => {
    const runner: RunCommand = vi.fn().mockImplementation(() => { throw new Error('gitleaks: command not found') })
    const { checkNoSecretsInRepo } = createCliChecks(runner)
    const result = await checkNoSecretsInRepo(makeCtx())
    expect(result.score).toBeNull()
    expect(result.reason).toContain('not installed')
  })
})

describe('checkUnitTestCoverage', () => {
  it('returns score 5 when coverage >= 80%', async () => {
    const coverage = { total: { lines: { pct: 85 }, functions: { pct: 82 }, branches: { pct: 80 } } }
    const runner: RunCommand = vi.fn().mockReturnValue(JSON.stringify(coverage))
    const { checkUnitTestCoverage } = createCliChecks(runner)
    const result = await checkUnitTestCoverage(makeCtx())
    expect(result.score).toBe(5)
  })

  it('returns score 1 when coverage < 20%', async () => {
    const coverage = { total: { lines: { pct: 10 }, functions: { pct: 8 }, branches: { pct: 5 } } }
    const runner: RunCommand = vi.fn().mockReturnValue(JSON.stringify(coverage))
    const { checkUnitTestCoverage } = createCliChecks(runner)
    const result = await checkUnitTestCoverage(makeCtx())
    expect(result.score).toBe(1)
    expect(result.findings[0].severity).toBe('critical')
  })

  it('returns score null when coverage report not found', async () => {
    const runner: RunCommand = vi.fn().mockImplementation(() => { throw new Error('ENOENT') })
    const { checkUnitTestCoverage } = createCliChecks(runner)
    const result = await checkUnitTestCoverage(makeCtx())
    expect(result.score).toBeNull()
    expect(result.reason).toContain('not found')
  })
})
