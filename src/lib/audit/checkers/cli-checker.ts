// src/lib/audit/checkers/cli-checker.ts
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'

export type RunCommand = (cmd: string, args: string[], cwd: string) => string

function defaultRunCommand(cmd: string, args: string[], cwd: string): string {
  return execFileSync(cmd, args, { cwd, timeout: 60_000, encoding: 'utf-8' })
}

/**
 * Resolve the full path to the pnpm binary so the checker does not depend on
 * pnpm being in the server process PATH (which is often not the case when
 * Next.js is launched by an IDE or CI runner).
 *
 * Resolution order:
 *  1. Local node_modules/.bin/pnpm(.cmd) — most reliable, pinned to the
 *     project's own pnpm version
 *  2. Common Windows global locations (%APPDATA%\npm, %LOCALAPPDATA%\pnpm)
 *  3. Plain "pnpm(.cmd)" as last-resort fallback
 */
function resolvePnpmBin(rootPath: string): string {
  const ext = process.platform === 'win32' ? '.cmd' : ''
  const local = join(rootPath, 'node_modules', '.bin', `pnpm${ext}`)
  if (existsSync(local)) return local

  if (process.platform === 'win32') {
    const dirs = [process.env.APPDATA, process.env.LOCALAPPDATA].filter(Boolean) as string[]
    for (const dir of dirs) {
      for (const sub of ['npm', 'pnpm']) {
        const candidate = join(dir, sub, `pnpm${ext}`)
        if (existsSync(candidate)) return candidate
      }
    }
  }

  return `pnpm${ext}`
}

function nullResult(ruleId: string, reason: string): RuleResult {
  return { ruleId, score: null, reason, findings: [], automated: false }
}

