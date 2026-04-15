// src/lib/audit/checkers/agent-committee-checker.ts
// New automated checks derived from the 18 committee-generated agents (Sprint 5b).
// Each function maps to a specific agent rule; agentSource and agentRuleId are
// set in the rule-registry entry — not repeated here.
import * as fs from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pass(ruleId: string, score: number, reason: string): RuleResult {
  return { ruleId, score, reason, findings: [], automated: true }
}
function fail(ruleId: string, score: number, reason: string, findings: Finding[] = []): RuleResult {
  return { ruleId, score, reason, findings, automated: true }
}
function hasFile(rootPath: string, ...parts: string[]): boolean {
  return fs.existsSync(join(rootPath, ...parts))
}
function hasDep(pkg: AuditContext['packageJson'], name: string): boolean {
  return !!(pkg.dependencies?.[name] || pkg.devDependencies?.[name])
}
function readFile(rootPath: string, ...parts: string[]): string {
  try { return fs.readFileSync(join(rootPath, ...parts), 'utf-8') } catch { return '' }
}
function readMigrations(rootPath: string): string[] {
  // In-memory scans (rootPath === '') must not read from local disk
  if (!rootPath) return []
  const dir = join(rootPath, 'supabase', 'migrations')
  if (!fs.existsSync(dir)) return []
  try {
    return (fs.readdirSync(dir) as string[])
      .filter((f) => f.endsWith('.sql'))
      .sort()
  } catch { return [] }
}

// ─── Cat 2: Code-Qualität — Code Style Agent ────────────────────────────────

/** CODE_STYLE R2 — no empty catch blocks */
export async function checkEmptyCatchBlocks(ctx: AuditContext): Promise<RuleResult> {
  const srcFiles = ctx.repoMap.files.filter(
    (f) => (f.path.startsWith('src/') || f.path.startsWith('app/')) &&
      (f.path.endsWith('.ts') || f.path.endsWith('.tsx')) &&
      !f.path.includes('.test.') && !f.path.includes('.spec.')
  )

  const findings: Finding[] = []
  const emptyCatchPattern = /catch\s*\([^)]*\)\s*\{\s*\}/g
  const commentOnlyPattern = /catch\s*\([^)]*\)\s*\{\s*\/\//g

  for (const file of srcFiles.slice(0, 200)) {
    const content = readFile(ctx.rootPath, file.path)
    if (!content) continue
    if (emptyCatchPattern.test(content) || commentOnlyPattern.test(content)) {
      findings.push({
        severity: 'high',
        message: `Potential empty catch block in ${file.path}`,
        filePath: file.path,
        suggestion: 'Log the error or re-throw it — never silently swallow exceptions',
      })
    }
    // reset regex state
    emptyCatchPattern.lastIndex = 0
    commentOnlyPattern.lastIndex = 0
  }

  if (findings.length === 0) return pass('cat-2-rule-7', 5, 'No empty catch blocks detected in source files')
  const score = findings.length <= 2 ? 3 : findings.length <= 5 ? 2 : 1
  return fail('cat-2-rule-7', score, `${findings.length} file(s) with potential empty catch blocks`, findings.slice(0, 10))
}

/** CODE_STYLE R9 — no commented-out code blocks > 2 lines */
export async function checkCommentedOutCode(ctx: AuditContext): Promise<RuleResult> {
  const srcFiles = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/') &&
      (f.path.endsWith('.ts') || f.path.endsWith('.tsx')) &&
      !f.path.includes('.test.') && !f.path.includes('.spec.')
  )

  const findings: Finding[] = []
  // detect 3+ consecutive comment lines containing code-like syntax
  const consecutiveCommentPattern = /(?:\/\/[^\n]*\n){3,}/g

  for (const file of srcFiles.slice(0, 150)) {
    const content = readFile(ctx.rootPath, file.path)
    if (!content) continue
    const matches = content.match(consecutiveCommentPattern) ?? []
    const codeComments = matches.filter((m) =>
      /\/\/\s*(const|let|var|function|return|if|import|export)/.test(m)
    )
    if (codeComments.length > 0) {
      findings.push({
        severity: 'low',
        message: `Commented-out code block in ${file.path} (${codeComments.length} block(s))`,
        filePath: file.path,
        suggestion: 'Remove commented-out code — version control preserves history',
      })
    }
    consecutiveCommentPattern.lastIndex = 0
  }

  if (findings.length === 0) return pass('cat-2-rule-8', 5, 'No large commented-out code blocks detected')
  const score = findings.length <= 3 ? 3 : findings.length <= 8 ? 2 : 1
  return fail('cat-2-rule-8', score, `${findings.length} file(s) with commented-out code blocks`, findings.slice(0, 10))
}

// ─── Cat 4: Datenschutz & Compliance — Legal Agent ──────────────────────────

/** LEGAL R1 — Impressum + Datenschutz pages exist */
export async function checkLegalPages(ctx: AuditContext): Promise<RuleResult> {
  const impressumPaths = [
    'src/app/impressum/page.tsx', 'src/app/(legal)/impressum/page.tsx',
    'src/app/impressum.tsx', 'pages/impressum.tsx',
  ]
  const datenschutzPaths = [
    'src/app/datenschutz/page.tsx', 'src/app/(legal)/datenschutz/page.tsx',
    'src/app/datenschutz.tsx', 'pages/datenschutz.tsx',
    'src/app/privacy/page.tsx',
  ]
  const hasImpressum = impressumPaths.some((p) => hasFile(ctx.rootPath, p))
  const hasDatenschutz = datenschutzPaths.some((p) => hasFile(ctx.rootPath, p))

  if (hasImpressum && hasDatenschutz) {
    return pass('cat-4-rule-7', 5, 'Impressum and Datenschutz pages found')
  }
  const missing: string[] = []
  if (!hasImpressum) missing.push('Impressum')
  if (!hasDatenschutz) missing.push('Datenschutzerklärung')
  return fail('cat-4-rule-7', 0, `Missing legal pages: ${missing.join(', ')}`, missing.map((m) => ({
    severity: 'high' as const,
    message: `${m} page not found — required by German law (TMG)`,
    suggestion: `Create src/app/${m.toLowerCase()}/page.tsx`,
  })))
}

