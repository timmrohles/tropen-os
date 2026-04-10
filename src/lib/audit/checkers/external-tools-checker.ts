// src/lib/audit/checkers/external-tools-checker.ts
// Sprint 5c: Wraps external CLI tools (depcruise, lighthouse, bundle, eslint-detailed).
// All checks are graceful — null score if tool unavailable, never crashes the audit.

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { tmpdir } from 'node:os'
import type { AuditContext, RuleResult, Finding, AgentSource } from '../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function nullResult(ruleId: string, reason: string): RuleResult {
  return { ruleId, score: null, reason, findings: [], automated: false }
}

function run(cmd: string, args: string[], cwd: string, timeoutMs = 60_000): string | null {
  try {
    return execFileSync(cmd, args, { cwd, timeout: timeoutMs, encoding: 'utf-8' })
  } catch (err: unknown) {
    // Many tools exit non-zero even with valid JSON output
    const e = err as { stdout?: unknown }
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

  const raw = run('pnpm', ['exec', 'depcruise', 'src', '--config', '.dependency-cruiser.cjs', '--output-type', 'json'], ctx.rootPath, 90_000)
  if (!raw) return nullResult('cat-1-rule-3', 'dependency-cruiser failed to run')

  let parsed: DepCruiseOutput
  try { parsed = JSON.parse(raw) } catch {
    return nullResult('cat-1-rule-3', 'Could not parse dependency-cruiser JSON output')
  }

  const violations = parsed?.summary?.violations ?? []
  const cycles = violations.filter((v) => v.rule?.name === 'no-circular' || v.cycle?.length)
  const forbidden = violations.filter((v) => v.rule?.severity === 'error' && !v.cycle?.length)

  const findings: Finding[] = cycles.map((v) => ({
    severity: 'high' as const,
    message: `Circular dependency: ${relative(ctx.rootPath, v.from)} ↔ ${relative(ctx.rootPath, v.to)}`,
    filePath: relative(ctx.rootPath, v.from),
    suggestion: 'Refactor to break the cycle — extract shared types or invert the dependency',
    agentSource: 'architecture' as AgentSource,
  }))

  findings.push(...forbidden.map((v) => ({
    severity: 'medium' as const,
    message: `Forbidden import: ${relative(ctx.rootPath, v.from)} → ${relative(ctx.rootPath, v.to)} (rule: ${v.rule.name})`,
    filePath: relative(ctx.rootPath, v.from),
    agentSource: 'architecture' as AgentSource,
  })))

  const n = cycles.length
  const score = n === 0 ? 5 : n <= 2 ? 3 : n <= 5 ? 2 : 1

  return {
    ruleId: 'cat-1-rule-3',
    score,
    reason: `dependency-cruiser: ${n} circular dep(s), ${forbidden.length} forbidden import(s)`,
    findings,
    automated: true,
  }
}

// ── 2. Lighthouse (perf + a11y) ──────────────────────────────────────────────

interface LighthouseCategory { score: number | null; title: string }
interface LighthouseAuditResult { score: number | null; title: string; description?: string }
interface LighthouseReport {
  categories: Record<string, LighthouseCategory>
  audits: Record<string, LighthouseAuditResult>
}

function lhScoreToAudit(lhScore: number): number {
  const pct = lhScore * 100
  if (pct >= 90) return 5
  if (pct >= 70) return 4
  if (pct >= 50) return 3
  if (pct >= 30) return 2
  return 1
}

async function runLighthouse(ctx: AuditContext): Promise<LighthouseReport | null> {
  const url = ctx.externalTools?.lighthouseUrl
  if (!url) return null

  const outPath = join(tmpdir(), `lh-audit-${Date.now()}.json`)
  const raw = run('pnpm', [
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

  const score = lhScoreToAudit(lhScore)
  const findings: Finding[] = lhScore < 0.9
    ? [{ severity: lhScore < 0.5 ? 'high' : 'medium', message: `Lighthouse Performance: ${Math.round(lhScore * 100)}/100 (target: 90+)`, agentSource: 'performance' as AgentSource }]
    : []

  return { ruleId: 'cat-7-rule-1', score, reason: `Lighthouse Performance: ${Math.round(lhScore * 100)}/100`, findings, automated: true }
}

export async function checkLighthouseA11y(ctx: AuditContext): Promise<RuleResult> {
  if (!ctx.externalTools?.lighthouseUrl) {
    return nullResult('cat-16-rule-1', 'Lighthouse skipped — no --lighthouse-url provided')
  }
  const report = await getLighthouseReport(ctx)
  if (!report) return nullResult('cat-16-rule-1', 'Lighthouse failed to run or returned no data')

  const lhScore = report.categories?.accessibility?.score ?? null
  if (lhScore === null) return nullResult('cat-16-rule-1', 'Lighthouse: no accessibility score in report')

  const score = lhScore >= 0.9 ? 5 : lhScore >= 0.7 ? 4 : lhScore >= 0.5 ? 3 : 1
  const findings: Finding[] = lhScore < 0.9
    ? [{ severity: lhScore < 0.5 ? 'high' : 'medium', message: `Lighthouse Accessibility: ${Math.round(lhScore * 100)}/100 (target: 90+)`, agentSource: 'accessibility' as AgentSource }]
    : []

  return { ruleId: 'cat-16-rule-1', score, reason: `Lighthouse Accessibility: ${Math.round(lhScore * 100)}/100`, findings, automated: true }
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

  const totalKb = sumDirSizeKb(chunksDir)
  const score = totalKb < 200 ? 5 : totalKb < 400 ? 4 : totalKb < 600 ? 3 : totalKb < 1024 ? 2 : 1
  const findings: Finding[] = totalKb >= 400
    ? [{ severity: totalKb >= 1024 ? 'high' : 'medium', message: `Total JS chunks: ${totalKb} KB (target: < 400 KB)`, suggestion: 'Use dynamic imports and tree-shaking to reduce bundle size', agentSource: 'performance' as AgentSource }]
    : []

  return { ruleId: 'cat-7-rule-2', score, reason: `Bundle size: ${totalKb} KB (JS chunks in .next/static/chunks/)`, findings, automated: true }
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
  const raw = run('pnpm', ['exec', 'eslint', 'src', '--format', 'json', '--max-warnings', '9999'], ctx.rootPath, 90_000)
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

  return {
    ruleId: 'cat-2-rule-9',
    score,
    reason: `ESLint: ${errorCount} errors, ${warnCount} warnings`,
    findings: findings.slice(0, 50), // cap at 50 to avoid huge reports
    automated: true,
  }
}
