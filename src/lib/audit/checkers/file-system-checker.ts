// src/lib/audit/checkers/file-system-checker.ts
import * as fs from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'

function pass(ruleId: string, score: number, reason: string): RuleResult {
  return { ruleId, score, reason, findings: [], automated: true }
}

function fail(ruleId: string, score: number, reason: string, findings: Finding[] = []): RuleResult {
  return { ruleId, score, reason, findings, automated: true }
}

function hasFile(rootPath: string, ...parts: string[]): boolean {
  return fs.existsSync(join(rootPath, ...parts))
}

function countFilesInDir(rootPath: string, ...parts: string[]): number {
  const dir = join(rootPath, ...parts)
  if (!fs.existsSync(dir)) return -1
  try {
    return (fs.readdirSync(dir) as unknown as string[]).filter((f) => !f.startsWith('.')).length
  } catch {
    return 0
  }
}

function hasDep(pkg: AuditContext['packageJson'], name: string): boolean {
  return !!(pkg.dependencies?.[name] || pkg.devDependencies?.[name])
}

function readWorkflowFiles(rootPath: string): string[] {
  const dir = join(rootPath, '.github', 'workflows')
  if (!fs.existsSync(dir)) return []
  try {
    return (fs.readdirSync(dir) as unknown as string[])
      .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
      .map((f) => {
        try { return fs.readFileSync(join(dir, f), 'utf-8') } catch { return '' }
      })
  } catch {
    return []
  }
}

// ─── Cat 2: Code-Qualität ────────────────────────────────────────────────────

export async function checkTypeScriptStrictMode(ctx: AuditContext): Promise<RuleResult> {
  const strict = ctx.tsConfig.compilerOptions?.strict === true
  return strict
    ? pass('cat-2-rule-1', 5, 'TypeScript strict mode is enabled in tsconfig.json')
    : fail('cat-2-rule-1', 0, 'TypeScript strict mode is not enabled', [{
        severity: 'high',
        message: 'strict: true missing in tsconfig.json compilerOptions',
        suggestion: 'Add "strict": true to tsconfig.json compilerOptions',
      }])
}

export async function checkEsLintConfigured(ctx: AuditContext): Promise<RuleResult> {
  const candidates = [
    '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yaml',
    'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs',
  ]
  const found = candidates.find((f) => hasFile(ctx.rootPath, f))
  return found
    ? pass('cat-2-rule-2', 5, `ESLint configured: ${found}`)
    : fail('cat-2-rule-2', 0, 'No ESLint config file found', [{
        severity: 'medium',
        message: 'No .eslintrc.* or eslint.config.* found in project root',
        suggestion: 'Create eslint.config.mjs',
      }])
}

export async function checkPrettierConfigured(ctx: AuditContext): Promise<RuleResult> {
  const candidates = [
    '.prettierrc', '.prettierrc.json', '.prettierrc.js', '.prettierrc.cjs',
    'prettier.config.js', 'prettier.config.mjs',
  ]
  const found = candidates.find((f) => hasFile(ctx.rootPath, f))
  return found
    ? pass('cat-2-rule-3', 5, `Prettier configured: ${found}`)
    : fail('cat-2-rule-3', 0, 'No Prettier config file found')
}

// ─── Cat 5: Datenbank ────────────────────────────────────────────────────────

export async function checkMigrationsTool(ctx: AuditContext): Promise<RuleResult> {
  const count = countFilesInDir(ctx.rootPath, 'supabase', 'migrations')
  if (count < 0) {
    return fail('cat-5-rule-3', 0, 'supabase/migrations/ directory not found')
  }
  if (count === 0) {
    return fail('cat-5-rule-3', 2, 'supabase/migrations/ exists but is empty')
  }
  return pass('cat-5-rule-3', 5, `Migrations tool active: ${count} migration file(s) in supabase/migrations/`)
}

// ─── Cat 6: API-Design ───────────────────────────────────────────────────────

export async function checkApiVersioning(ctx: AuditContext): Promise<RuleResult> {
  const hasV1 = ctx.filePaths.some((p) => p.includes('/api/v1/'))
  if (hasV1) {
    return pass('cat-6-rule-1', 5, 'API versioning detected: /api/v1/ routes present')
  }
  return fail('cat-6-rule-1', 0, 'No API versioning: no /api/v1/ routes found', [{
    severity: 'low',
    message: 'All API routes are unversioned (/api/* without /v1/)',
    suggestion: 'Consider adding /api/v1/ prefix or using header-based versioning',
  }])
}