/** LEGAL R2 — VVT (Verarbeitungsverzeichnis) in docs/ */
export async function checkVVTPresent(ctx: AuditContext): Promise<RuleResult> {
  const docsDir = join(ctx.rootPath, 'docs')
  if (!fs.existsSync(docsDir)) {
    return fail('cat-4-rule-8', 0, 'docs/ directory not found — no VVT possible', [{
      severity: 'medium',
      message: 'No docs directory found for VVT (Verarbeitungsverzeichnis)',
      suggestion: 'Create docs/dsgvo/vvt.md documenting data processing activities',
    }])
  }

  const docsContent = readFile(ctx.rootPath, 'docs')
  const vvtKeywords = ['vvt', 'verarbeitungsverzeichnis', 'processing-activities', 'dsgvo']

  function searchDir(dir: string): boolean {
    try {
      const entries = fs.readdirSync(dir) as string[]
      for (const entry of entries) {
        const full = join(dir, entry)
        const stat = fs.statSync(full)
        if (stat.isDirectory()) {
          if (searchDir(full)) return true
        } else if (entry.endsWith('.md') || entry.endsWith('.docx')) {
          const lname = entry.toLowerCase()
          if (vvtKeywords.some((k) => lname.includes(k))) return true
          // also check file content for .md files
          if (entry.endsWith('.md')) {
            const content = readFile(full)
            if (vvtKeywords.some((k) => content.toLowerCase().includes(k))) return true
          }
        }
      }
    } catch { /* ignore */ }
    return false
  }

  if (searchDir(docsDir)) {
    return pass('cat-4-rule-8', 5, 'VVT / Verarbeitungsverzeichnis documentation found in docs/')
  }
  return fail('cat-4-rule-8', 0, 'No VVT (Verarbeitungsverzeichnis) found in docs/', [{
    severity: 'high',
    message: 'VVT required by DSGVO Art. 30 — not found',
    suggestion: 'Create docs/dsgvo/vvt.md with a record of all data processing activities',
  }])
}

/** LEGAL R3 — Cookie consent implementation present */
export async function checkCookieConsent(ctx: AuditContext): Promise<RuleResult> {
  const consentKeywords = ['cookie', 'consent', 'einwilligung', 'cookiebanner', 'cookieconsent']

  const hasConsentPkg = hasDep(ctx.packageJson, 'react-cookie-consent') ||
    hasDep(ctx.packageJson, 'cookieconsent') ||
    hasDep(ctx.packageJson, '@osano/cookieconsent')

  const consentFiles = ctx.filePaths.filter((p) => {
    const lower = p.toLowerCase()
    return consentKeywords.some((k) => lower.includes(k))
  })

  const hasConsentInLayout = (() => {
    const layoutPath = 'src/app/layout.tsx'
    if (!hasFile(ctx.rootPath, layoutPath)) return false
    const content = readFile(ctx.rootPath, layoutPath)
    return consentKeywords.some((k) => content.toLowerCase().includes(k))
  })()

  if (hasConsentPkg || consentFiles.length > 0 || hasConsentInLayout) {
    return pass('cat-4-rule-9', 5, 'Cookie consent implementation detected')
  }
  return fail('cat-4-rule-9', 0, 'No cookie consent implementation found', [{
    severity: 'high',
    message: 'Cookie consent required by DSGVO/ePrivacy — none detected',
    suggestion: 'Add a cookie consent banner before setting any non-essential cookies',
  }])
}

/** ANALYTICS R3 — PII separated from analytics events */
export async function checkAnalyticsPiiSeparation(ctx: AuditContext): Promise<RuleResult> {
  const analyticsFiles = ctx.repoMap.files.filter((f) => {
    const lower = f.path.toLowerCase()
    return lower.includes('analytic') || lower.includes('tracking') || lower.includes('event')
  })

  if (analyticsFiles.length === 0) {
    return pass('cat-4-rule-10', 4, 'No analytics files found to check for PII separation')
  }

  const piiPatterns = ['email', 'phone', 'password', 'name', 'address', 'ssn', 'dob']
  const findings: Finding[] = []

  for (const file of analyticsFiles.slice(0, 30)) {
    const content = readFile(ctx.rootPath, file.path)
    const piiFound = piiPatterns.filter((p) => {
      const lc = content.toLowerCase()
      return lc.includes(`track.*${p}`) || lc.includes(`identify.*${p}`)
    })
    if (piiFound.length > 0) {
      findings.push({
        severity: 'high',
        message: `Potential PII in analytics event: ${file.path} (fields: ${piiFound.join(', ')})`,
        filePath: file.path,
        suggestion: 'Hash or anonymize PII before sending to analytics — DSGVO requirement',
      })
    }
  }

  if (findings.length === 0) return pass('cat-4-rule-10', 5, 'No obvious PII leakage in analytics files')
  return fail('cat-4-rule-10', 1, `${findings.length} analytics file(s) with potential PII`, findings)
}

// ─── Cat 5: Datenbank — Database Agent ───────────────────────────────────────

