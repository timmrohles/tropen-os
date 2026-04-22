// src/lib/audit/checkers/agent-security-checker.ts
// Security Agent v2.1 — automated checks for R3, R4, R6, R7, R8, R9, R10
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
  const publicPrefixes = [
    '/api/public/', '/api/auth/', '/api/health', '/api/webhooks/', '/api/s/',
    // Cron routes use CRON_SECRET bearer token (not user auth) — excluded from user-auth check
    '/api/cron/',
    // Stateless transform endpoint — no user data, used by unauthenticated shared-artifact viewers
    '/api/artifacts/transform',
  ]
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
  // Use content-based detection — f.imports is never populated in the repo-map JSON
  const gatewayFiles = ['src/proxy.ts', 'proxy.ts', 'src/middleware.ts', 'middleware.ts', 'src/lib/ratelimit/index.ts']
  const usedInGateway = ctx.rootPath
    ? gatewayFiles.some(f => {
        const content = readFileSafe(ctx.rootPath!, f)
        return /upstash\/ratelimit|Ratelimit\.slidingWindow|Ratelimit\.fixedWindow|checkRateLimit/i.test(content)
      })
    : ctx.repoMap.files.some(f =>
        (f.path.includes('proxy') || f.path.includes('middleware') || f.path.includes('ratelimit'))
        && (f.path.endsWith('.ts') || f.path.endsWith('.js'))
      )

  if (hasPackage && usedInGateway) {
    return pass('cat-3-rule-17', 5, 'Rate limiting: @upstash/ratelimit installed + wired into gateway')
  }
  if (hasPackage) {
    return fail('cat-3-rule-17', 2, '@upstash/ratelimit installed but no adapter configured', [{
      severity: 'medium', message: '@upstash/ratelimit installed but not wired into proxy/middleware',
      suggestion: 'Import and call Ratelimit from proxy.ts or middleware.ts',
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

  const violations: Finding[] = []
  for (const route of apiRoutes) {
    let content = ''
    try { content = fs.readFileSync(join(ctx.rootPath, route.path), 'utf-8') } catch { continue }

    const hasStackLeak = leakPatterns.some((p) => content.includes(p))

    // Only flag error.message when it's inside a NextResponse.json() call — not in log.error()
    // Strip log lines first to avoid false positives from server-side logging
    const withoutLogs = content.replace(/log(?:ger)?\.(?:error|warn|info|debug)\([^)]*\)/g, '')
    const hasMessageLeak = /NextResponse\.json\([^)]*(?:error|err|e|[a-z]+Error|[a-z]+Err)\.(?:message|stack)/
      .test(withoutLogs)
    // Also check for error details passed via variables: NextResponse.json({ error: someVar })
    // where someVar was assigned from error.message
    const hasResponseLeak = /new Response\(.*(?:error|err)\.(?:message|stack)/.test(withoutLogs)

    if (hasStackLeak || hasResponseLeak || hasMessageLeak) {
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

// R10 — Secure file upload handling
export async function checkFileUploadValidation(ctx: AuditContext): Promise<RuleResult> {
  // Find routes that handle file uploads (multipart or binary)
  const uploadRoutes = ctx.repoMap.files.filter((f) => {
    const p = f.path
    return p.startsWith('src/app/api/') && p.endsWith('route.ts') && (
      p.includes('upload') || p.includes('file') || p.includes('attachment') || p.includes('import')
    )
  })

  if (uploadRoutes.length === 0) {
    // No upload routes found — not applicable
    return pass('cat-3-rule-26', 5, 'No file upload routes detected — not applicable')
  }

  const findings: Finding[] = []
  for (const route of uploadRoutes) {
    let content = ''
    try { content = fs.readFileSync(join(ctx.rootPath, route.path), 'utf-8') } catch { continue }

    const hasFormData = /formData|multipart|FormData/i.test(content)
    if (!hasFormData) continue // route doesn't parse files

    const hasTypeValidation = /mimetype|mime\.lookup|fileTypeFromBuffer|magic\.detect|\.type\b|allowedTypes|contentType/i.test(content)
    const hasSizeValidation = /maxSize|MAX_SIZE|size\s*[<>]=?\s*\d|fileSizeLimit|sizeLimit/i.test(content)
    const hasPathSanitization = /path\.join|sanitizeFilename|sanitize|generateUniqueId|uuid|crypto\.random|nanoid/i.test(content)

    if (!hasTypeValidation) {
      findings.push({
        severity: 'high',
        message: `Upload route lacks MIME/content-type validation: ${route.path}`,
        filePath: route.path,
        suggestion: 'Use file-type or magic-bytes library to validate file content, not just extension',
      })
    }
    if (!hasSizeValidation) {
      findings.push({
        severity: 'medium',
        message: `Upload route lacks file size limit: ${route.path}`,
        filePath: route.path,
        suggestion: 'Add MAX_FILE_SIZE check before processing upload (SECURITY R10)',
      })
    }
    if (!hasPathSanitization && /join\(.*req|join\(.*param|join\(.*user|join\(.*body/i.test(content)) {
      findings.push({
        severity: 'critical',
        message: `Potential path traversal: user input in file path construction: ${route.path}`,
        filePath: route.path,
        suggestion: 'Sanitize filenames with sanitize-filename package or use UUID-based storage paths',
      })
    }
  }

  if (findings.length === 0) {
    return pass('cat-3-rule-26', 5, `${uploadRoutes.length} upload route(s) — validation patterns found`)
  }
  const score = findings.some((f) => f.severity === 'critical') ? 1 : findings.length <= 2 ? 3 : 2
  return fail('cat-3-rule-26', score, `File upload validation issues in ${uploadRoutes.length} route(s)`, findings)
}
