// src/lib/audit/checkers/cli-checker.ts
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'

export type RunCommand = (cmd: string, args: string[], cwd: string) => string

function defaultRunCommand(cmd: string, args: string[], cwd: string): string {
  return execFileSync(cmd, args, { cwd, timeout: 60_000, encoding: 'utf-8' })
}

function nullResult(ruleId: string, reason: string): RuleResult {
  return { ruleId, score: null, reason, findings: [], automated: false }
}

export function createCliChecks(runner: RunCommand = defaultRunCommand) {
  async function checkDependencyVulnerabilities(ctx: AuditContext): Promise<RuleResult> {
    let raw: string
    try {
      raw = runner('pnpm', ['audit', '--json'], ctx.rootPath)
    } catch (err: unknown) {
      // pnpm audit exits non-zero when vulnerabilities found — check if stdout was captured
      if (err && typeof err === 'object' && 'stdout' in err && typeof (err as { stdout: unknown }).stdout === 'string') {
        raw = (err as { stdout: string }).stdout
      } else {
        return nullResult('cat-3-rule-7', `Could not run pnpm audit: ${String(err)}`)
      }
    }

    let vulns: { critical: number; high: number; moderate: number; total: number }
    try {
      const parsed = JSON.parse(raw)
      vulns = parsed?.metadata?.vulnerabilities ?? { critical: 0, high: 0, moderate: 0, total: 0 }
    } catch {
      return nullResult('cat-3-rule-7', 'Could not parse pnpm audit JSON output')
    }

    const findings: Finding[] = []
    if (vulns.critical > 0) {
      findings.push({
        severity: 'critical',
        message: `${vulns.critical} critical vulnerability(ies) found`,
        suggestion: 'Run pnpm audit and update affected packages immediately',
      })
    }
    if (vulns.high > 0) {
      findings.push({ severity: 'high', message: `${vulns.high} high severity vulnerability(ies) found` })
    }

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
    let raw: string
    try {
      runner('gitleaks', ['detect', '--source', '.', '--no-git', '--report-format', 'json', '--report-path', reportPath], ctx.rootPath)
      // gitleaks exits 0 = no secrets found
      raw = '{"findings":[]}'
    } catch (err: unknown) {
      const msg = String((err as { message?: string }).message ?? err)
      if (msg.includes('command not found') || msg.includes('ENOENT') || msg.includes('not found')) {
        return nullResult('cat-3-rule-3', 'gitleaks not installed — install for secret scanning')
      }
      // gitleaks exits 1 when secrets found — try to read report
      try {
        raw = readFileSync(reportPath, 'utf-8')
      } catch {
        return nullResult('cat-3-rule-3', `gitleaks failed: ${msg}`)
      }
    }

    let parsed: { findings?: unknown[] }
    try {
      parsed = JSON.parse(raw)
    } catch {
      return nullResult('cat-3-rule-3', 'Could not parse gitleaks output')
    }

    const secretFindings = Array.isArray(parsed?.findings) ? parsed.findings : []
    if (secretFindings.length === 0) {
      return { ruleId: 'cat-3-rule-3', score: 5, reason: 'gitleaks found no secrets in repository', findings: [], automated: true }
    }
    return {
      ruleId: 'cat-3-rule-3',
      score: 0,
      reason: `gitleaks found ${secretFindings.length} potential secret(s) in repository`,
      findings: [{
        severity: 'critical',
        message: `${secretFindings.length} secret(s) detected by gitleaks`,
        suggestion: 'Run gitleaks locally to review and rotate exposed secrets',
      }],
      automated: true,
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