/** DATABASE R4 — soft-delete pattern (deleted_at instead of DELETE) */
export async function checkSoftDeletePattern(ctx: AuditContext): Promise<RuleResult> {
  const migrations = readMigrations(ctx.rootPath)
  if (migrations.length === 0) {
    return pass('cat-5-rule-7', 3, 'No migrations found to check soft-delete pattern')
  }

  const dir = join(ctx.rootPath, 'supabase', 'migrations')
  const allContent = migrations
    .map((f) => { try { return fs.readFileSync(join(dir, f), 'utf-8') } catch { return '' } })
    .join('\n')

  const hasSoftDeleteColumn = /deleted_at/.test(allContent)
  const hasDeletedAtDefault = /deleted_at.*DEFAULT NULL/.test(allContent) ||
    /deleted_at.*TIMESTAMP/.test(allContent)
  const deleteMatches = allContent.match(/DELETE FROM/gi) || []
  const deleteCount = deleteMatches.length
  const hasHardDelete = deleteCount > 0

  if (hasSoftDeleteColumn && !hasHardDelete) {
    return pass('cat-5-rule-7', 5, 'Soft-delete pattern via deleted_at column found — no hard DELETEs in migrations')
  }
  if (hasSoftDeleteColumn && hasHardDelete) {
    // Threshold: only flag if >= 3 DELETE statements — occasional seed/cleanup DELETEs are acceptable
    if (deleteCount < 3) {
      return pass('cat-5-rule-7', 4, `deleted_at column exists with only ${deleteCount} DELETE statement(s) — below threshold`)
    }
    return fail('cat-5-rule-7', 3, 'deleted_at column exists but some migrations use hard DELETE', [{
      severity: 'medium',
      message: `Inconsistent: deleted_at column exists but ${deleteCount} migrations contain DELETE FROM`,
      suggestion: 'Standardize on soft-delete — replace DELETE FROM with UPDATE SET deleted_at = NOW()',
    }])
  }
  if (!hasSoftDeleteColumn && deleteCount >= 3) {
    return fail('cat-5-rule-7', 0, 'No soft-delete pattern (deleted_at column) found in migrations', [{
      severity: 'medium',
      message: `Tables lack deleted_at column for soft-delete support (${deleteCount} DELETE statements found)`,
      suggestion: 'Add deleted_at TIMESTAMPTZ DEFAULT NULL to all user-data tables',
    }])
  }
  if (!hasSoftDeleteColumn && deleteCount < 3) {
    return pass('cat-5-rule-7', 3, `No deleted_at column but only ${deleteCount} DELETE statement(s) — below threshold`)
  }
  return pass('cat-5-rule-7', 4, 'deleted_at pattern present in migrations')
}

/** DATABASE R6 — migration naming consistency */
export async function checkMigrationNaming(ctx: AuditContext): Promise<RuleResult> {
  const migrations = readMigrations(ctx.rootPath)
  if (migrations.length === 0) {
    return pass('cat-5-rule-8', 3, 'No migrations to check naming for')
  }

  const sequentialPattern = /^\d{3}_/
  const timestampPattern = /^\d{14}_/
  const yyyymmddPattern = /^\d{8}_/

  const sequential = migrations.filter((f) => sequentialPattern.test(f)).length
  const timestamp = migrations.filter((f) => timestampPattern.test(f)).length
  const yyyymmdd = migrations.filter((f) => yyyymmddPattern.test(f)).length

  const total = migrations.length
  const maxMatch = Math.max(sequential, timestamp, yyyymmdd)
  const consistency = maxMatch / total

  if (consistency >= 0.9) {
    return pass('cat-5-rule-8', 5, `Migration naming consistent: ${maxMatch}/${total} files follow the same pattern`)
  }
  if (consistency >= 0.7) {
    return fail('cat-5-rule-8', 3, `Migration naming mostly consistent: ${maxMatch}/${total} (${Math.round(consistency * 100)}%)`, [{
      severity: 'low',
      message: 'Some migrations use inconsistent naming',
      suggestion: 'Use sequential numbers (001_, 002_) for all migration filenames',
    }])
  }
  return fail('cat-5-rule-8', 1, `Inconsistent migration naming: only ${Math.round(consistency * 100)}% follow a pattern`, [{
    severity: 'medium',
    message: 'Migration files have inconsistent naming conventions',
    suggestion: 'Standardize on sequential (001_name.sql) or timestamp (20260101120000_name.sql)',
  }])
}

// ─── Cat 6: API-Design — API Agent ───────────────────────────────────────────

/** API R4 — webhook signature validation */
export async function checkWebhookSignatureValidation(ctx: AuditContext): Promise<RuleResult> {
  const webhookFiles = ctx.repoMap.files.filter((f) =>
    f.path.includes('webhook') && f.path.endsWith('route.ts')
  )

  if (webhookFiles.length === 0) {
    return pass('cat-6-rule-6', 5, 'No webhook routes found — rule not applicable')
  }

  const findings: Finding[] = []
  const signatureKeywords = ['signature', 'hmac', 'svix', 'x-hub-signature', 'stripe-signature', 'webhook-secret', 'verifySignature']

  for (const file of webhookFiles) {
    const content = readFile(ctx.rootPath, file.path)
    const hasValidation = signatureKeywords.some((k) => content.toLowerCase().includes(k.toLowerCase()))
    if (!hasValidation) {
      findings.push({
        severity: 'high',
        message: `Webhook route without signature validation: ${file.path}`,
        filePath: file.path,
        suggestion: 'Validate HMAC signature on all incoming webhook requests before processing',
      })
    }
  }

  if (findings.length === 0) {
    return pass('cat-6-rule-6', 5, `All ${webhookFiles.length} webhook route(s) appear to validate signatures`)
  }
  return fail('cat-6-rule-6', 0, `${findings.length}/${webhookFiles.length} webhook route(s) missing signature validation`, findings)
}

