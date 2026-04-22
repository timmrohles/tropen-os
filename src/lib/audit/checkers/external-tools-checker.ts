// src/lib/audit/checkers/external-tools-checker.ts
// Sprint 5c: Wraps external CLI tools (depcruise, lighthouse, bundle, eslint-detailed).
// All checks are graceful — null score if tool unavailable, never crashes the audit.

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { tmpdir } from 'node:os'
import type { AuditContext, RuleResult, Finding, AgentSource } from '../types'
import { createLogger } from '@/lib/logger'
import { platformCommand } from '../utils/platform-utils'

const log = createLogger('audit:external-tools')

// ── Helpers ──────────────────────────────────────────────────────────────────

function nullResult(ruleId: string, reason: string): RuleResult {
  return { ruleId, score: null, reason, findings: [], automated: false }
}

function run(cmd: string, args: string[], cwd: string, timeoutMs = 60_000): string | null {
  // On Windows, .cmd files cannot be executed directly by CreateProcessW —
  // cmd.exe /c is required. Use explicit cmd.exe invocation to avoid shell:true
  // (which concatenates args unsafely and triggers a Node.js deprecation warning).
  const [execCmd, execArgs] = process.platform === 'win32'
    ? ['cmd.exe', ['/c', cmd, ...args]]
    : [cmd, args]
  try {
    // stdio: pipe all streams — prevents stderr (e.g. chrome-launcher EPERM on Windows cleanup)
    // from bleeding through to the terminal. Captured stderr is available on error.stderr if needed.
    return execFileSync(execCmd, execArgs, { cwd, timeout: timeoutMs, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
  } catch (err: unknown) {
    // Many tools exit non-zero even with valid JSON output
    const e = err as { stdout?: unknown; code?: unknown; stderr?: unknown }
    if (e?.code === 'ENOENT') {
      log.warn(`Command '${cmd}' not found on PATH. On Windows, ensure pnpm is installed and accessible (scoped npm tools run via pnpm exec).`)
    }
    if (e?.stderr && typeof e.stderr === 'string' && e.stderr.trim()) {
      log.debug(`stderr from '${cmd}'`, { stderr: e.stderr.slice(0, 500) })
    }
    if (e?.stdout && typeof e.stdout === 'string' && e.stdout.trim()) return e.stdout
    return null
  }
}

function isAvailable(tool: string): boolean {
  const result = spawnSync(process.platform === 'win32' ? 'where' : 'which', [tool], { encoding: 'utf-8' })
  return result.status === 0
}

// ── 1. dependency-cruiser: circular deps ────────────────────────────────────

interface DepCruiseViolation {
  rule: { name: string; severity: string }
  from: string
  to: string
  cycle?: string[]
}

interface DepCruiseOutput {
  summary?: { violations?: DepCruiseViolation[]; error?: number; warn?: number }
}

export async function checkDepCruiserCycles(ctx: AuditContext): Promise<RuleResult> {
  const configPath = join(ctx.rootPath, '.dependency-cruiser.cjs')
  if (!existsSync(configPath)) {
    return nullResult('cat-1-rule-3', 'No .dependency-cruiser.cjs config found')
  }

  const raw = run(platformCommand('pnpm'), ['exec', 'depcruise', 'src', '--config', '.dependency-cruiser.cjs', '--output-type', 'json'], ctx.rootPath, 90_000)
  if (!raw) return nullResult('cat-1-rule-3', 'dependency-cruiser failed to run')

  let parsed: DepCruiseOutput
  try { parsed = JSON.parse(raw) } catch {
    return nullResult('cat-1-rule-3', 'Could not parse dependency-cruiser JSON output')
  }

  const violations = parsed?.summary?.violations ?? []
  const cycles = violations.filter((v) => v.rule?.name === 'no-circular' || v.cycle?.length)
  const forbidden = violations.filter((v) => v.rule?.severity === 'error' && !v.cycle?.length)

  const findings: Finding[] = cycles.map((v) => {
    const cyclePath = v.cycle?.length
      ? v.cycle.map((p) => relative(ctx.rootPath, p)).join(' → ')
      : `${relative(ctx.rootPath, v.from)} → ${relative(ctx.rootPath, v.to)}`
    return {
      severity: 'high' as const,
      message: `Circular: ${cyclePath}`,
      filePath: relative(ctx.rootPath, v.from),
      suggestion: 'Refactor to break the cycle — extract shared types or invert the dependency',
      agentSource: 'architecture' as AgentSource,
    }
  })

  findings.push(...forbidden.map((v) => ({
    severity: 'medium' as const,
    message: `Forbidden import: ${relative(ctx.rootPath, v.from)} → ${relative(ctx.rootPath, v.to)} (rule: ${v.rule.name})`,
    filePath: relative(ctx.rootPath, v.from),
    agentSource: 'architecture' as AgentSource,
  })))

  const n = cycles.length
  const score = n === 0 ? 5 : n <= 2 ? 3 : n <= 5 ? 2 : 1
  const total = findings.length

  if (total > 0) {
    findings.unshift({
      severity: n > 0 ? 'high' : 'medium',
      message: `dependency-cruiser: ${n} circular dep(s), ${forbidden.length} forbidden import(s) (${total} issues found)`,
      agentSource: 'architecture' as AgentSource,
    })
  }

  return {
    ruleId: 'cat-1-rule-3',
    score,
    reason: `dependency-cruiser: ${n} circular dep(s), ${forbidden.length} forbidden import(s)`,
    findings,
    automated: true,
  }
}

// ── 2. Lighthouse (perf + a11y + best-practices + seo) ──────────────────────

interface LighthouseAuditRef { id: string; weight?: number; group?: string }
interface LighthouseCategory { score: number | null; title: string; auditRefs?: LighthouseAuditRef[] }
interface LighthouseAuditResult { score: number | null; title: string; description?: string; displayValue?: string }
interface LighthouseReport {
  categories: Record<string, LighthouseCategory>
  audits: Record<string, LighthouseAuditResult>
}

type LhCategoryKey = 'performance' | 'accessibility' | 'best-practices' | 'seo'

function lhScoreToAudit(lhScore: number): number {
  const pct = lhScore * 100
  if (pct >= 90) return 5
  if (pct >= 70) return 4
  if (pct >= 50) return 3
  if (pct >= 30) return 2
  return 1
}

/** Extracts one Finding per failing audit ref in a Lighthouse category. */
function extractLighthouseFindings(
  report: LighthouseReport,
  categoryKey: LhCategoryKey,
  agentSrc: AgentSource,
): Finding[] {
  const category = report.categories[categoryKey]
  if (!category?.auditRefs) return []

  const findings: Finding[] = []
  for (const ref of category.auditRefs) {
    const audit = report.audits[ref.id]
    if (!audit || audit.score === null || audit.score >= 1) continue
    const firstSentence = audit.description
      ? audit.description.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').split(/\.\s/)[0].replace(/\.$/, '')
      : undefined
    findings.push({
      severity: audit.score === 0 ? 'high' : 'medium',
      message: audit.displayValue ? `${audit.title} — ${audit.displayValue}` : audit.title,
      suggestion: firstSentence,
      agentSource: agentSrc,
      agentRuleId: `lighthouse-${categoryKey}-${ref.id}`,
    })
  }
  return findings
}

async function runLighthouse(ctx: AuditContext): Promise<LighthouseReport | null> {
  const url = ctx.externalTools?.lighthouseUrl
  if (!url) return null

  const outPath = join(tmpdir(), `lh-audit-${Date.now()}.json`)
  const raw = run(platformCommand('pnpm'), [
    'exec', 'lighthouse', url,
    '--output', 'json', `--output-path=${outPath}`,
    '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
    '--quiet', '--only-categories=performance,accessibility,best-practices,seo',
  ], ctx.rootPath, 120_000)

  // lighthouse writes the file directly; raw may be empty
  const content = existsSync(outPath) ? readFileSync(outPath, 'utf-8') : raw
  if (!content) return null

  try { return JSON.parse(content) as LighthouseReport } catch { return null }
}

// Shared lighthouse report for a single audit run
const _lhCache = new WeakMap<AuditContext, Promise<LighthouseReport | null>>()
function getLighthouseReport(ctx: AuditContext): Promise<LighthouseReport | null> {
  if (!_lhCache.has(ctx)) _lhCache.set(ctx, runLighthouse(ctx))
  return _lhCache.get(ctx)!
}

export async function checkLighthousePerf(ctx: AuditContext): Promise<RuleResult> {
  if (!ctx.externalTools?.lighthouseUrl) {
    return nullResult('cat-7-rule-1', 'Lighthouse skipped — no --lighthouse-url provided')
  }
  const report = await getLighthouseReport(ctx)
  if (!report) return nullResult('cat-7-rule-1', 'Lighthouse failed to run or returned no data')

  const lhScore = report.categories?.performance?.score ?? null
  if (lhScore === null) return nullResult('cat-7-rule-1', 'Lighthouse: no performance score in report')

  const agentSrc: AgentSource = 'lighthouse-performance'
  const granular = extractLighthouseFindings(report, 'performance', agentSrc)
  // Only include granular findings — the summary score lives in `reason` and surfaces in the
  // category breakdown. A summary card duplicates the list and isn't actionable on its own.
  const findings: Finding[] = lhScore < 0.9 ? granular : []

  return { ruleId: 'cat-7-rule-1', score: lhScoreToAudit(lhScore), reason: `Lighthouse Performance: ${Math.round(lhScore * 100)}/100`, findings, automated: true }
}

export async function checkLighthouseA11y(ctx: AuditContext): Promise<RuleResult> {
  if (!ctx.externalTools?.lighthouseUrl) {
    return nullResult('cat-16-rule-1', 'Lighthouse skipped — no --lighthouse-url provided')
  }
  const report = await getLighthouseReport(ctx)
  if (!report) return nullResult('cat-16-rule-1', 'Lighthouse failed to run or returned no data')

  const lhScore = report.categories?.accessibility?.score ?? null
  if (lhScore === null) return nullResult('cat-16-rule-1', 'Lighthouse: no accessibility score in report')

  const agentSrc: AgentSource = 'lighthouse-accessibility'
  const granular = extractLighthouseFindings(report, 'accessibility', agentSrc)
  const score = lhScore >= 0.9 ? 5 : lhScore >= 0.7 ? 4 : lhScore >= 0.5 ? 3 : 1
  const findings: Finding[] = lhScore < 0.9 ? granular : []

  return { ruleId: 'cat-16-rule-1', score, reason: `Lighthouse Accessibility: ${Math.round(lhScore * 100)}/100`, findings, automated: true }
}

export async function checkLighthouseBestPractices(ctx: AuditContext): Promise<RuleResult> {
  if (!ctx.externalTools?.lighthouseUrl) {
    return nullResult('cat-2-rule-11', 'Lighthouse skipped — no --lighthouse-url provided')
  }
  const report = await getLighthouseReport(ctx)
  if (!report) return nullResult('cat-2-rule-11', 'Lighthouse failed to run or returned no data')

  const lhScore = report.categories?.['best-practices']?.score ?? null
  if (lhScore === null) return nullResult('cat-2-rule-11', 'Lighthouse: no best-practices score in report')

  const agentSrc: AgentSource = 'lighthouse-best-practices'
  const granular = extractLighthouseFindings(report, 'best-practices', agentSrc)
  const findings: Finding[] = lhScore < 0.9 ? granular : []

  return { ruleId: 'cat-2-rule-11', score: lhScoreToAudit(lhScore), reason: `Lighthouse Best Practices: ${Math.round(lhScore * 100)}/100`, findings, automated: true }
}

export async function checkLighthouseSeo(ctx: AuditContext): Promise<RuleResult> {
  if (!ctx.externalTools?.lighthouseUrl) {
    return nullResult('cat-18-rule-5', 'Lighthouse skipped — no --lighthouse-url provided')
  }
  const report = await getLighthouseReport(ctx)
  if (!report) return nullResult('cat-18-rule-5', 'Lighthouse failed to run or returned no data')

  const lhScore = report.categories?.seo?.score ?? null
  if (lhScore === null) return nullResult('cat-18-rule-5', 'Lighthouse: no SEO score in report')

  const agentSrc: AgentSource = 'lighthouse-seo'
  const granular = extractLighthouseFindings(report, 'seo', agentSrc)
  const findings: Finding[] = lhScore < 0.9 ? granular : []

  return { ruleId: 'cat-18-rule-5', score: lhScoreToAudit(lhScore), reason: `Lighthouse SEO: ${Math.round(lhScore * 100)}/100`, findings, automated: true }
}

// ── 3. Bundle size from .next/static/chunks/ ────────────────────────────────

function sumDirSizeKb(dir: string): number {
  if (!existsSync(dir)) return 0
  let total = 0
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    try {
      const s = statSync(full)
      if (s.isFile() && name.endsWith('.js')) total += s.size
    } catch { /* ignore */ }
  }
  return Math.round(total / 1024)
}

export async function checkBundleSizes(ctx: AuditContext): Promise<RuleResult> {
  const chunksDir = join(ctx.rootPath, '.next', 'static', 'chunks')
  if (!existsSync(chunksDir)) {
    return nullResult('cat-7-rule-2', 'No .next/static/chunks/ found — run next build first')
  }

  // Only measure chunks that are always loaded on first page visit.
  // Route chunks, lazy-loaded splits, and server chunks are excluded —
  // they inflate totals for large apps without affecting initial load time.
  const INITIAL_CHUNK_PREFIXES = ['framework-', 'main-', 'polyfills-', 'webpack-']
  let totalBytes = 0
  for (const name of readdirSync(chunksDir)) {
    if (!name.endsWith('.js')) continue
    if (!INITIAL_CHUNK_PREFIXES.some((prefix) => name.startsWith(prefix))) continue
    try {
      totalBytes += statSync(join(chunksDir, name)).size
    } catch { /* ignore */ }
  }
  const totalKb = Math.round(totalBytes / 1024)

  const score = totalKb < 200 ? 5 : totalKb < 400 ? 4 : totalKb < 600 ? 3 : totalKb < 1024 ? 2 : 1
  const findings: Finding[] = totalKb >= 400
    ? [{ severity: totalKb >= 1024 ? 'high' : 'medium', message: `Initial client JS: ${totalKb} KB (target: < 400 KB)`, suggestion: 'Use dynamic imports and tree-shaking to reduce bundle size', agentSource: 'performance' as AgentSource }]
    : []

  return { ruleId: 'cat-7-rule-2', score, reason: `Initial client JS: ${totalKb} KB (framework + main + polyfills + webpack)`, findings, automated: true }
}

// ── 4. ESLint detailed (per-violation findings) ───────────────────────────────

interface EslintMessage { ruleId: string | null; severity: number; message: string; line: number; column: number }
interface EslintFileResult { filePath: string; messages: EslintMessage[] }

function eslintAgentSource(ruleId: string): AgentSource {
  if (ruleId.startsWith('jsx-a11y/')) return 'accessibility'
  if (ruleId.startsWith('boundaries/')) return 'architecture'
  if (ruleId.startsWith('sonarjs/')) return 'code-style'
  if (ruleId.startsWith('@typescript-eslint/')) return 'code-style'
  return 'code-style'
}

export async function checkEslintDetailed(ctx: AuditContext): Promise<RuleResult> {
  const raw = run(platformCommand('pnpm'), ['exec', 'eslint', 'src', '--format', 'json', '--max-warnings', '9999'], ctx.rootPath, 90_000)
  if (!raw) return nullResult('cat-2-rule-9', 'ESLint failed to run or produced no output')

  let results: EslintFileResult[]
  try { results = JSON.parse(raw) } catch {
    return nullResult('cat-2-rule-9', 'Could not parse ESLint JSON output')
  }

  const findings: Finding[] = []
  let errorCount = 0
  let warnCount = 0

  for (const file of results) {
    for (const msg of file.messages) {
      if (!msg.ruleId) continue
      if (msg.severity === 2) errorCount++
      else warnCount++
      findings.push({
        severity: msg.severity === 2 ? 'high' : 'low',
        message: `[${msg.ruleId}] ${msg.message}`,
        filePath: relative(ctx.rootPath, file.filePath),
        line: msg.line,
        agentSource: eslintAgentSource(msg.ruleId),
      })
    }
  }

  const score = errorCount === 0 && warnCount === 0 ? 5
    : errorCount === 0 && warnCount <= 10 ? 4
    : errorCount === 0 ? 3
    : errorCount <= 5 ? 2 : 1

  const capped = findings.slice(0, 50) // cap individual findings at 50
  const total = errorCount + warnCount
  if (total > 0) {
    capped.unshift({
      severity: errorCount > 0 ? 'high' : 'low',
      message: `ESLint: ${errorCount} error(s), ${warnCount} warning(s) (${total} issues found)`,
      agentSource: 'code-style' as AgentSource,
    })
  }

  return {
    ruleId: 'cat-2-rule-9',
    score,
    reason: `ESLint: ${errorCount} errors, ${warnCount} warnings`,
    findings: capped,
    automated: true,
  }
}

// ── 5. npm / pnpm audit (granular per-advisory findings) ─────────────────────

interface PnpmAdvisory {
  id?: number
  module_name?: string
  severity?: string
  title?: string
  url?: string
  recommendation?: string
  cves?: string[]
  findings?: { version?: string; paths?: string[] }[]
}

interface PnpmAuditOutput {
  advisories?: Record<string, PnpmAdvisory>
  metadata?: {
    vulnerabilities?: { critical?: number; high?: number; moderate?: number; low?: number; total?: number }
  }
}

export async function checkNpmAudit(ctx: AuditContext): Promise<RuleResult> {
  const raw = run(platformCommand('pnpm'), ['audit', '--json'], ctx.rootPath, 90_000)
  if (!raw) return nullResult('cat-3-rule-7', 'pnpm audit failed to run or produced no output')

  let parsed: PnpmAuditOutput
  try { parsed = JSON.parse(raw) } catch {
    return nullResult('cat-3-rule-7', 'Could not parse pnpm audit JSON output')
  }

  const vulns = parsed?.metadata?.vulnerabilities ?? {}
  const critical = vulns.critical ?? 0
  const high = vulns.high ?? 0
  const moderate = vulns.moderate ?? 0
  const low = vulns.low ?? 0
  const total = vulns.total ?? 0

  const advisories = Object.values(parsed?.advisories ?? {}) as PnpmAdvisory[]

  const findings: Finding[] = advisories
    .filter((a) => a.severity === 'critical' || a.severity === 'high' || a.severity === 'moderate' || a.severity === 'low')
    .map((a) => {
      const version = a.findings?.[0]?.version ?? 'unknown'
      const cveStr = a.cves?.length ? `CVE: ${a.cves.join(', ')}. ` : ''
      const fixCmd = a.module_name ? `Run: pnpm update ${a.module_name}` : ''
      return {
        severity: (
          a.severity === 'critical' ? 'critical'
          : a.severity === 'high' ? 'high'
          : a.severity === 'moderate' ? 'medium'
          : 'low'
        ) as Finding['severity'],
        message: `${a.module_name ?? 'unknown'} ${version} — ${a.title ?? 'Vulnerability'}`,
        filePath: 'package.json',
        suggestion: `${cveStr}${a.recommendation ?? ''}. ${fixCmd}`.trim().replace(/^\./, '').trim(),
        agentSource: 'npm-audit' as AgentSource,
        agentRuleId: `npm-audit-${a.id ?? a.module_name}`,
      }
    })

  const score = critical === 0 && high === 0 && total === 0 ? 5
    : critical === 0 && high === 0 ? 4
    : critical === 0 && high <= 3 ? 3
    : critical === 0 ? 2
    : 1

  if (total > 0) {
    findings.unshift({
      severity: critical > 0 ? 'critical' : high > 0 ? 'high' : 'medium',
      message: `npm audit: ${total} vulnerability(s) (${critical} critical, ${high} high, ${moderate} moderate, ${low} low)`,
      filePath: 'package.json',
      agentSource: 'npm-audit' as AgentSource,
    })
  }

  return {
    ruleId: 'cat-3-rule-7',
    score,
    reason: `pnpm audit: ${critical} critical, ${high} high, ${moderate} moderate, ${total} total`,
    findings,
    automated: true,
  }
}