export async function checkOpenApiSpec(ctx: AuditContext): Promise<RuleResult> {
  const candidates = [
    join('public', 'openapi.json'), join('docs', 'openapi.yaml'),
    join('docs', 'openapi.json'), 'openapi.yaml', 'swagger.yaml',
  ]
  const found = candidates.find((f) => hasFile(ctx.rootPath, f))
  return found
    ? pass('cat-6-rule-2', 5, `OpenAPI spec found: ${found}`)
    : fail('cat-6-rule-2', 0, 'No OpenAPI/Swagger spec found', [{
        severity: 'low',
        message: 'No openapi.json or swagger.yaml found',
        suggestion: 'Generate OpenAPI spec with zod-to-openapi or similar',
      }])
}

// ─── Cat 7: Performance ──────────────────────────────────────────────────────

export async function checkBundleAnalyzer(ctx: AuditContext): Promise<RuleResult> {
  const hasTool = hasDep(ctx.packageJson, '@next/bundle-analyzer')
    || hasDep(ctx.packageJson, 'webpack-bundle-analyzer')
  return hasTool
    ? pass('cat-7-rule-2', 5, 'Bundle analyzer is installed')
    : fail('cat-7-rule-2', 0, 'No bundle analyzer installed — bundle size unknown', [{
        severity: 'medium',
        message: '@next/bundle-analyzer not in devDependencies',
        suggestion: 'pnpm add -D @next/bundle-analyzer and add ANALYZE=true build script',
      }])
}

// ─── Cat 8: Skalierbarkeit ───────────────────────────────────────────────────

export async function checkJobQueuePresent(ctx: AuditContext): Promise<RuleResult> {
  const vercelJson = join(ctx.rootPath, 'vercel.json')
  if (!fs.existsSync(vercelJson)) {
    return fail('cat-8-rule-2', 2, 'vercel.json not found — cron/job configuration unknown')
  }
  try {
    const content = JSON.parse(fs.readFileSync(vercelJson, 'utf-8'))
    const cronCount = Array.isArray(content.crons) ? content.crons.length : 0
    if (cronCount > 0) {
      return pass('cat-8-rule-2', 4, `${cronCount} cron job(s) configured in vercel.json`)
    }
    return fail('cat-8-rule-2', 2, 'vercel.json has no crons — no background job queue')
  } catch {
    return fail('cat-8-rule-2', 2, 'vercel.json exists but could not be parsed')
  }
}

// ─── Cat 10: Testing ─────────────────────────────────────────────────────────

export async function checkE2ETestsPresent(ctx: AuditContext): Promise<RuleResult> {
  const hasPlaywright = hasFile(ctx.rootPath, 'playwright.config.ts')
    || hasFile(ctx.rootPath, 'playwright.config.js')
  const specFiles = ctx.filePaths.filter((p) => p.includes('.spec.') || p.includes('/e2e/'))
  if (hasPlaywright && specFiles.length > 0) {
    return pass('cat-10-rule-3', 5, `E2E tests present: ${specFiles.length} spec file(s), playwright configured`)
  }
  if (hasPlaywright && specFiles.length === 0) {
    return fail('cat-10-rule-3', 2, 'playwright.config.ts found but no spec files', [{
      severity: 'medium', message: 'No *.spec.ts files found — E2E tests not written',
    }])
  }
  return fail('cat-10-rule-3', 0, 'No E2E test framework found', [{
    severity: 'high', message: 'No playwright.config.ts and no spec files',
    suggestion: 'Install Playwright: pnpm create playwright',
  }])
}

export async function checkIntegrationTests(ctx: AuditContext): Promise<RuleResult> {
  const integrationFiles = ctx.filePaths.filter(
    (p) => p.includes('.integration.test.') || p.includes('/integration/')
  )
  if (integrationFiles.length >= 5) return pass('cat-10-rule-2', 5, `${integrationFiles.length} integration test files`)
  if (integrationFiles.length > 0) return pass('cat-10-rule-2', 3, `${integrationFiles.length} integration test file(s) found`)
  return fail('cat-10-rule-2', 0, 'No integration test files found')
}

