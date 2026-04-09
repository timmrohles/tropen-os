// src/lib/audit/checkers/agent-security-checker.ts
// Security Agent v2.1 — automated checks for R3, R4, R6, R7, R8, R9
import * as fs from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'

function pass(ruleId: string, score: number, reason: string): RuleResult {
  return { ruleId, score, reason, findings: [], automated: true }
}
function fail(ruleId: string, score: number, reason: string, findings: Finding[] = []): RuleResult {
  return { ruleId, score, reason, findings, automated: true }
}
function hasDep(pkg: AuditContext['packageJson'], name: string): boolean {
  return !!(pkg.dependencies?.[name] || pkg.devDependencies?.[name])
}
function readFileSafe(rootPath: string, ...parts: string[]): string {
  const p = join(rootPath, ...parts)
  try { return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '' } catch { return '' }
}

// R3 — Auth guard consistency across API routes
export async function checkAuthGuardConsistency(ctx: AuditContext): Promise<RuleResult> {
  const publicPrefixes = ['/api/public/', '/api/auth/', '/api/health', '/api/webhooks/', '/api/s/']
  const apiRoutes = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') && f.path.endsWith('route.ts')
  )
  const nonPublicRoutes = apiRoutes.filter(
    (f) => !publicPrefixes.some((p) => f.path.replace('src/app', '').includes(p))
  )
  if (nonPublicRoutes.length === 0) {
    return pass('cat-3-rule-15', 3, 'No non-public API routes to check')
  }

  const withAuth = nonPublicRoutes.filter((f) =>
    f.imports.some((imp) =>
      imp.symbols.some((s) => ['getUser', 'requireAuth', 'getAuthUser', 'createClient'].includes(s))
      || imp.target.includes('supabase') || imp.target.includes('auth') || imp.target.includes('guards')
    )
  )
  const ratio = withAuth.length / nonPublicRoutes.length
  const score = ratio >= 0.95 ? 5 : ratio >= 0.8 ? 4 : ratio >= 0.6 ? 3 : 1

  const missing = nonPublicRoutes
    .filter((f) => !f.imports.some((imp) =>
      imp.symbols.some((s) => ['getUser', 'requireAuth', 'getAuthUser', 'createClient'].includes(s))
      || imp.target.includes('supabase') || imp.target.includes('auth') || imp.target.includes('guards')
    ))
    .slice(0, 10)

  return {
    ruleId: 'cat-3-rule-15', score, automated: true,
    reason: `${withAuth.length}/${nonPublicRoutes.length} API routes import auth (${Math.round(ratio * 100)}%)`,
    findings: missing.map((f) => ({
      severity: 'high' as const,
      message: `API route may lack auth check: ${f.path}`,
      filePath: f.path,
      suggestion: 'Add createClient() + getUser() auth check as the first operation',
    })),
  }
}

// R4 — RLS enabled on all tables (only applicable for multi-tenant projects)
function isMultiTenantProject(ctx: AuditContext): boolean {
  const migrationsDir = join(ctx.rootPath, 'supabase', 'migrations')
  if (!fs.existsSync(migrationsDir)) return false
  try {
    const files = (fs.readdirSync(migrationsDir) as string[]).filter((f) => f.endsWith('.sql'))
    return files.some((mf) => {
      const content = readFileSafe(ctx.rootPath, 'supabase', 'migrations', mf)
      return /\borg_id\b|\btenant_id\b|\borganization_id\b/.test(content)
    })
  } catch { return false }
}

