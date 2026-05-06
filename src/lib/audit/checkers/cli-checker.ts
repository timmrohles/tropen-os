// src/lib/audit/checkers/cli-checker.ts
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'
import { resolveNodeCli } from '../utils/platform-utils'

export type RunCommand = (cmd: string, args: string[], cwd: string) => string
export type ReadFile = (path: string, encoding: BufferEncoding) => string
export type BinaryCheck = (name: string) => boolean

function defaultRunCommand(cmd: string, args: string[], cwd: string): string {
  const [execCmd, execArgs] = process.platform === 'win32'
    ? ['cmd.exe', ['/c', cmd, ...args]]
    : [cmd, args]
  return execFileSync(execCmd, execArgs, { cwd, timeout: 60_000, encoding: 'utf-8' })
}

function defaultReadFile(path: string, encoding: BufferEncoding): string {
  return readFileSync(path, encoding)
}

function nullResult(ruleId: string, reason: string): RuleResult {
  return { ruleId, score: null, reason, findings: [], automated: false }
}

function isBinaryAvailable(name: string): boolean {
  const result = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf-8' })
  return result.status === 0
}

function gitleaksInstallHint(): string {
  if (process.platform === 'win32') {
    return 'install via: winget install GitLeaks.GitLeaks  OR  scoop install gitleaks  OR  choco install gitleaks'
  }
  return 'install via: brew install gitleaks  OR  https://github.com/gitleaks/gitleaks#installing'
}

