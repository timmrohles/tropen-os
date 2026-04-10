// src/lib/audit/checkers/agent-observability-checker.ts
// Observability Agent v3 — automated checks for R1, R4, R7, R8
import * as fs from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'

function pass(ruleId: string, score: number, reason: string): RuleResult {
  return { ruleId, score, reason, findings: [], automated: true }
}
function fail(ruleId: string, score: number, reason: string, findings: Finding[] = []): RuleResult {
  return { ruleId, score, reason, findings, automated: true }
}

// R1 — No raw console.* in application code (more granular than existing checkLoggerAbstraction)
export async function checkConsoleLogs(ctx: AuditContext): Promise<RuleResult> {
  const appFiles = ctx.repoMap.files.filter(
    (f) => (f.path.startsWith('src/app/') || f.path.startsWith('src/lib/')
      || f.path.startsWith('src/components/') || f.path.startsWith('src/hooks/'))
      && !f.path.includes('.test.') && !f.path.includes('.spec.')
      && !f.path.includes('/scripts/')
  )

  const violations: Finding[] = []
  for (const f of appFiles) {
    let content = ''
    try { content = fs.readFileSync(join(ctx.rootPath, f.path), 'utf-8') } catch { continue }
    const calls = (content.match(/console\.(log|warn|error|debug|info)\s*\(/g) ?? []).length
    if (calls > 0) {
      violations.push({
        severity: calls > 5 ? 'high' as const : 'medium' as const,
        message: `${calls} console.* call(s) in ${f.path}`,
        filePath: f.path,
        suggestion: 'Replace with createLogger(scope) from @/lib/logger for structured logging',
      })
    }
  }

  if (violations.length === 0) return pass('cat-12-rule-6', 5, 'No console.* calls in application code')
  const score = violations.length <= 3 ? 4 : violations.length <= 10 ? 3 : violations.length <= 20 ? 2 : 1
  return fail('cat-12-rule-6', score,
    `${violations.length} file(s) with raw console.* calls`, violations.slice(0, 15))
}

// R4 — Trace / request IDs in middleware
export async function checkTraceIds(ctx: AuditContext): Promise<RuleResult> {
  const candidates = [
    join(ctx.rootPath, 'src', 'middleware.ts'),
    join(ctx.rootPath, 'middleware.ts'),
    join(ctx.rootPath, 'src', 'proxy.ts'),
    join(ctx.rootPath, 'src', 'lib', 'middleware.ts'),
  ]
  const traceKeywords = ['x-request-id', 'trace_id', 'requestid', 'traceparent', 'traceid', 'correlationid']

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue
    try {
      const content = fs.readFileSync(candidate, 'utf-8').toLowerCase()
      if (traceKeywords.some((k) => content.includes(k))) {
        const rel = candidate.replace(ctx.rootPath + '/', '').replace(ctx.rootPath + '\\', '')
        return pass('cat-12-rule-7', 5, `Trace/request ID pattern found in ${rel}`)
      }
    } catch { continue }
  }

  return fail('cat-12-rule-7', 0, 'No trace/request ID found in middleware', [{
    severity: 'medium',
    message: 'No trace ID (x-request-id, traceparent, requestId) propagated from middleware',
    suggestion: 'Generate and attach x-request-id in middleware.ts for request correlation across logs',
  }])
}

// R8 — No PII field names in logger calls
export async function checkPiiInLogs(ctx: AuditContext): Promise<RuleResult> {
  const piiFields = ['email', 'password', 'token', 'secret', 'ssn', 'credit_card', 'phone', 'address']
  const logFiles = ctx.repoMap.files.filter(
    (f) => (f.path.startsWith('src/app/api/') || f.path.startsWith('src/lib/'))
      && !f.path.includes('.test.') && !f.path.includes('.spec.')
  )

  const violations: Finding[] = []
  for (const lf of logFiles) {
    let content = ''
    try { content = fs.readFileSync(join(ctx.rootPath, lf.path), 'utf-8') } catch { continue }

    const logLines = content.split('\n').filter(
      (line) => (line.includes('log.') || line.includes('logger.')) && line.includes('{')
    )
    const foundPii = new Set<string>()
    for (const pii of piiFields) {
      const pattern = new RegExp(`\\b${pii}\\b\\s*:`, 'i')
      if (logLines.some((line) => pattern.test(line))) foundPii.add(pii)
    }
    if (foundPii.size > 0) {
      violations.push({
        severity: 'high' as const,
        message: `Possible PII field(s) [${[...foundPii].join(', ')}] in logger call: ${lf.path}`,
        filePath: lf.path,
        suggestion: 'Remove PII from log payloads or replace with anonymized IDs (e.g. user_id instead of email)',
      })
    }
  }

  // Deduplicate by file path
  const unique = violations.filter((v, i, self) => i === self.findIndex((u) => u.filePath === v.filePath))
  if (unique.length === 0) return pass('cat-12-rule-8', 5, 'No obvious PII fields in logger calls')
  const score = unique.length <= 3 ? 3 : unique.length <= 6 ? 2 : 0
  return fail('cat-12-rule-8', score, `${unique.length} file(s) with potential PII in logs`, unique.slice(0, 10))
}

// R7 — Incident response process documented
export async function checkIncidentDocs(ctx: AuditContext): Promise<RuleResult> {
  const docsDir = join(ctx.rootPath, 'docs')
  if (!fs.existsSync(docsDir)) {
    return fail('cat-13-rule-6', 0, 'No docs/ directory found', [{
      severity: 'medium', message: 'No docs/ directory — cannot verify incident response documentation',
    }])
  }

  const keywords = ['incident', 'rollback', 'post-mortem', 'postmortem', 'runbook', 'disaster-recovery']
  const foundDocs: string[] = []

  function scanDir(dir: string): void {
    try {
      for (const entry of fs.readdirSync(dir) as string[]) {
        const fullPath = join(dir, entry)
        if (fs.statSync(fullPath).isDirectory()) { scanDir(fullPath); continue }
        if (!entry.endsWith('.md') && !entry.endsWith('.txt')) continue
        if (keywords.some((k) => entry.toLowerCase().includes(k))) {
          foundDocs.push(fullPath.replace(ctx.rootPath + '/', '').replace(ctx.rootPath + '\\', ''))
        }
      }
    } catch { /* ignore unreadable dirs */ }
  }
  scanDir(docsDir)

  if (foundDocs.length >= 3) return pass('cat-13-rule-6', 5, `${foundDocs.length} incident/runbook docs found`)
  if (foundDocs.length >= 1) {
    return fail('cat-13-rule-6', 3, `${foundDocs.length} incident doc(s) found (recommend ≥ 3)`, [{
      severity: 'low',
      message: `Only ${foundDocs.length} incident/runbook document(s). Recommended: rollback + DR + incident process`,
      suggestion: 'Add docs/runbooks/rollback.md, disaster-recovery.md, and incident-response.md',
    }])
  }
  return fail('cat-13-rule-6', 0, 'No incident response or runbook docs found', [{
    severity: 'medium',
    message: 'No runbooks, incident docs, or post-mortem templates found in docs/',
    suggestion: 'Create docs/runbooks/ with rollback.md and disaster-recovery.md',
  }])
}