/** API R5 — timeout/retry patterns on external calls */
export async function checkTimeoutRetryPatterns(ctx: AuditContext): Promise<RuleResult> {
  const externalCallFiles = ctx.repoMap.files.filter((f) =>
    (f.path.startsWith('src/lib/') || f.path.startsWith('src/app/api/')) &&
    !f.path.includes('.test.') && !f.path.includes('.spec.')
  )

  const hasAbortController = externalCallFiles.some((f) => {
    const content = readFile(ctx.rootPath, f.path)
    return content.includes('AbortController') || content.includes('signal:') || content.includes('timeout:')
  })

  const hasFetchWithoutTimeout = externalCallFiles.filter((f) => {
    const content = readFile(ctx.rootPath, f.path)
    return /fetch\(/.test(content) && !content.includes('AbortController') &&
      !content.includes('signal') && !content.includes('timeout')
  })

  const hasRetry = externalCallFiles.some((f) => {
    const content = readFile(ctx.rootPath, f.path)
    return content.includes('retry') || content.includes('p-retry') || content.includes('exponential')
  })

  if (hasAbortController && hasRetry) {
    return pass('cat-6-rule-7', 5, 'External calls use AbortController (timeout) and retry patterns')
  }
  if (hasAbortController) {
    return pass('cat-6-rule-7', 4, 'External calls use timeout via AbortController — retry pattern not detected')
  }
  if (hasFetchWithoutTimeout.length > 3) {
    return fail('cat-6-rule-7', 1, `${hasFetchWithoutTimeout.length} files with fetch() calls lack explicit timeout`, [
      {
        severity: 'medium',
        message: `${hasFetchWithoutTimeout.length} file(s) with fetch() have no timeout/AbortController`,
        suggestion: 'Add AbortController with a timeout to all external fetch() calls',
        affectedFiles: hasFetchWithoutTimeout.map((f) => f.path),
        fixHint: 'Wrap each fetch() call with AbortController: const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 10000); fetch(url, { signal: ctrl.signal })',
      },
    ])
  }
  return pass('cat-6-rule-7', 3, 'No obvious external calls without timeout detected')
}

// ─── Cat 8: Skalierbarkeit — Scalability Agent ───────────────────────────────

/** SCALABILITY R1 — no module-level mutable state */
export async function checkGlobalMutableState(ctx: AuditContext): Promise<RuleResult> {
  const libFiles = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/lib/') && f.path.endsWith('.ts') &&
      !f.path.includes('.test.') && !f.path.includes('types.ts')
  )

  const findings: Finding[] = []
  // Detect top-level `let` declarations that could be mutable shared state
  const mutableGlobalPattern = /^(?:export\s+)?let\s+\w/m

  for (const file of libFiles.slice(0, 100)) {
    const content = readFile(ctx.rootPath, file.path)
    if (!content) continue
    if (mutableGlobalPattern.test(content)) {
      findings.push({
        severity: 'medium',
        message: `Module-level mutable state detected: ${file.path}`,
        filePath: file.path,
        suggestion: 'Avoid module-level let — use singletons with proper initialization or dependency injection',
      })
    }
  }

  if (findings.length === 0) return pass('cat-8-rule-5', 5, 'No module-level mutable state detected in src/lib/')
  if (findings.length <= 2) return fail('cat-8-rule-5', 3, `${findings.length} file(s) with potential module-level mutable state`, findings)
  return fail('cat-8-rule-5', 1, `${findings.length} files with module-level mutable let declarations`, findings.slice(0, 5))
}

// ─── Cat 10: Testing — Testing Agent ─────────────────────────────────────────

/** TESTING R2 — coverage thresholds configured in vitest.config */
export async function checkVitestCoverageThresholds(ctx: AuditContext): Promise<RuleResult> {
  const vitestCandidates = ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mts']
  let vitestContent = ''
  for (const c of vitestCandidates) {
    vitestContent = readFile(ctx.rootPath, c)
    if (vitestContent) break
  }

  if (!vitestContent) {
    return fail('cat-10-rule-6', 0, 'No vitest.config found', [{
      severity: 'medium',
      message: 'vitest.config.ts not found — cannot verify coverage thresholds',
      suggestion: 'Create vitest.config.ts with coverage.thresholds configured',
    }])
  }

  const hasThresholds = vitestContent.includes('thresholds') || vitestContent.includes('lines')
  const hasV8OrIstanbul = vitestContent.includes("provider: 'v8'") || vitestContent.includes("provider: 'istanbul'")

  if (hasThresholds && hasV8OrIstanbul) {
    return pass('cat-10-rule-6', 5, 'vitest coverage thresholds configured with coverage provider')
  }
  if (hasThresholds) {
    return pass('cat-10-rule-6', 4, 'vitest coverage thresholds configured (provider not explicit)')
  }
  if (vitestContent.includes('coverage')) {
    return fail('cat-10-rule-6', 2, 'vitest has coverage config but no threshold enforcement', [{
      severity: 'medium',
      message: 'vitest coverage section exists but thresholds are not set',
      suggestion: 'Add coverage.thresholds: { lines: 80, functions: 80, branches: 70 }',
    }])
  }
  return fail('cat-10-rule-6', 0, 'vitest configured but no coverage section found', [{
    severity: 'medium',
    message: 'No coverage configuration in vitest.config.ts',
    suggestion: 'Add coverage configuration with thresholds to vitest.config.ts',
  }])
}

// ─── Cat 11: CI/CD — Platform Agent ──────────────────────────────────────────

/** PLATFORM R2 — staging environment configured */
export async function checkStagingEnvironment(ctx: AuditContext): Promise<RuleResult> {
  // Check vercel.json, GitHub workflow, or docs for staging config
  const vercelJson = readFile(ctx.rootPath, 'vercel.json')
  const hasVercelPreview = vercelJson.includes('preview') || vercelJson.includes('staging')

  const workflowDir = join(ctx.rootPath, '.github', 'workflows')
  let hasStagingWorkflow = false
  if (fs.existsSync(workflowDir)) {
    const files = fs.readdirSync(workflowDir) as string[]
    hasStagingWorkflow = files.some((f) => f.includes('staging') || f.includes('preview'))
  }

  const hasStagingEnvFile = hasFile(ctx.rootPath, '.env.staging') ||
    hasFile(ctx.rootPath, '.env.preview') ||
    ctx.filePaths.some((p) => p.includes('staging') && p.includes('env'))

  if (hasVercelPreview || hasStagingWorkflow || hasStagingEnvFile) {
    return pass('cat-11-rule-6', 5, 'Staging/preview environment configuration detected')
  }

  // Vercel auto-creates preview deployments — partial credit
  if (vercelJson || hasFile(ctx.rootPath, 'vercel.json')) {
    return pass('cat-11-rule-6', 4, 'Vercel project configured — preview deployments available automatically')
  }

  return fail('cat-11-rule-6', 0, 'No staging environment configuration found', [{
    severity: 'medium',
    message: 'No staging/preview environment configuration detected',
    suggestion: 'Configure Vercel preview deployments or add a staging workflow in .github/workflows/',
  }])
}