export async function checkTestsInCIPipeline(ctx: AuditContext): Promise<RuleResult> {
  const workflows = readWorkflowFiles(ctx.rootPath)
  const hasTestStep = workflows.some(
    (w) => w.includes('vitest') || w.includes('jest') || w.includes('pnpm test')
  )
  return hasTestStep
    ? pass('cat-10-rule-4', 5, 'Tests found in CI pipeline (vitest/jest step detected)')
    : fail('cat-10-rule-4', 0, 'No test step found in CI workflow files')
}

export async function checkKiCodeGate(ctx: AuditContext): Promise<RuleResult> {
  const vitestConfig = join(ctx.rootPath, 'vitest.config.ts')
  if (!fs.existsSync(vitestConfig)) {
    return fail('cat-10-rule-5', 0, 'vitest.config.ts not found — no coverage thresholds')
  }
  try {
    const content = fs.readFileSync(vitestConfig, 'utf-8')
    const hasThresholds = content.includes('thresholds')
    const has80 = /(?:branches|functions|lines|statements):\s*8[0-9]/.test(content)
    if (has80) return pass('cat-10-rule-5', 5, 'Coverage thresholds >= 80% configured in vitest.config.ts')
    if (hasThresholds) return pass('cat-10-rule-5', 3, 'Coverage thresholds configured but < 80%')
    return fail('cat-10-rule-5', 0, 'vitest.config.ts has no coverage thresholds')
  } catch {
    return fail('cat-10-rule-5', 0, 'Could not read vitest.config.ts')
  }
}

// ─── Cat 11: CI/CD ───────────────────────────────────────────────────────────

export async function checkCIPipelinePresent(ctx: AuditContext): Promise<RuleResult> {
  const dir = join(ctx.rootPath, '.github', 'workflows')
  if (!fs.existsSync(dir)) {
    return fail('cat-11-rule-1', 0, 'No .github/workflows/ directory — no CI pipeline')
  }
  const files = (fs.readdirSync(dir) as unknown as string[]).filter(
    (f) => f.endsWith('.yml') || f.endsWith('.yaml')
  )
  if (files.length >= 3) return pass('cat-11-rule-1', 5, `CI pipeline present: ${files.length} workflow file(s)`)
  if (files.length > 0) return pass('cat-11-rule-1', 4, `CI pipeline present: ${files.length} workflow file(s)`)
  return fail('cat-11-rule-1', 2, '.github/workflows/ exists but has no yml files')
}

export async function checkInfrastructureAsCode(ctx: AuditContext): Promise<RuleResult> {
  const hasVercelJson = hasFile(ctx.rootPath, 'vercel.json')
  const hasTerraform = hasFile(ctx.rootPath, 'terraform') || ctx.filePaths.some((p) => p.endsWith('.tf'))
  const hasPulumi = hasFile(ctx.rootPath, 'Pulumi.yaml')
  if (hasTerraform || hasPulumi) {
    return pass('cat-11-rule-4', 5, 'Full IaC found (Terraform/Pulumi)')
  }
  if (hasVercelJson) {
    return pass('cat-11-rule-4', 3, 'vercel.json present (partial IaC — no Terraform/Pulumi)')
  }
  return fail('cat-11-rule-4', 0, 'No Infrastructure as Code found')
}

export async function checkVulnerabilityScanInCI(ctx: AuditContext): Promise<RuleResult> {
  const workflows = readWorkflowFiles(ctx.rootPath)
  const hasScan = workflows.some(
    (w) => w.includes('audit') || w.includes('snyk') || w.includes('trivy') || w.includes('grype')
  )
  return hasScan
    ? pass('cat-14-rule-2', 5, 'Vulnerability scan step found in CI')
    : fail('cat-14-rule-2', 0, 'No vulnerability scan step in CI workflows', [{
        severity: 'high',
        message: 'No pnpm audit / snyk / trivy in CI pipeline',
        suggestion: 'Add "pnpm audit --audit-level=critical" step to CI',
      }])
}

// ─── Cat 12: Observability ───────────────────────────────────────────────────

export async function checkErrorTrackingSentry(ctx: AuditContext): Promise<RuleResult> {
  const hasSentry = hasDep(ctx.packageJson, '@sentry/nextjs')
    || hasDep(ctx.packageJson, '@sentry/node')
  return hasSentry
    ? pass('cat-12-rule-2', 5, '@sentry/nextjs found in dependencies — error tracking active')
    : fail('cat-12-rule-2', 0, 'No Sentry/error tracking dependency found', [{
        severity: 'high',
        message: '@sentry/nextjs not installed',
        suggestion: 'pnpm add @sentry/nextjs',
      }])
}