export async function checkRlsCoverage(ctx: AuditContext): Promise<RuleResult> {
  if (!isMultiTenantProject(ctx)) {
    return pass('cat-3-rule-16', 5, 'Single-tenant project — RLS tenant isolation not required')
  }

  const migrationsDir = join(ctx.rootPath, 'supabase', 'migrations')
  if (!fs.existsSync(migrationsDir)) {
    return fail('cat-3-rule-16', 0, 'No supabase/migrations directory found', [{
      severity: 'high', message: 'Cannot verify RLS coverage — no migrations directory',
    }])
  }

  const migFiles = (fs.readdirSync(migrationsDir) as string[]).filter((f) => f.endsWith('.sql'))
  let tableCount = 0
  let rlsCount = 0

  for (const mf of migFiles) {
    const content = readFileSafe(ctx.rootPath, 'supabase', 'migrations', mf)
    tableCount += (content.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?["'`]?\w+["'`]?/gi) ?? []).length
    rlsCount += (content.match(/ENABLE ROW LEVEL SECURITY/gi) ?? []).length
  }

  if (tableCount === 0) return pass('cat-3-rule-16', 3, 'No CREATE TABLE statements found in migrations')

  const ratio = rlsCount / tableCount
  const score = ratio >= 0.9 ? 5 : ratio >= 0.7 ? 3 : ratio >= 0.5 ? 2 : 1
  return {
    ruleId: 'cat-3-rule-16', score, automated: true,
    reason: `RLS enabled on ${rlsCount}/${tableCount} tables (${Math.round(ratio * 100)}%)`,
    findings: ratio < 0.9 ? [{
      severity: 'high' as const,
      message: `Only ${Math.round(ratio * 100)}% of tables have RLS (${rlsCount}/${tableCount})`,
      suggestion: 'Add ENABLE ROW LEVEL SECURITY + policies to all tables with tenant data',
    }] : [],
  }
}

// R6 — Rate limiting (only applicable when public endpoints exist)
function hasPublicEndpoints(ctx: AuditContext): boolean {
  const rootPath = ctx.rootPath
  // OpenAPI spec implies a public-facing API
  const openApiFiles = ['openapi.yaml', 'openapi.json', join('docs', 'api'), join('public', 'openapi.json')]
  if (openApiFiles.some((f) => fs.existsSync(join(rootPath, f)))) return true
  // nginx config suggests a publicly exposed server
  if (fs.existsSync(join(rootPath, 'nginx.conf'))) return true
  // Explicit /public/ route prefix
  if (ctx.filePaths.some((p) => p.includes('/api/public/'))) return true
  return false
}

export async function checkRateLimiting(ctx: AuditContext): Promise<RuleResult> {
  if (!hasPublicEndpoints(ctx)) {
    // Internal-only APIs: rate limiting is optional but good practice — partial credit
    const hasPackage = hasDep(ctx.packageJson, '@upstash/ratelimit')
    if (hasPackage) return pass('cat-3-rule-17', 5, 'Rate limiting configured (internal API — optional but present)')
    return pass('cat-3-rule-17', 4, 'No public endpoints detected — rate limiting optional for internal APIs')
  }

  const hasPackage = hasDep(ctx.packageJson, '@upstash/ratelimit')
  const ratelimitAdapterFiles = ctx.repoMap.files.filter(
    (f) => f.path.includes('ratelimit') || f.path.includes('rate-limit')
  )
  const usedInGateway = ctx.repoMap.files.some(
    (f) => (f.path.includes('middleware') || f.path.includes('proxy'))
      && f.imports.some((imp) =>
        imp.target.includes('ratelimit') || imp.target.includes('rate-limit')
        || imp.symbols.some((s) => s.toLowerCase().includes('limit'))
      )
  )

  if (hasPackage && usedInGateway) {
    return pass('cat-3-rule-17', 5, 'Rate limiting: @upstash/ratelimit installed + wired into gateway')
  }
  if (hasPackage && ratelimitAdapterFiles.length > 0) {
    return fail('cat-3-rule-17', 3, 'Rate limiting adapter present but not integrated in middleware', [{
      severity: 'medium',
      message: '@upstash/ratelimit installed but not wired into middleware/proxy',
      suggestion: 'Import and call the rate limiter in src/lib/ratelimit/index.ts from proxy.ts',
    }])
  }
  if (hasPackage) {
    return fail('cat-3-rule-17', 2, '@upstash/ratelimit installed but no adapter configured', [{
      severity: 'medium', message: '@upstash/ratelimit installed but no rate limit adapter found',
    }])
  }
  return fail('cat-3-rule-17', 0, 'No rate limiting package found for public API', [{
    severity: 'high',
    message: 'No rate limiting (@upstash/ratelimit or similar) configured',
    suggestion: 'Install @upstash/ratelimit and wire it into the request proxy/middleware layer',
  }])
}

// R7 — CORS: no wildcard origin in production
export async function checkCorsConfig(ctx: AuditContext): Promise<RuleResult> {
  const candidates = ['next.config.js', 'next.config.ts', 'next.config.mjs']
  let configContent = ''
  for (const c of candidates) {
    const content = readFileSafe(ctx.rootPath, c)
    if (content) { configContent = content; break }
  }
  const middlewareContent = readFileSafe(ctx.rootPath, 'src', 'middleware.ts')
    || readFileSafe(ctx.rootPath, 'middleware.ts')
  const combined = configContent + middlewareContent

  if (combined.includes('origin: "*"') || combined.includes("origin: '*'")) {
    return fail('cat-3-rule-18', 0, 'Wildcard CORS origin detected', [{
      severity: 'critical',
      message: 'CORS wildcard origin "*" allows any domain to read API responses',
      suggestion: 'Replace with explicit allowed origins array: ["https://yourapp.com"]',
    }])
  }
  if (combined.includes('Access-Control-Allow-Origin') || combined.includes('headers:')) {
    return pass('cat-3-rule-18', 5, 'CORS / security headers configuration found')
  }
  // Next.js default is restrictive (same-origin) — acceptable baseline
  return { ruleId: 'cat-3-rule-18', score: 4, automated: true,
    reason: 'No explicit CORS config — Next.js same-origin defaults apply', findings: [] }
}

// R8 — No stack traces or error.message in API responses
export async function checkErrorLeakage(ctx: AuditContext): Promise<RuleResult> {
  const apiRoutes = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') && f.path.endsWith('route.ts')
  )
  const leakPatterns = ['error.stack', 'err.stack', 'e.stack']
  // Only flag when it's in a response context (message/error/detail key)
  const responseLeakPattern = /(?:message|error|detail|stack)\s*:\s*(?:error|err|e)\.(?:message|stack)/

  const violations: Finding[] = []
  for (const route of apiRoutes) {
    let content = ''
    try { content = fs.readFileSync(join(ctx.rootPath, route.path), 'utf-8') } catch { continue }

    const hasStackLeak = leakPatterns.some((p) => content.includes(p))
    const hasResponseLeak = responseLeakPattern.test(content)

    if (hasStackLeak || hasResponseLeak) {
      violations.push({
        severity: 'high' as const,
        message: `Potential error internals leaked in API response: ${route.path}`,
        filePath: route.path,
        suggestion: 'Log full error server-side; return only a generic message to clients',
      })
    }
  }

  if (violations.length === 0) return pass('cat-3-rule-19', 5, 'No error leakage patterns in API routes')
  const score = violations.length <= 3 ? 3 : violations.length <= 6 ? 2 : 1
  return fail('cat-3-rule-19', score, `${violations.length} potential error leakage(s) in API routes`, violations)
}

// R9 — No user input interpolated into system prompts
export async function checkLlmInputSeparation(ctx: AuditContext): Promise<RuleResult> {
  const llmFiles = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/lib/llm/')
      || f.path.includes('workspace-context')
      || (f.path.startsWith('src/app/api/') && (
        f.path.includes('chat') || f.path.includes('perspective') || f.path.includes('ai')
      ))
  )

  const violations: Finding[] = []
  for (const lf of llmFiles) {
    let content = ''
    try { content = fs.readFileSync(join(ctx.rootPath, lf.path), 'utf-8') } catch { continue }

    // Look for template literals in system role content
    // Pattern: role: 'system', content: `...${
    if (/role:\s*['"]system['"]\s*,\s*content:\s*`[^`]*\$\{/.test(content)) {
      violations.push({
        severity: 'critical' as const,
        message: `Template interpolation in system prompt: ${lf.path}`,
        filePath: lf.path,
        suggestion: 'Keep user content strictly in the "user" role — system prompt must be static',
      })
    }
  }

  if (violations.length === 0) return pass('cat-22-rule-5', 5, 'No system-prompt interpolation patterns found')
  return fail('cat-22-rule-5', 1, `${violations.length} potential prompt injection risk(s)`, violations)
}