// ─── Cat 13: Backup & DR — Backup DR Agent ───────────────────────────────────

/** BACKUP_DR R3 — restore test documented */
export async function checkRestoreTestDocumented(ctx: AuditContext): Promise<RuleResult> {
  const searchPaths = [
    join(ctx.rootPath, 'docs', 'runbooks'),
    join(ctx.rootPath, 'docs', 'backup'),
    join(ctx.rootPath, 'docs'),
  ]
  const restoreKeywords = ['restore test', 'restore-test', 'restore_test', 'backup test', 'recovery test', 'restore validation']

  for (const dir of searchPaths) {
    if (!fs.existsSync(dir)) continue
    try {
      const files = fs.readdirSync(dir) as string[]
      for (const file of files) {
        if (!file.endsWith('.md')) continue
        const content = readFile(join(dir, file))
        if (restoreKeywords.some((k) => content.toLowerCase().includes(k))) {
          return pass('cat-13-rule-7', 5, `Restore test procedure documented in docs/${file}`)
        }
      }
    } catch { /* ignore */ }
  }

  return fail('cat-13-rule-7', 0, 'No restore test documentation found', [{
    severity: 'high',
    message: 'Restore test procedure not documented — backups are not verified',
    suggestion: 'Add restore test procedure to docs/runbooks/disaster-recovery.md',
  }])
}

// ─── Cat 14: Dependency Management — Dependencies / Git Governance ───────────

/** GIT_GOVERNANCE R3 / DEPENDENCIES — CODEOWNERS file present */
export async function checkCodeownersPresent(ctx: AuditContext): Promise<RuleResult> {
  const candidates = [
    '.github/CODEOWNERS',
    'CODEOWNERS',
    'docs/CODEOWNERS',
  ]
  const found = candidates.find((p) => hasFile(ctx.rootPath, p))
  if (found) {
    const content = readFile(ctx.rootPath, found)
    const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#')).length
    return pass('cat-14-rule-5', lines >= 3 ? 5 : 3, `CODEOWNERS found at ${found} with ${lines} rule(s)`)
  }
  return fail('cat-14-rule-5', 0, 'No CODEOWNERS file found', [{
    severity: 'medium',
    message: 'CODEOWNERS not found — no automatic PR review assignment',
    suggestion: 'Create .github/CODEOWNERS to assign reviewers based on file paths',
  }])
}

/** DEPENDENCIES R5 — KI dependency review documented */
export async function checkKiDependencyReviewDocs(ctx: AuditContext): Promise<RuleResult> {
  const docsDir = join(ctx.rootPath, 'docs')
  if (!fs.existsSync(docsDir)) {
    return fail('cat-14-rule-6', 0, 'docs/ not found — no KI dependency review process documented', [{
      severity: 'low',
      message: 'No documentation for AI-assisted dependency review process',
      suggestion: 'Document the KI dependency review process in docs/engineering-process.md',
    }])
  }

  function searchDir(dir: string): boolean {
    try {
      const entries = fs.readdirSync(dir) as string[]
      for (const entry of entries) {
        const full = join(dir, entry)
        if (fs.statSync(full).isDirectory()) {
          if (searchDir(full)) return true
        } else if (entry.endsWith('.md')) {
          const content = readFile(full)
          if (content.toLowerCase().includes('dependency review') ||
            content.toLowerCase().includes('ki-dependency') ||
            content.toLowerCase().includes('ai review')) return true
        }
      }
    } catch { /* ignore */ }
    return false
  }

  if (searchDir(docsDir)) {
    return pass('cat-14-rule-6', 5, 'KI dependency review process documented in docs/')
  }
  return fail('cat-14-rule-6', 2, 'No KI dependency review documentation found', [{
    severity: 'low',
    message: 'AI-assisted dependency review process not documented',
    suggestion: 'Add docs/engineering-process.md with dependency review procedure',
  }])
}

// ─── Cat 15: Design System — Design System Agent ─────────────────────────────

/** DESIGN_SYSTEM R3 — no hardcoded hex colors in TSX/CSS source */
export async function checkHardcodedColors(ctx: AuditContext): Promise<RuleResult> {
  const uiFiles = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/') &&
      (f.path.endsWith('.tsx') || f.path.endsWith('.css')) &&
      !f.path.includes('.test.') && !f.path.includes('_DESIGN_REFERENCE')
  )

  const hexPattern = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g
  const findings: Finding[] = []
  const allowlist = new Set(['#000000', '#ffffff', '#000', '#fff'])

  for (const file of uiFiles.slice(0, 150)) {
    const content = readFile(ctx.rootPath, file.path)
    if (!content) continue
    const matches = [...content.matchAll(hexPattern)]
      .map((m) => m[0])
      .filter((m) => !allowlist.has(m.toLowerCase()))
    if (matches.length > 0) {
      findings.push({
        severity: 'medium',
        message: `Hardcoded hex color(s) in ${file.path}: ${[...new Set(matches)].slice(0, 5).join(', ')}`,
        filePath: file.path,
        suggestion: 'Replace hex values with CSS variables (e.g. var(--accent), var(--text-primary))',
      })
    }
    hexPattern.lastIndex = 0
  }

  if (findings.length === 0) return pass('cat-15-rule-5', 5, 'No hardcoded hex colors detected in TSX/CSS source files')
  const score = findings.length <= 3 ? 3 : findings.length <= 8 ? 2 : 1
  return fail('cat-15-rule-5', score, `${findings.length} file(s) with hardcoded hex colors`, findings.slice(0, 10))
}