export async function checkDistributedTracing(ctx: AuditContext): Promise<RuleResult> {
  const hasTracing = hasDep(ctx.packageJson, 'langsmith')
    || hasDep(ctx.packageJson, '@opentelemetry/sdk-node')
    || hasDep(ctx.packageJson, '@vercel/otel')
  return hasTracing
    ? pass('cat-12-rule-4', 5, 'Distributed tracing dependency found (LangSmith/OpenTelemetry/Vercel OTEL)')
    : fail('cat-12-rule-4', 0, 'No distributed tracing found', [{
        severity: 'medium',
        message: 'No langsmith or @opentelemetry/sdk-node in dependencies',
      }])
}

// ─── Cat 14: Dependency Management ───────────────────────────────────────────

export async function checkLockfileCommitted(ctx: AuditContext): Promise<RuleResult> {
  const hasPnpm = hasFile(ctx.rootPath, 'pnpm-lock.yaml')
  const hasNpm = hasFile(ctx.rootPath, 'package-lock.json')
  const hasYarn = hasFile(ctx.rootPath, 'yarn.lock')
  if (hasPnpm || hasNpm || hasYarn) {
    const file = hasPnpm ? 'pnpm-lock.yaml' : hasNpm ? 'package-lock.json' : 'yarn.lock'
    return pass('cat-14-rule-1', 5, `Lockfile present: ${file}`)
  }
  return fail('cat-14-rule-1', 0, 'No lockfile found (pnpm-lock.yaml / package-lock.json / yarn.lock)', [{
    severity: 'critical',
    message: 'Missing lockfile — non-deterministic installs',
  }])
}

export async function checkDependabotConfigured(ctx: AuditContext): Promise<RuleResult> {
  const hasDependabot = hasFile(ctx.rootPath, '.github', 'dependabot.yml')
    || hasFile(ctx.rootPath, '.github', 'dependabot.yaml')
  const hasRenovate = hasFile(ctx.rootPath, 'renovate.json')
    || hasFile(ctx.rootPath, '.renovaterc')
  if (hasDependabot || hasRenovate) {
    return pass('cat-14-rule-3', 5, `Automated dependency updates configured: ${hasDependabot ? 'Dependabot' : 'Renovate'}`)
  }
  return fail('cat-14-rule-3', 0, 'No Dependabot or Renovate configuration found')
}

export async function checkNodeVersionFixed(ctx: AuditContext): Promise<RuleResult> {
  const hasNvmrc = hasFile(ctx.rootPath, '.nvmrc')
  const hasNodeVersion = hasFile(ctx.rootPath, '.node-version')
  const hasEngines = !!(ctx.packageJson as { engines?: { node?: string } }).engines?.node
  if (hasNvmrc || hasNodeVersion) {
    return pass('cat-14-rule-4', 5, `Node version pinned: ${hasNvmrc ? '.nvmrc' : '.node-version'}`)
  }
  if (hasEngines) {
    return pass('cat-14-rule-4', 4, 'Node version specified in package.json engines field')
  }
  return fail('cat-14-rule-4', 0, 'Node version not pinned — no .nvmrc, .node-version, or engines field')
}

// ─── Cat 17: Internationalisierung ───────────────────────────────────────────

export async function checkI18nFramework(ctx: AuditContext): Promise<RuleResult> {
  const i18nDeps = ['next-intl', 'react-i18next', 'i18next', 'next-i18next', 'lingui']
  const found = i18nDeps.find((d) => hasDep(ctx.packageJson, d))
  if (found) {
    return pass('cat-17-rule-1', 5, `i18n framework found: ${found}`)
  }
  return fail('cat-17-rule-1', 0, 'No i18n framework installed', [{
    severity: 'low',
    message: 'All UI strings are hardcoded — no i18n framework',
    suggestion: 'Install next-intl for Next.js-native i18n support',
  }])
}

// ─── Cat 18: Dokumentation ───────────────────────────────────────────────────

export async function checkOpenApiSpecDoc(ctx: AuditContext): Promise<RuleResult> {
  const candidates = [
    join('public', 'openapi.json'), join('docs', 'openapi.yaml'),
    join('docs', 'openapi.json'), 'openapi.yaml',
  ]
  const found = candidates.find((f) => hasFile(ctx.rootPath, f))
  return found
    ? pass('cat-18-rule-3', 5, `API documentation generated: ${found}`)
    : fail('cat-18-rule-3', 0, 'No API documentation file found')
}