export function createCliChecks(runner: RunCommand = defaultRunCommand) {
  async function checkDependencyVulnerabilities(ctx: AuditContext): Promise<RuleResult> {
    const pnpmBin = resolvePnpmBin(ctx.rootPath)
    let raw: string
    try {
      raw = runner(pnpmBin, ['audit', '--json'], ctx.rootPath)
    } catch (err: unknown) {
      // pnpm audit exits non-zero when vulnerabilities found — check if stdout was captured
      if (err && typeof err === 'object' && 'stdout' in err && typeof (err as { stdout: unknown }).stdout === 'string') {
        raw = (err as { stdout: string }).stdout
      } else {
        return nullResult('cat-3-rule-7', `Could not run pnpm audit: ${String(err)}`)
      }
    }

    interface Advisory {
      id?: number; title?: string; severity?: string; module_name?: string
      cves?: string[]; url?: string; findings?: { paths?: string[] }[]
    }
    let vulns: { critical: number; high: number; moderate: number; total: number }
    let advisories: Advisory[] = []
    try {
      const parsed = JSON.parse(raw)
      vulns = parsed?.metadata?.vulnerabilities ?? { critical: 0, high: 0, moderate: 0, total: 0 }
      advisories = Object.values(parsed?.advisories ?? {}) as Advisory[]
    } catch {
      return nullResult('cat-3-rule-7', 'Could not parse pnpm audit JSON output')
    }

    const findings: Finding[] = advisories
      .filter((a) => a.severity === 'critical' || a.severity === 'high' || a.severity === 'moderate')
      .map((a) => ({
        severity: (a.severity === 'critical' ? 'critical' : a.severity === 'high' ? 'high' : 'medium') as Finding['severity'],
        message: `[${a.module_name ?? 'unknown'}] ${a.title ?? 'Vulnerability'}${a.cves?.length ? ` (${a.cves[0]})` : ''}`,
        suggestion: a.url ? `See: ${a.url}` : 'Run pnpm audit fix or update the affected package',
      }))

    let score: number
    if (vulns.critical === 0 && vulns.high === 0 && vulns.total === 0) score = 5
    else if (vulns.critical === 0 && vulns.high === 0) score = 4
    else if (vulns.critical === 0 && vulns.high <= 3) score = 3
    else if (vulns.critical === 0) score = 2
    else score = 1

    return {
      ruleId: 'cat-3-rule-7',
      score,
      reason: `pnpm audit: ${vulns.critical} critical, ${vulns.high} high, ${vulns.total} total`,
      findings,
      automated: true,
    }
  }

  async function checkNoSecretsInRepo(ctx: AuditContext): Promise<RuleResult> {
    const reportPath = join(ctx.rootPath, '.gitleaks-report.json')
    const deepScan = ctx.externalTools?.deepSecretsScan ?? false
    const gitleaksArgs = deepScan
      ? ['detect', '--source', '.', '--report-format', 'json', '--report-path', reportPath]
      : ['detect', '--source', '.', '--no-git', '--report-format', 'json', '--report-path', reportPath]

    try {
      runner('gitleaks', gitleaksArgs, ctx.rootPath)
      // gitleaks exits 0 = no secrets found
      return { ruleId: 'cat-3-rule-3', score: 5, reason: 'gitleaks found no secrets in repository', findings: [], automated: true }
    } catch (err: unknown) {
      const msg = String((err as { message?: string }).message ?? err)
      if (msg.includes('command not found') || msg.includes('ENOENT') || msg.includes('not found')) {
        return nullResult('cat-3-rule-3', 'gitleaks not installed — install for secret scanning')
      }
      // gitleaks exits 1 when secrets found — read report file
      let reportRaw: string
      try {
        reportRaw = readFileSync(reportPath, 'utf-8')
      } catch {
        return nullResult('cat-3-rule-3', `gitleaks failed: ${msg}`)
      }

      // gitleaks v8+ outputs a flat JSON array; older versions wrap in {findings:[]}
      let leaks: unknown[]
      try {
        const parsed = JSON.parse(reportRaw)
        leaks = Array.isArray(parsed) ? parsed : (parsed?.findings ?? [])
      } catch {
        return nullResult('cat-3-rule-3', 'Could not parse gitleaks output')
      }

      const findings: Finding[] = leaks.slice(0, 20).map((leak) => {
        const l = leak as { File?: string; StartLine?: number; Description?: string; RuleID?: string }
        return {
          severity: 'critical' as const,
          message: `Secret detected: ${l.Description ?? l.RuleID ?? 'unknown rule'}`,
          filePath: l.File,
          line: l.StartLine,
          suggestion: 'Rotate this secret immediately and remove from code/history',
        }
      })

      const n = leaks.length
      const score = n === 0 ? 5 : n <= 2 ? 3 : n <= 5 ? 1 : 0
      return {
        ruleId: 'cat-3-rule-3',
        score,
        reason: `gitleaks found ${n} potential secret(s) in repository`,
        findings,
        automated: true,
      }
    }
  }

  async function checkUnitTestCoverage(ctx: AuditContext): Promise<RuleResult> {
    let raw: string
    try {
      raw = runner('cat', [join(ctx.rootPath, 'coverage', 'coverage-summary.json')], ctx.rootPath)
    } catch {
      return nullResult('cat-10-rule-1', 'Coverage report not found — run pnpm test --coverage first')
    }

    let parsed: { total: { lines: { pct: number }; functions: { pct: number }; branches: { pct: number } } }
    try {
      parsed = JSON.parse(raw)
    } catch {
      return nullResult('cat-10-rule-1', 'Could not parse coverage-summary.json')
    }

    const lines = parsed?.total?.lines?.pct ?? 0
    const functions = parsed?.total?.functions?.pct ?? 0
    const branches = parsed?.total?.branches?.pct ?? 0
    const minCoverage = Math.min(lines, functions, branches)

    let score: number
    if (minCoverage >= 80) score = 5
    else if (minCoverage >= 60) score = 4
    else if (minCoverage >= 40) score = 3
    else if (minCoverage >= 20) score = 2
    else score = 1

    const findings: Finding[] = []
    if (minCoverage < 80) {
      const severity = minCoverage < 20 ? 'critical' : minCoverage < 40 ? 'high' : 'medium'
      findings.push({
        severity,
        message: `Test coverage below 80%: lines=${lines}%, functions=${functions}%, branches=${branches}%`,
        suggestion: 'Add unit tests to reach >= 80% coverage on business logic',
      })
    }

    return {
      ruleId: 'cat-10-rule-1',
      score,
      reason: `Unit test coverage: lines=${lines}%, functions=${functions}%, branches=${branches}%`,
      findings,
      automated: true,
    }
  }

  return { checkDependencyVulnerabilities, checkNoSecretsInRepo, checkUnitTestCoverage }
}

/** Default instance using real CLI tools */
export const cliChecks = createCliChecks()