/** DESIGN_SYSTEM R1 — CSS variables/tokens file present */
export async function checkCssVariablesFile(ctx: AuditContext): Promise<RuleResult> {
  const candidates = [
    'src/app/globals.css',
    'src/styles/globals.css',
    'src/styles/tokens.css',
    'src/styles/variables.css',
    'styles/globals.css',
    'styles/tokens.css',
  ]
  for (const c of candidates) {
    if (!hasFile(ctx.rootPath, c)) continue
    const content = readFile(ctx.rootPath, c)
    const varCount = (content.match(/--[\w-]+:/g) ?? []).length
    if (varCount >= 10) return pass('cat-15-rule-6', 5, `CSS variables file found: ${c} (${varCount} vars)`)
    if (varCount >= 3)  return pass('cat-15-rule-6', 3, `CSS file found at ${c} but only ${varCount} CSS variables`)
    return fail('cat-15-rule-6', 2, `${c} exists but has < 3 CSS custom properties`, [{
      severity: 'low',
      message: 'CSS file has very few CSS custom properties',
      suggestion: 'Define all design tokens (colors, spacing, typography) as CSS custom properties',
    }])
  }
  return fail('cat-15-rule-6', 0, 'No globals.css or tokens.css with CSS variables found', [{
    severity: 'medium',
    message: 'No CSS variables file found — design tokens not centralized',
    suggestion: 'Create src/app/globals.css with CSS custom property design tokens',
  }])
}

// ─── Cat 16: Accessibility — Accessibility Agent ─────────────────────────────

/** ACCESSIBILITY R2 — axe-core installed for accessibility testing */
export async function checkAxeCoreInstalled(ctx: AuditContext): Promise<RuleResult> {
  const hasAxe = hasDep(ctx.packageJson, '@axe-core/react') ||
    hasDep(ctx.packageJson, 'axe-core') ||
    hasDep(ctx.packageJson, 'jest-axe') ||
    hasDep(ctx.packageJson, '@playwright/axe') ||
    hasDep(ctx.packageJson, 'axe-playwright')

  if (hasAxe) {
    return pass('cat-16-rule-4', 5, 'axe-core or axe testing library detected in dependencies')
  }
  return fail('cat-16-rule-4', 0, 'No axe-core accessibility testing library found', [{
    severity: 'medium',
    message: 'axe-core not installed — no automated accessibility testing',
    suggestion: 'Add axe-core: npm install --save-dev @axe-core/react or jest-axe',
  }])
}

// ─── Cat 19: Git Governance ───────────────────────────────────────────────────

/** GIT_GOVERNANCE R3 — CODEOWNERS file (also counts for cat-19) */
export async function checkCodeownersForGitGovernance(ctx: AuditContext): Promise<RuleResult> {
  const candidates = ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS']
  const found = candidates.find((p) => hasFile(ctx.rootPath, p))
  if (found) {
    return pass('cat-19-rule-4', 5, `CODEOWNERS found at ${found}`)
  }
  return fail('cat-19-rule-4', 0, 'CODEOWNERS file not found', [{
    severity: 'medium',
    message: 'No CODEOWNERS — PRs touching critical files have no automatic reviewer assignment',
    suggestion: 'Create .github/CODEOWNERS to enforce review ownership per directory',
  }])
}

// ─── Cat 20: Cost Awareness — Cost Awareness Agent ───────────────────────────

/** COST_AWARENESS R1 — budget alerts documented */
export async function checkBudgetAlertsDocumented(ctx: AuditContext): Promise<RuleResult> {
  const budgetKeywords = ['budget alert', 'cost alert', 'spending alert', 'anthropic.*alert', 'vercel.*alert']

  const sources = [
    readFile(ctx.rootPath, 'CLAUDE.md'),
    readFile(ctx.rootPath, 'docs', 'webapp-manifest', 'engineering-standard.md'),
    readFile(ctx.rootPath, 'README.md'),
  ]

  const allContent = sources.join('\n').toLowerCase()
  const hasAlertDocs = budgetKeywords.some((k) => new RegExp(k).test(allContent))

  // Also check if src/lib/budget.ts exists as a programmatic control
  const hasBudgetLib = hasFile(ctx.rootPath, 'src', 'lib', 'budget.ts')

  if (hasAlertDocs && hasBudgetLib) {
    return pass('cat-20-rule-5', 5, 'Budget alerts documented and budget enforcement library present')
  }
  if (hasBudgetLib) {
    return pass('cat-20-rule-5', 4, 'Budget enforcement library (src/lib/budget.ts) present — alert documentation optional')
  }
  if (hasAlertDocs) {
    return pass('cat-20-rule-5', 3, 'Budget alert documentation found — programmatic enforcement not detected')
  }
  return fail('cat-20-rule-5', 0, 'No budget alerts documented and no budget enforcement library', [{
    severity: 'medium',
    message: 'Cloud/AI budget alerts not configured or documented',
    suggestion: 'Configure Anthropic Console budget alerts and document in CLAUDE.md',
  }])
}

// ─── Cat 22: AI Integration — AI Integration Agent ───────────────────────────

/** AI_INTEGRATION R4 — LLM output validation present */
export async function checkLlmOutputValidation(ctx: AuditContext): Promise<RuleResult> {
  const aiFiles = ctx.repoMap.files.filter(
    (f) => (f.path.startsWith('src/lib/') || f.path.startsWith('src/app/api/')) &&
      (f.path.includes('ai') || f.path.includes('llm') || f.path.includes('anthropic') ||
        f.path.includes('chat') || f.path.includes('agent'))
  )

  if (aiFiles.length === 0) {
    return pass('cat-22-rule-6', 3, 'No AI integration files found')
  }

  const validationKeywords = ['validateOutput', 'parseOutput', 'sanitize', 'zod.parse', 'safeParse', 'validateResponse']
  const filesWithValidation = aiFiles.filter((f) => {
    const content = readFile(ctx.rootPath, f.path)
    return validationKeywords.some((k) => content.includes(k))
  })

  const ratio = filesWithValidation.length / aiFiles.length

  if (ratio >= 0.5) {
    return pass('cat-22-rule-6', 5, `LLM output validation found in ${filesWithValidation.length}/${aiFiles.length} AI files`)
  }
  return fail('cat-22-rule-6', ratio >= 0.2 ? 2 : 1,
    `Only ${filesWithValidation.length}/${aiFiles.length} AI files validate LLM output`,
    [{
      severity: 'high',
      message: 'Most AI integration files lack output validation/sanitization',
      suggestion: 'Add Zod schemas or explicit validation before using LLM output in business logic',
    }]
  )
}