export function createCliChecks(runner: RunCommand = defaultRunCommand, readFile: ReadFile = defaultReadFile, binaryCheck: BinaryCheck = isBinaryAvailable) {
  async function checkDependencyVulnerabilities(ctx: AuditContext): Promise<RuleResult> {
    // Killer-Detektor — ADR-027 Schritt 3: CVSS >9 + patchbar + nur prod-deps = isKiller.
    // --prod excludiert devDependencies (kein Production-Risiko).
    // Strategie: docs/audit-reports/killer-detector-strategies-2026-05-04.md
    const pnpmBin = resolveNodeCli('pnpm', ctx.rootPath)
    let raw: string
    try {
      raw = runner(pnpmBin, ['audit', '--json', '--prod'], ctx.rootPath)
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
      cvss?: { score?: number; vectorString?: string } | null
      patched_versions?: string
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

    function isCvssKiller(adv: Advisory): boolean {
      const score = adv.cvss?.score ?? 0
      if (score <= 9.0) return false
      // Only patchable CVEs as Killer — unpatchable = no action path for user
      const patched = adv.patched_versions ?? ''
      return patched.length > 0 && patched !== '<0.0.0'
    }

    const findings: Finding[] = advisories
      .filter((a) => a.severity === 'critical' || a.severity === 'high' || a.severity === 'moderate')
      .map((a) => {
        const killer = isCvssKiller(a)
        const cvssScore = a.cvss?.score
        const suggestion = killer
          ? `🛑 Patch verfügbar in ${a.patched_versions} — update mit: pnpm update ${a.module_name ?? ''}`
          : a.url ? `See: ${a.url}` : 'Run pnpm update or pnpm audit fix'
        return {
          severity: (a.severity === 'critical' ? 'critical' : a.severity === 'high' ? 'high' : 'medium') as Finding['severity'],
          message: `[${a.module_name ?? 'unknown'}] ${a.title ?? 'Vulnerability'}${a.cves?.length ? ` (${a.cves[0]})` : ''}${cvssScore ? ` — CVSS ${cvssScore}` : ''}`,
          suggestion,
          ...(killer ? { isKiller: true } : {}),
        }
      })

    // ADR-027: killerCount no longer affects score — calculator excludes killer rules.
    const killerCount = findings.filter((f) => f.isKiller).length
    let score: number
    if (vulns.critical === 0 && vulns.high === 0 && vulns.total === 0) score = 5
    else if (vulns.critical === 0 && vulns.high === 0) score = 4
    else if (vulns.critical === 0 && vulns.high <= 3) score = 3
    else if (vulns.critical === 0) score = 2
    else score = 1

    return {
      ruleId: 'cat-3-rule-7',
      score,
      reason: `pnpm audit --prod: ${vulns.critical} critical, ${vulns.high} high, ${vulns.total} total${killerCount > 0 ? ` (${killerCount} Killer-CVEs CVSS>9 — excluded from Polish score)` : ''}`,
      findings,
      automated: true,
    }
  }

  async function checkNoSecretsInRepo(ctx: AuditContext): Promise<RuleResult> {
    if (!binaryCheck('gitleaks')) {
      return nullResult('cat-3-rule-3', `gitleaks not found — ${gitleaksInstallHint()}`)
    }

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
      if (n > 0) {
        findings.unshift({
          severity: 'critical' as const,
          message: `gitleaks: ${n} potential secret(s) found in repository — rotate immediately`,
        })
      }
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
      raw = readFile(join(ctx.rootPath, 'coverage', 'coverage-summary.json'), 'utf-8')
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

  // Production-Build-Check — ADR-027 Universal-Killer.
  // exit-code != 0 = Killer (App ist nicht deploybar).
  // CI=true: deterministisches Build-Verhalten, keine interaktiven Prompts.
  // NODE_OPTIONS via subprocess env — funktioniert cross-platform (kein Shell-Syntax).
  async function checkProductionBuild(ctx: AuditContext): Promise<RuleResult> {
    const pnpmBin = resolveNodeCli('pnpm', ctx.rootPath)
    const startTime = Date.now()
    // Use execFileSync directly (not runner) to pass custom env + timeout.
    // NODE_OPTIONS set via env object — cross-platform, avoids Windows shell syntax issue.
    const [execCmd, execArgs] = process.platform === 'win32'
      ? ['cmd.exe', ['/c', pnpmBin, 'build']]
      : [pnpmBin, ['build']]
    const buildEnv = { ...process.env, CI: 'true', NODE_OPTIONS: '--max-old-space-size=4096' }

    let output = ''
    let success = false
    try {
      output = execFileSync(execCmd, execArgs, {
        cwd: ctx.rootPath,
        timeout: 300_000, // 5 Min — Build kann auf langsamen Maschinen >3 Min dauern
        maxBuffer: 50 * 1024 * 1024,
        encoding: 'utf-8',
        env: buildEnv,
      })
      success = true
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string }
      output = (e.stdout ?? '') + (e.stderr ?? '') + (e.message ?? '')
    }

    const durationMs = Date.now() - startTime

    if (success) {
      return {
        ruleId: 'cat-3-rule-build',
        score: 5,
        reason: `Production build successful (${Math.round(durationMs / 1000)}s)`,
        findings: [],
        automated: true,
      }
    }

    // Extrahiere erste aussagekräftige Error-Zeile (kein riesiger Stacktrace)
    const errorSummary = extractBuildError(output)

    return {
      ruleId: 'cat-3-rule-build',
      score: 0,
      reason: `Production build failed — ${errorSummary}`,
      findings: [{
        severity: 'critical',
        isKiller: true,
        message: `Production-Build schlägt fehl: ${errorSummary}`,
        suggestion:
          '🛑 Stopper: Production-Build schlägt fehl. ' +
          'Eine nicht deploybare App kann nicht veröffentlicht werden. ' +
          '`pnpm build` lokal ausführen, alle Errors beheben, dann nochmal testen.',
        agentSource: 'security',
      }],
      automated: true,
    }
  }

  function extractBuildError(output: string): string {
    const patterns = [
      /error TS\d+: .{0,150}/,
      /Error: .{0,150}/,
      /Failed to compile[^\n]*/,
      /Module not found[^\n]*/,
      /Build failed[^\n]*/,
      /SyntaxError: .{0,150}/,
    ]
    for (const p of patterns) {
      const m = output.match(p)
      if (m) return m[0].trim()
    }
    return output.slice(-200).trim().replace(/\n/g, ' ') || 'Unknown build error'
  }

  return { checkDependencyVulnerabilities, checkNoSecretsInRepo, checkUnitTestCoverage, checkProductionBuild }
}

/** Default instance using real CLI tools */
export const cliChecks = createCliChecks()