// ─── Cat 19: Git Governance ──────────────────────────────────────────────────

export async function checkSemanticVersioning(ctx: AuditContext): Promise<RuleResult> {
  const version = ctx.packageJson.version ?? '0.0.0'
  const [major] = String(version).split('.')
  if (parseInt(major, 10) >= 1) {
    return pass('cat-19-rule-3', 5, `Semantic versioning active: v${version}`)
  }
  return fail('cat-19-rule-3', 0, `Version ${version} is pre-1.0 — no stable release tag`, [{
    severity: 'low',
    message: `package.json version is ${version} — no stable release`,
    suggestion: 'Tag first stable release as v1.0.0',
  }])
}

// ─── Cat 21: PWA & Resilience ────────────────────────────────────────────────

export async function checkPWAManifest(ctx: AuditContext): Promise<RuleResult> {
  const hasManifest = hasFile(ctx.rootPath, 'public', 'manifest.json')
    || hasFile(ctx.rootPath, 'public', 'manifest.webmanifest')
  return hasManifest
    ? pass('cat-21-rule-1', 5, 'PWA manifest found in public/')
    : fail('cat-21-rule-1', 0, 'No manifest.json in public/')
}

export async function checkServiceWorker(ctx: AuditContext): Promise<RuleResult> {
  const hasSW = hasFile(ctx.rootPath, 'public', 'sw.js')
    || hasFile(ctx.rootPath, 'public', 'service-worker.js')
    || ctx.filePaths.some((p) => p.includes('service-worker') || p === 'public/sw.js')
  return hasSW
    ? pass('cat-21-rule-2', 5, 'Service worker found')
    : fail('cat-21-rule-2', 0, 'No service worker found in public/')
}

// ─── Cat 23: Infrastructure ──────────────────────────────────────────────────

export async function checkHealthEndpoint(ctx: AuditContext): Promise<RuleResult> {
  const hasHealthRoute = ctx.filePaths.some(
    (p) => p.includes('/api/health') && p.endsWith('route.ts')
  )
  return hasHealthRoute
    ? pass('cat-23-rule-2', 5, 'Health check endpoint found: /api/health/route.ts')
    : fail('cat-23-rule-2', 0, 'No /api/health endpoint found', [{
        severity: 'medium',
        message: 'Missing health check endpoint',
        suggestion: 'Create src/app/api/health/route.ts returning { status: "ok" }',
      }])
}

// ─── Cat 24: Supply Chain Security ───────────────────────────────────────────

export async function checkSBOMGenerated(ctx: AuditContext): Promise<RuleResult> {
  const hasSBOMFile = hasFile(ctx.rootPath, 'sbom.json')
    || hasFile(ctx.rootPath, 'sbom.xml')
    || ctx.filePaths.some((p) => p.includes('sbom'))
  const workflows = readWorkflowFiles(ctx.rootPath)
  const hasSBOMInCI = workflows.some((w) => w.includes('syft') || w.includes('cyclonedx'))
  if (hasSBOMFile) return pass('cat-24-rule-1', 5, 'SBOM file found in repository')
  if (hasSBOMInCI) return pass('cat-24-rule-1', 4, 'SBOM generated in CI (syft/cyclonedx step found)')
  return fail('cat-24-rule-1', 0, 'No SBOM (Software Bill of Materials) found', [{
    severity: 'medium',
    message: 'No sbom.json and no syft/cyclonedx step in CI',
    suggestion: 'Add: syft . -o cyclonedx-json=sbom.json in CI',
  }])
}

// ─── Cat 25: Namenskonventionen ───────────────────────────────────────────────

export async function checkProjectStructure(ctx: AuditContext): Promise<RuleResult> {
  const expectedDirs = [
    ['src', 'app'],
    ['src', 'lib'],
    ['src', 'components'],
    ['docs'],
  ]
  const missing = expectedDirs.filter((parts) => !hasFile(ctx.rootPath, ...parts))
  if (missing.length === 0) {
    return pass('cat-25-rule-5', 5, 'Project structure follows standard (src/app, src/lib, src/components, docs)')
  }
  return fail('cat-25-rule-5', 5 - missing.length, `Missing standard directories: ${missing.map((p) => p.join('/')).join(', ')}`, [{
    severity: 'medium',
    message: `Missing dirs: ${missing.map((p) => p.join('/')).join(', ')}`,
  }])
}