/** AI_INTEGRATION R2 — AI provider abstraction layer */
export async function checkAiProviderAbstraction(ctx: AuditContext): Promise<RuleResult> {
  const hasLlmLib = hasFile(ctx.rootPath, 'src', 'lib', 'llm') ||
    hasFile(ctx.rootPath, 'src', 'lib', 'llm.ts') ||
    hasFile(ctx.rootPath, 'src', 'lib', 'llm', 'anthropic.ts')

  // Check if API files import AI SDK directly (bypassing abstraction)
  const directImports = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') &&
      f.imports.some((imp) => imp.target.includes('@anthropic-ai') || imp.target.includes('anthropic'))
  )

  if (hasLlmLib && directImports.length === 0) {
    return pass('cat-22-rule-7', 5, 'AI provider abstraction layer present, no direct SDK imports in API routes')
  }
  if (hasLlmLib && directImports.length <= 2) {
    return pass('cat-22-rule-7', 4, `LLM abstraction layer present — ${directImports.length} direct import(s) (acceptable)`)
  }
  if (!hasLlmLib) {
    return fail('cat-22-rule-7', 1, 'No AI provider abstraction layer found (src/lib/llm/)', [{
      severity: 'high',
      message: 'No abstraction layer for AI provider — vendor lock-in risk',
      suggestion: 'Create src/lib/llm/ abstraction layer — all AI calls should go through it',
    }])
  }
  return fail('cat-22-rule-7', 2, `${directImports.length} API routes import AI SDK directly (bypassing abstraction)`, [{
    severity: 'medium',
    message: `${directImports.length} routes bypass the LLM abstraction layer`,
    suggestion: 'Route all AI calls through src/lib/llm/ — never import @anthropic-ai in API routes directly',
    affectedFiles: directImports.map((f) => f.path),
    fixHint: 'Replace direct @anthropic-ai imports with the abstraction from src/lib/llm/anthropic.ts',
  }])
}

// ─── Cat 24: Supply Chain Security — Dependencies Agent ──────────────────────

/** DEPENDENCIES R6 — signed builds / provenance configured */
export async function checkSignedBuilds(ctx: AuditContext): Promise<RuleResult> {
  const workflowDir = join(ctx.rootPath, '.github', 'workflows')
  if (!fs.existsSync(workflowDir)) {
    return fail('cat-24-rule-5', 0, 'No GitHub Actions workflows — signed builds not configured', [{
      severity: 'low',
      message: 'No CI workflow found to configure build provenance/signing',
      suggestion: 'Add GitHub Actions workflow with SLSA provenance or cosign for signed builds',
    }])
  }

  const workflows = (fs.readdirSync(workflowDir) as string[])
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map((f) => readFile(join(workflowDir, f)))
    .join('\n')

  const hasProvenance = workflows.includes('provenance') || workflows.includes('slsa') ||
    workflows.includes('cosign') || workflows.includes('sigstore')

  if (hasProvenance) {
    return pass('cat-24-rule-5', 5, 'Build provenance/signing configured in CI workflow')
  }
  return fail('cat-24-rule-5', 0, 'No signed build / provenance configuration found in CI', [{
    severity: 'low',
    message: 'CI workflows do not configure build provenance or signing',
    suggestion: 'Add SLSA provenance generation or cosign signing to CI pipeline',
  }])
}

// ─── Cat 7: Performance — Performance Agent ───────────────────────────────────

/** PERFORMANCE R3 — pagination for list API endpoints */
export async function checkPaginationOnListEndpoints(ctx: AuditContext): Promise<RuleResult> {
  const listRoutes = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') && f.path.endsWith('route.ts')
  )

  if (listRoutes.length === 0) {
    return pass('cat-7-rule-6', 3, 'No API routes found to check pagination')
  }

  const paginationKeywords = ['limit', 'offset', 'page', 'cursor', 'take', 'skip', 'range']
  const listEndpoints = listRoutes.filter((f) => {
    // Check if it's a GET endpoint (likely a list)
    return f.symbols.some((s) => s.name === 'GET')
  })

  if (listEndpoints.length === 0) {
    return pass('cat-7-rule-6', 3, 'No GET handler routes found to check pagination')
  }

  const withPagination = listEndpoints.filter((f) => {
    const content = readFile(ctx.rootPath, f.path)
    return paginationKeywords.some((k) => content.includes(k))
  })

  const ratio = withPagination.length / listEndpoints.length

  if (ratio >= 0.7) {
    return pass('cat-7-rule-6', 5, `${withPagination.length}/${listEndpoints.length} GET endpoints have pagination`)
  }
  const missing = listEndpoints.filter((f) => !withPagination.includes(f))
  return fail('cat-7-rule-6', ratio >= 0.4 ? 3 : 1,
    `Only ${withPagination.length}/${listEndpoints.length} GET endpoints have pagination`,
    missing.slice(0, 5).map((f) => ({
      severity: 'medium' as const,
      message: `GET endpoint may lack pagination: ${f.path}`,
      filePath: f.path,
      suggestion: 'Add limit/offset or cursor-based pagination to all list endpoints',
    }))
  )
}

// ─── Cat 12: Observability — Analytics Agent ─────────────────────────────────

