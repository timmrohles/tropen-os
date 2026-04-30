// src/lib/audit/checkers/agent-committee-checker.ts
// New automated checks derived from the 18 committee-generated agents (Sprint 5b).
// Each function maps to a specific agent rule; agentSource and agentRuleId are
// set in the rule-registry entry — not repeated here.
import * as fs from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'
import { isListRoute } from '../utils/route-utils'

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
  // Only match truly empty catch blocks: catch(e) {} or catch(e) { /* comment only */ }
  // Removed commentOnlyPattern: catch(e) { // comment ... } was flagging blocks that have
  // real code below the opening comment (e.g. fire-and-forget routes with log.error calls)
  const emptyCatchPattern = /catch\s*\([^)]*\)\s*\{\s*\}/g
  const commentOnlyBlockPattern = /catch\s*\([^)]*\)\s*\{\s*\/\*[^*]*\*\/\s*\}/g

  for (const file of srcFiles.slice(0, 200)) {
    const content = readFile(ctx.rootPath, file.path)
    if (!content) continue
    emptyCatchPattern.lastIndex = 0
    commentOnlyBlockPattern.lastIndex = 0
    if (emptyCatchPattern.test(content) || commentOnlyBlockPattern.test(content)) {
      findings.push({
        severity: 'high',
        message: `Leerer catch-Block in ${file.path} — Fehler werden stillschweigend ignoriert`,
        filePath: file.path,
        suggestion: 'Log the error or re-throw it — never silently swallow exceptions',
      })
    }
    emptyCatchPattern.lastIndex = 0
    commentOnlyBlockPattern.lastIndex = 0
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
        message: `Auskommentierter Code in ${file.path} (${codeComments.length} Block(e))`,
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
    message: `${m}-Seite fehlt — gesetzlich verpflichtend (TMG/DSGVO)`,
    suggestion: `Create src/app/${m.toLowerCase()}/page.tsx`,
  })))
}

/** LEGAL R2 — VVT (Verarbeitungsverzeichnis) in docs/ */
export async function checkVVTPresent(ctx: AuditContext): Promise<RuleResult> {
  const docsDir = join(ctx.rootPath, 'docs')
  if (!fs.existsSync(docsDir)) {
    return fail('cat-4-rule-8', 0, 'docs/ directory not found — no VVT possible', [{
      severity: 'medium',
      message: 'Kein VVT-Verzeichnis im docs/-Ordner — DSGVO Art. 30 schreibt Verarbeitungsverzeichnis vor',
      suggestion: 'Create docs/dsgvo/vvt.md documenting data processing activities',
    }])
  }

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
    message: 'VVT (Verarbeitungsverzeichnis) nach DSGVO Art. 30 nicht gefunden',
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
    message: 'Cookie-Consent fehlt — DSGVO/ePrivacy verlangt Opt-In vor Tracking',
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
        message: `Mögliche Personendaten im Analytics-Event: ${file.path} (Felder: ${piiFound.join(', ')})`,
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
  const fileContents = migrations.map((f) => {
    try { return { name: f, content: fs.readFileSync(join(dir, f), 'utf-8') } }
    catch { return { name: f, content: '' } }
  })
  const allContent = fileContents.map((f) => f.content).join('\n')

  const hasSoftDeleteColumn = /deleted_at/.test(allContent)

  // Count only suspicious DELETE FROM statements — exclude:
  // 1. One-time fix/seed/data migrations (not application-level patterns)
  // 2. DELETE statements that reference deleted_at IS NOT NULL (legitimate TTL cleanup)
  let deleteCount = 0
  for (const { name, content } of fileContents) {
    if (/(^|_)(fix|seed|cleanup|demo|test)_/i.test(name)) continue
    const statements = content.split(';')
    for (const stmt of statements) {
      if (/DELETE FROM/i.test(stmt) && !/deleted_at\s+IS\s+NOT\s+NULL/i.test(stmt)) {
        deleteCount++
      }
    }
  }
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
      message: `Inkonsistent: deleted_at-Spalte vorhanden, aber ${deleteCount} Migration(en) nutzen DELETE FROM statt Soft-Delete`,
      suggestion: 'Standardize on soft-delete — replace DELETE FROM with UPDATE SET deleted_at = NOW()',
    }])
  }
  if (!hasSoftDeleteColumn && deleteCount >= 3) {
    return fail('cat-5-rule-7', 0, 'No soft-delete pattern (deleted_at column) found in migrations', [{
      severity: 'medium',
      message: `Tabellen ohne deleted_at-Spalte — ${deleteCount} DELETE-Statements ohne Soft-Delete-Muster gefunden`,
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
      message: 'Migrations-Dateien: inkonsistente Namenskonventionen',
      suggestion: 'Use sequential numbers (001_, 002_) for all migration filenames',
    }])
  }
  return fail('cat-5-rule-8', 1, `Inconsistent migration naming: only ${Math.round(consistency * 100)}% follow a pattern`, [{
    severity: 'medium',
    message: 'Migrations-Dateien nutzen inkonsistente Namenskonventionen',
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
        message: `Webhook-Route ohne Signatur-Validierung: ${file.path}`,
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
        message: `${hasFetchWithoutTimeout.length} Datei(en) nutzen fetch() ohne Timeout oder AbortController`,
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
  // Detect top-level `let` declarations that could be mutable shared state.
  // Exclude private singletons like `let _client = null` (lazy-init pattern) — these are safe.
  const mutableGlobalPattern = /^(?:export\s+)?let\s+(?![_])\w/m

  for (const file of libFiles.slice(0, 100)) {
    const content = readFile(ctx.rootPath, file.path)
    if (!content) continue
    if (mutableGlobalPattern.test(content)) {
      findings.push({
        severity: 'medium',
        message: `Mutabler State auf Modul-Ebene in ${file.path} — kann Race Conditions verursachen`,
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
    message: 'Keine Staging/Preview-Umgebung konfiguriert — Änderungen landen direkt in Produktion',
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
    message: 'CODEOWNERS fehlt — kein automatisches PR-Review-Assignment',
    suggestion: 'Create .github/CODEOWNERS to assign reviewers based on file paths',
  }])
}

/** DEPENDENCIES R5 — KI dependency review documented */
export async function checkKiDependencyReviewDocs(ctx: AuditContext): Promise<RuleResult> {
  const docsDir = join(ctx.rootPath, 'docs')
  if (!fs.existsSync(docsDir)) {
    return fail('cat-14-rule-6', 0, 'docs/ not found — no KI dependency review process documented', [{
      severity: 'low',
      message: 'KI-unterstützter Dependency-Review-Prozess nicht dokumentiert',
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
    message: 'KI-unterstützter Dependency-Review-Prozess nicht dokumentiert',
    suggestion: 'Add docs/engineering-process.md with dependency review procedure',
  }])
}

// ─── Cat 15: Design System — Design System Agent ─────────────────────────────

/** DESIGN_SYSTEM R3 — no hardcoded hex colors in TSX/CSS source */
export async function checkHardcodedColors(ctx: AuditContext): Promise<RuleResult> {
  const uiFiles = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/') &&
      (f.path.endsWith('.tsx') || f.path.endsWith('.css')) &&
      !f.path.includes('.test.') && !f.path.includes('_DESIGN_REFERENCE') &&
      // Pages with intentional standalone dark themes (not part of main design system)
      !f.path.includes('/responsible-ai/') && !f.path.includes('/offline/') &&
      // global-error.tsx is a catastrophic error boundary — CSS vars may not load; hex is the fallback
      !f.path.endsWith('global-error.tsx') &&
      // layout.tsx uses hex in viewport.themeColor (browser meta tag — CSS vars not applicable)
      !f.path.endsWith('src/app/layout.tsx') &&
      // globals.css IS the token definition file — hex values there define the design system, not violate it
      !f.path.endsWith('globals.css')
  )

  const hexPattern = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g
  const findings: Finding[] = []
  const allowlist = new Set(['#000000', '#ffffff', '#000', '#fff'])

  for (const file of uiFiles.slice(0, 150)) {
    const content = readFile(ctx.rootPath, file.path)
    if (!content) continue
    const matches = [...content.matchAll(hexPattern)]
      .map((m) => ({ match: m[0], index: m.index ?? 0 }))
      // Skip HTML numeric entity references like &#128274; where # is preceded by &
      .filter(({ match, index }) => content[index - 1] !== '&' && !allowlist.has(match.toLowerCase()))
      .map(({ match }) => match)
    if (matches.length > 0) {
      findings.push({
        severity: 'medium',
        message: `Hardcodierte Hex-Farbe(n) in ${file.path}: ${[...new Set(matches)].slice(0, 5).join(', ')}`,
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
      message: 'CSS-Datei hat kaum Custom Properties — Design-Token fehlen',
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
    severity: 'high',
    message: 'No CODEOWNERS — PRs touching critical files have no automatic reviewer assignment',
    suggestion: "Cursor-Prompt: 'Create .github/CODEOWNERS — add /* @your-username for root ownership and /src/ @your-username for source. Enables automatic PR review assignment.'",
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
  // Exclude audit infrastructure — those files analyse AI code, they don't call AI APIs
  const aiFiles = ctx.repoMap.files.filter(
    (f) => (f.path.startsWith('src/lib/') || f.path.startsWith('src/app/api/')) &&
      !f.path.includes('/audit/') &&
      (f.path.includes('ai') || f.path.includes('llm') || f.path.includes('anthropic') ||
        f.path.includes('chat') || f.path.includes('agent'))
  )

  if (aiFiles.length === 0) {
    return pass('cat-22-rule-6', 3, 'No AI integration files found')
  }

  // Only count files that use generateText/generateObject — streaming-only files (streamText)
  // return opaque text and don't need structured output validation.
  const structuredAiFiles = aiFiles.filter((f) => {
    const content = readFile(ctx.rootPath, f.path)
    return content.includes('generateText(') || content.includes('generateObject(') ||
           content.includes('tool_use') || content.includes('structured_output')
  })

  if (structuredAiFiles.length === 0) {
    return pass('cat-22-rule-6', 4, 'No structured AI output files found — streaming-only pattern is safe')
  }

  // 'JSON.parse(' covers structured LLM output parsing; 'z.object(' covers Zod-schema structured output;
  // 'parse[A-Z]\w*(Response|Output|Result)' matches project-specific LLM output parsers.
  const validationKeywords = ['validateOutput', 'parseOutput', 'sanitize', 'safeParse', 'validateResponse', 'JSON.parse(', 'z.object(', 'schema:', 'outputSchema']
  const validationPattern = /parse[A-Z]\w*(Response|Output|Result)\s*\(/
  const filesWithValidation = structuredAiFiles.filter((f) => {
    const content = readFile(ctx.rootPath, f.path)
    return validationKeywords.some((k) => content.includes(k)) || validationPattern.test(content)
  })

  const ratio = filesWithValidation.length / structuredAiFiles.length

  if (ratio >= 0.5) {
    return pass('cat-22-rule-6', 5, `LLM output validation found in ${filesWithValidation.length}/${structuredAiFiles.length} structured AI files`)
  }
  return fail('cat-22-rule-6', ratio >= 0.2 ? 2 : 1,
    `Only ${filesWithValidation.length}/${structuredAiFiles.length} structured AI files validate LLM output`,
    [{
      severity: 'high',
      message: 'Structured AI output files lack Zod/JSON validation before use in business logic',
      suggestion: 'Add Zod schemas or explicit JSON.parse validation before using LLM output in business logic',
    }]
  )
}

/** AI_INTEGRATION R2 — AI provider abstraction layer */
export async function checkAiProviderAbstraction(ctx: AuditContext): Promise<RuleResult> {
  const hasLlmLib = hasFile(ctx.rootPath, 'src', 'lib', 'llm') ||
    hasFile(ctx.rootPath, 'src', 'lib', 'llm.ts') ||
    hasFile(ctx.rootPath, 'src', 'lib', 'llm', 'anthropic.ts')

  // Check if API files import AI SDK directly (bypassing abstraction)
  // Only flag external packages — internal '@/lib/llm/anthropic' is the correct abstraction
  const directImports = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') &&
      f.imports.some((imp) =>
        imp.target === 'anthropic' ||
        imp.target.startsWith('@anthropic-ai/') ||
        imp.target.startsWith('@ai-sdk/anthropic')
      )
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
    return fail('cat-24-rule-5', 0, 'Keine GitHub Actions Workflows — Build-Signierung nicht konfiguriert', [{
      severity: 'low',
      message: 'Keine CI-Workflow-Datei gefunden — Build-Provenance und Signierung nicht konfiguriert',
      suggestion: 'GitHub Actions Workflow mit SLSA-Provenance oder cosign für signierte Builds einrichten',
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
  return fail('cat-24-rule-5', 0, 'Keine Build-Signierung oder Provenance in CI gefunden', [{
    severity: 'low',
    message: 'CI-Workflows konfigurieren keine Build-Provenance und keine Signierung',
    suggestion: 'SLSA-Provenance-Generierung oder cosign-Signierung in die CI-Pipeline einbauen',
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

  // List-Route-Detection via shared utility (see src/lib/audit/utils/route-utils.ts)
  const listEndpoints = listRoutes.filter((f) => {
    if (!isListRoute(f.path)) return false
    const sym = f.symbols.find((s) => s.name === 'GET')
    if (!sym) return false
    // Routes scoped to a specific user/org via .eq() are naturally bounded
    const content = readFile(ctx.rootPath, f.path)
    if (/\.eq\s*\(\s*['"](?:user_id|organization_id|org_id|owner_id)['"]/.test(content)) return false
    return true
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

  for (const file of srcFiles.slice(0, 150)) {
    const content = readFile(ctx.rootPath, file.path)
    if (!content) continue

    let looseCount = 0
    for (const line of content.split('\n')) {
      const trimmed = line.trimStart()
      // Skip comments
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
      // Find == or != that are not ===, !==, =>, <=, >=
      const matches = line.match(/(?<![=!<>])={2}(?!=)|(?<!!)!={1}(?!=)/g) ?? []
      for (const m of matches) {
        if (m !== '==' && m !== '!=') continue
        // Skip null/undefined checks — `x == null` is idiomatic TS (catches both null + undefined)
        const context = line.slice(Math.max(0, line.indexOf(m) - 5), line.indexOf(m) + m.length + 10)
        if (/[=!]=\s*(null|undefined)/.test(context)) continue
        looseCount++
      }
    }

    if (looseCount > 0) {
      findings.push({
        severity: 'medium',
        message: `${looseCount} loose equality operator(s) in ${file.path}`,
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