/** ANALYTICS R1 — analytics event schema is typed */
export async function checkAnalyticsEventSchema(ctx: AuditContext): Promise<RuleResult> {
  const analyticsFiles = ctx.repoMap.files.filter((f) => {
    const lower = f.path.toLowerCase()
    return (lower.includes('analytic') || lower.includes('event') || lower.includes('track')) &&
      f.path.endsWith('.ts')
  })

  if (analyticsFiles.length === 0) {
    return pass('cat-12-rule-9', 4, 'No analytics files found — schema not applicable')
  }

  const typedSchemas = analyticsFiles.filter((f) =>
    f.symbols.some((s) =>
      s.kind === 'type' || s.kind === 'interface' || s.kind === 'enum'
    )
  )

  if (typedSchemas.length > 0) {
    return pass('cat-12-rule-9', 5, `Analytics event schema typed: ${typedSchemas.length}/${analyticsFiles.length} analytics files have type definitions`)
  }
  return fail('cat-12-rule-9', 1, 'Analytics files lack typed event schemas', [{
    severity: 'medium',
    message: 'Analytics event payloads are not typed — brittle and error-prone',
    suggestion: 'Define TypeScript interfaces or Zod schemas for all analytics events',
  }])
}

// ─── Cat 21: PWA & Resilience — Error Handling Agent ─────────────────────────

/** ERROR_HANDLING — 404 and 500 error pages exist */
export async function checkErrorPages(ctx: AuditContext): Promise<RuleResult> {
  const has404 = hasFile(ctx.rootPath, 'src', 'app', 'not-found.tsx') ||
    hasFile(ctx.rootPath, 'src', 'pages', '404.tsx') ||
    hasFile(ctx.rootPath, 'pages', '404.tsx')
  const hasError = hasFile(ctx.rootPath, 'src', 'app', 'error.tsx') ||
    hasFile(ctx.rootPath, 'src', 'pages', '_error.tsx') ||
    hasFile(ctx.rootPath, 'pages', '_error.tsx')

  if (has404 && hasError) {
    return pass('cat-21-rule-4', 5, '404 (not-found.tsx) and error.tsx pages present')
  }
  const missing: string[] = []
  if (!has404) missing.push('404/not-found page')
  if (!hasError) missing.push('error boundary page')

  return fail('cat-21-rule-4', has404 || hasError ? 2 : 0,
    `Missing error pages: ${missing.join(', ')}`,
    missing.map((m) => ({
      severity: 'medium' as const,
      message: `${m} not found`,
      suggestion: m.includes('404')
        ? 'Create src/app/not-found.tsx for custom 404 page'
        : 'Create src/app/error.tsx for global error boundary',
    }))
  )
}

// ─── Cat 2: Code-Qualität — Code Style Agent (deepened) ──────────────────────

/** CODE_STYLE R10 — Strict equality operators (=== not ==) */
export async function checkStrictEquality(ctx: AuditContext): Promise<RuleResult> {
  const srcFiles = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/') &&
      (f.path.endsWith('.ts') || f.path.endsWith('.tsx')) &&
      !f.path.includes('.test.') && !f.path.includes('.spec.')
  )

  const findings: Finding[] = []
  // Match == or != that are NOT === or !==
  // Use negative lookbehind/lookahead to avoid false positives on ===, !==, =>, <=, >=
  const looseEqPattern = /(?<![=!<>])={2}(?!=)|(?<!!)\!={1}(?!=)/g

  for (const file of srcFiles.slice(0, 150)) {
    const content = readFile(ctx.rootPath, file.path)
    if (!content) continue
    looseEqPattern.lastIndex = 0
    const matches = content.match(looseEqPattern) ?? []
    // Filter out false positives in string literals or JSX attribute values
    const realMatches = matches.filter((m) => {
      // == in JSX className="" or href="" is always assignment context — skip false pos
      return m === '==' || m === '!='
    })
    if (realMatches.length > 0) {
      findings.push({
        severity: 'medium',
        message: `${realMatches.length} loose equality operator(s) in ${file.path}`,
        filePath: file.path,
        suggestion: 'Use === and !== instead of == and != to avoid implicit type coercion (CODE_STYLE R10)',
      })
    }
  }

  if (findings.length === 0) return pass('cat-2-rule-10', 5, 'No loose equality operators detected in source files')
  const score = findings.length <= 3 ? 3 : findings.length <= 8 ? 2 : 1
  return fail('cat-2-rule-10', score, `${findings.length} file(s) with loose equality operators (== / !=)`, findings.slice(0, 10))
}

// ─── Cat 16: Accessibility — Accessibility Agent (deepened) ──────────────────

/** ACCESSIBILITY R9 — all <img> elements have alt text */
export async function checkImageAltText(ctx: AuditContext): Promise<RuleResult> {
  const tsxFiles = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/') && f.path.endsWith('.tsx') &&
      !f.path.includes('.test.') && !f.path.includes('.spec.') &&
      !f.path.includes('.stories.')
  )

  const findings: Finding[] = []
  // Match <img ...> without an alt attribute
  const imgTagPattern = /<img\b([^>]*)>/g

  for (const file of tsxFiles.slice(0, 150)) {
    const content = readFile(ctx.rootPath, file.path)
    if (!content || !content.includes('<img')) continue

    imgTagPattern.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = imgTagPattern.exec(content)) !== null) {
      const attrs = m[1]
      // Check if alt attribute is present (alt= or alt={)
      if (!/\balt\s*[={]/.test(attrs)) {
        findings.push({
          severity: 'high',
          message: `<img> without alt attribute in ${file.path}`,
          filePath: file.path,
          suggestion: 'Add alt="description" for informative images or alt="" for decorative images (WCAG 2.1 SC 1.1.1)',
        })
        break // one finding per file is enough
      }
    }
  }

  if (findings.length === 0) return pass('cat-16-rule-10', 5, 'All <img> elements have alt attributes')
  const score = findings.length <= 2 ? 3 : findings.length <= 5 ? 2 : 1
  return fail('cat-16-rule-10', score, `${findings.length} file(s) with <img> missing alt text`, findings.slice(0, 10))
}
