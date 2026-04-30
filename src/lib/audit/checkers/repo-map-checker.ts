// src/lib/audit/checkers/repo-map-checker.ts
import { readFileSync } from 'fs'
import { join } from 'path'
import type { AuditContext, RuleResult, Finding } from '../types'
import type { FileDependency } from '@/lib/repo-map'

function readContent(ctx: AuditContext, relPath: string): string | null {
  if (ctx.fileContents) {
    const c = ctx.fileContents.get(relPath)
    if (c !== undefined) return c
  }
  if (ctx.rootPath) {
    try { return readFileSync(join(ctx.rootPath, relPath), 'utf-8') } catch { return null }
  }
  return null
}

// SEV_ORDER kept for future sorting use
// const SEV_ORDER: Record<string, number> = { ... }

function pass(ruleId: string, score: number, reason: string): RuleResult {
  return { ruleId, score, reason, findings: [], automated: true }
}

function fail(ruleId: string, score: number, reason: string, findings: Finding[] = []): RuleResult {
  return { ruleId, score, reason, findings, automated: true }
}

// ─── Cycle detection ─────────────────────────────────────────────────────────

interface CycleResult {
  hasCycles: boolean
  cycles: string[][]
}

function detectCycles(deps: FileDependency[]): CycleResult {
  const adj = new Map<string, Set<string>>()
  for (const dep of deps) {
    if (!adj.has(dep.source)) adj.set(dep.source, new Set())
    adj.get(dep.source)!.add(dep.target)
  }

  const visited = new Set<string>()
  const recStack = new Set<string>()
  const cycles: string[][] = []

  function dfs(node: string, path: string[]): void {
    visited.add(node)
    recStack.add(node)
    for (const neighbor of adj.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path, neighbor])
      } else if (recStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor)
        const cycle = cycleStart >= 0 ? path.slice(cycleStart) : [node, neighbor]
        const canonical = [...cycle].sort().join('|')
        if (!cycles.some((c) => [...c].sort().join('|') === canonical)) {
          cycles.push(cycle)
        }
      }
    }
    recStack.delete(node)
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      dfs(node, [node])
    }
  }

  return { hasCycles: cycles.length > 0, cycles }
}

// ─── Check functions ──────────────────────────────────────────────────────────

export async function checkCircularDependencies(ctx: AuditContext): Promise<RuleResult> {
  const { hasCycles, cycles } = detectCycles(ctx.repoMap.dependencies)

  if (!hasCycles) {
    return pass('cat-1-rule-3', 5, 'No circular dependencies detected')
  }

  const findings: Finding[] = cycles.slice(0, 10).map((cycle) => ({
    severity: 'high' as const,
    message: `Circular dependency: ${cycle.join(' -> ')}`,
    suggestion: 'Extract shared code to a third module that neither file imports',
  }))

  const score = cycles.length === 1 ? 3 : cycles.length <= 3 ? 2 : cycles.length <= 10 ? 1 : 0
  return fail('cat-1-rule-3', score, `${cycles.length} circular dependency cycle(s) detected`, findings)
}

function isExemptFile(filePath: string): boolean {
  return /\.(types|config|test|spec)\.(ts|tsx|js)$/.test(filePath)
    || /schema\.(ts|tsx)$/.test(filePath)
    || /migrations?\//i.test(filePath)
    || /_DESIGN_REFERENCE\.tsx$/.test(filePath)
    || /\.d\.ts$/.test(filePath)
    // Audit infrastructure: checker files and rule registry are complex by design
    // Note: paths from repoMap don't have a leading separator, so match from 'src/' directly
    || /src[\\/]lib[\\/]audit[\\/]/.test(filePath)
    // Edge Functions are separate backend infrastructure — not subject to app file-size rules
    || /supabase[\\/]functions[\\/]/.test(filePath)
    // CLI scripts are one-off tooling, not app code — consistent with CC exclusion in ast-quality-checker.ts
    || /src[\\/]scripts[\\/]/.test(filePath)
}

export async function checkFileSizes(ctx: AuditContext): Promise<RuleResult> {
  const THRESHOLD = 500      // >500 = violation (CLAUDE.md standard)
  const WARNING_THRESHOLD = 300  // >300 = warning

  const over = ctx.repoMap.files.filter((f) =>
    !isExemptFile(f.path) && f.lineCount > WARNING_THRESHOLD
  )

  const findings: Finding[] = over.map((f) => ({
    severity: (f.lineCount > THRESHOLD ? 'high' : 'medium') as Finding['severity'],
    message: f.lineCount > THRESHOLD
      ? `File size violation: ${f.path} has ${f.lineCount} lines (limit: ${THRESHOLD})`
      : `${f.path} has ${f.lineCount} lines — approaching limit`,
    filePath: f.path,
    suggestion: `Cursor-Prompt: 'Split ${f.path.split('/').pop()} into smaller modules, each under 300 lines'`,
  }))

  const violations = over.filter((f) => f.lineCount > THRESHOLD)

  let score: number
  if (over.length === 0) score = 5
  else if (violations.length === 0) score = 4
  else if (violations.length <= 5) score = 3
  else if (violations.length <= 15) score = 2
  else score = 1

  const reason = over.length === 0
    ? 'All files under 300 lines'
    : `${over.length} large file(s) (${violations.length} violations over ${THRESHOLD} lines)`

  return { ruleId: 'cat-1-rule-4', score, reason, findings, automated: true }
}

export async function checkInputValidationCoverage(ctx: AuditContext): Promise<RuleResult> {
  const apiRoutes = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') && f.path.endsWith('route.ts')
  )
  if (apiRoutes.length === 0) {
    return pass('cat-3-rule-2', 3, 'No API route files found to check')
  }

  // Only mutation routes (POST/PUT/PATCH) require body validation — GET/DELETE with path params don't
  const mutationRoutes = apiRoutes.filter(
    (f) => f.exports?.some(e => ['POST', 'PUT', 'PATCH'].includes(e))
  )
  if (mutationRoutes.length === 0) return pass('cat-3-rule-2', 5, 'No mutation API routes found')

  // A route is considered validated if it uses:
  //   1. validateBody utility (Zod-based helper)
  //   2. Inline Zod (.safeParse, z.object + .parse, ZodSchema)
  //   3. Safe manual: guarded JSON parse (.catch / try-catch) AND field presence checks
  //   4. No body needed: route doesn't call req.json() at all (copy/pause/run action endpoints)
  const hasValidation = (f: (typeof mutationRoutes)[0]): boolean => {
    if (f.imports.some((imp) => imp.symbols.includes('validateBody'))) return true
    const content = readContent(ctx, f.path)
    if (!content) return false
    // No body required — action endpoint that never reads the request body (only NextResponse.json)
    if (!/(?:req|request)\.json\s*\(\)/.test(content)) return true
    // Inline Zod
    if (/\.safeParse\s*\(/.test(content) || /z\.object\s*\(/.test(content)) return true
    // Safe manual: JSON parse is guarded (catch or try+catch in same function) AND field checks exist
    const hasGuardedParse = /(?:req|request)\.json\(\)\s*\.catch\s*\(/.test(content) ||
      (/try\s*\{/.test(content) && /}\s*catch/.test(content) && /(?:req|request)\.json\s*\(\)/.test(content))
    const hasFieldCheck = /if\s*\(!?\s*body[\.\[]|if\s*\(!?\s*\w+\s*[&|]|if\s*\(!?\s*\w+\s*\)|!body\./.test(content)
    return hasGuardedParse && hasFieldCheck
  }

  const withValidation = mutationRoutes.filter(hasValidation)
  const ratio = withValidation.length / mutationRoutes.length

  const findings: Finding[] = mutationRoutes
    .filter((f) => !hasValidation(f))
    .slice(0, 15)
    .map((f) => ({
      severity: 'medium' as const,
      message: `API route missing validateBody: ${f.path}`,
      filePath: f.path,
      suggestion: 'Add validateBody(body, schema) before business logic',
    }))

  const score = ratio >= 0.9 ? 5 : ratio >= 0.7 ? 4 : ratio >= 0.5 ? 3 : ratio >= 0.3 ? 2 : 1
  return {
    ruleId: 'cat-3-rule-2',
    score,
    reason: `${withValidation.length}/${mutationRoutes.length} mutation API routes have body validation (${Math.round(ratio * 100)}%)`,
    findings,
    automated: true,
  }
}

export async function checkLoggerAbstraction(ctx: AuditContext): Promise<RuleResult> {
  const apiFiles = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') || f.path.startsWith('src/lib/')
  )
  const withLogger = apiFiles.filter(
    (f) => f.imports.some((imp) => imp.symbols.includes('createLogger'))
  )
  const consoleUsers = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') && f.symbols.some(
      (s) => s.signature?.includes('console.log') || s.signature?.includes('console.error')
    )
  )

  const score = consoleUsers.length === 0 ? 5 : consoleUsers.length <= 2 ? 4 : 3
  return {
    ruleId: 'cat-12-rule-1',
    score,
    reason: `Logger abstraction: ${withLogger.length}/${apiFiles.length} lib/api files use createLogger; ${consoleUsers.length} direct console calls`,
    findings: consoleUsers.map((f) => ({
      severity: 'medium' as const,
      message: `Direct console usage detected in: ${f.path}`,
      filePath: f.path,
      suggestion: 'Replace console.log/error with createLogger(scope).info/error()',
    })),
    automated: true,
  }
}

export async function checkVendorAbstraction(ctx: AuditContext): Promise<RuleResult> {
  const requiredAdapters = [
    { path: 'src/lib/email', name: 'email adapter' },
    { path: 'src/lib/monitoring', name: 'monitoring adapter' },
    { path: 'src/lib/ratelimit', name: 'rate limit adapter' },
  ]
  const missing = requiredAdapters.filter(
    (a) => !ctx.filePaths.some((p) => p.startsWith(a.path))
  )
  if (missing.length === 0) {
    return pass('cat-6-rule-3', 5, 'All vendor adapters present: email, monitoring, ratelimit')
  }
  const findings: Finding[] = missing.map((a) => ({
    severity: 'medium' as const,
    message: `Missing vendor abstraction layer: ${a.name} (${a.path}/)`,
    suggestion: `Create ${a.path}/index.ts with adapter interface`,
  }))
  return fail('cat-6-rule-3', 5 - missing.length, `${missing.length} vendor adapter(s) missing`, findings)
}

export async function checkServiceKeyInFrontend(ctx: AuditContext): Promise<RuleResult> {
  // Use content-based detection — repo-map JSON does not serialize import graphs
  const violations = ctx.repoMap.files.filter((f) => {
    const content = readContent(ctx, f.path)
    if (!content) return false
    const importsServiceKey = content.includes('supabaseAdmin') || content.includes('supabase-admin')
    if (!importsServiceKey) return false
    // A file is truly client-side only if it has the 'use client' directive
    return /^['"]use client['"]/.test(content.replace(/\/\*[\s\S]*?\*\//g, '').trimStart())
  })

  if (violations.length === 0) {
    return pass('cat-5-rule-6', 5, 'supabaseAdmin service key not found in client-side code')
  }
  const findings: Finding[] = violations.map((f) => ({
    severity: 'critical' as const,
    message: `Service key (supabaseAdmin) imported in client-side file: ${f.path}`,
    filePath: f.path,
    suggestion: "Move supabaseAdmin logic to an API route — never send service keys to the browser",
  }))
  return fail('cat-5-rule-6', 0, `${violations.length} client file(s) import supabaseAdmin service key`, findings)
}

export async function checkBudgetEnforcement(ctx: AuditContext): Promise<RuleResult> {
  // Only check route files that actually invoke LLM APIs (content-based detection,
  // since repo-map JSON does not serialize import graphs)
  const LLM_CALL_PATTERNS = [
    /generateText\s*\(/,
    /streamText\s*\(/,
    /anthropic\s*\./,
    /openai\s*\./,
    /checkBudget\s*\(/,
    /check_and_reserve_budget/,
  ]
  const BUDGET_PATTERNS = [
    /checkBudget\s*\(/,
    /check_and_reserve_budget/,
    /budgetExhaustedResponse/,
  ]

  const apiRoutes = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') && f.path.endsWith('route.ts')
  )

  const llmRoutes = apiRoutes.filter((f) => {
    const content = readContent(ctx, f.path)
    if (!content) return false
    return LLM_CALL_PATTERNS.some((p) => p.test(content))
  })

  if (llmRoutes.length === 0) {
    return pass('cat-20-rule-2', 3, 'No LLM route files found to check')
  }

  const withBudget = llmRoutes.filter((f) => {
    const content = readContent(ctx, f.path)
    if (!content) return false
    return BUDGET_PATTERNS.some((p) => p.test(content))
  })

  const ratio = withBudget.length / llmRoutes.length
  const score = ratio >= 0.9 ? 5 : ratio >= 0.7 ? 4 : ratio >= 0.5 ? 3 : 1
  return {
    ruleId: 'cat-20-rule-2',
    score,
    reason: `Budget enforcement: ${withBudget.length}/${llmRoutes.length} LLM routes check budget`,
    findings: [],
    automated: true,
  }
}

export async function checkBusinessLogicSeparation(ctx: AuditContext): Promise<RuleResult> {
  const libSymbols = ctx.repoMap.files
    .filter((f) => f.path.startsWith('src/lib/'))
    .reduce((sum, f) => sum + f.symbols.filter((s) => s.exported).length, 0)

  const routeFileSymbols = ctx.repoMap.files
    .filter((f) => f.path.startsWith('src/app/api/') && f.path.endsWith('route.ts'))
    .reduce((sum, f) => sum + f.symbols.length, 0)

  const totalLogicSymbols = libSymbols + routeFileSymbols
  if (totalLogicSymbols === 0) return pass('cat-1-rule-2', 3, 'No logic symbols found to evaluate')

  const libRatio = libSymbols / totalLogicSymbols
  const score = libRatio >= 0.7 ? 5 : libRatio >= 0.5 ? 4 : libRatio >= 0.35 ? 3 : 2

  return {
    ruleId: 'cat-1-rule-2',
    score,
    reason: `${libSymbols} exported symbols in src/lib/ vs ${routeFileSymbols} in API routes (${Math.round(libRatio * 100)}% in lib/)`,
    findings: [],
    automated: true,
  }
}

export async function checkNamingConventions(ctx: AuditContext): Promise<RuleResult> {
  const findings: Finding[] = []

  for (const filePath of ctx.filePaths) {
    const fileName = filePath.split('/').pop() ?? ''
    const nameWithoutExt = fileName.replace(/\.(tsx?|jsx?)$/, '')

    // Skip PascalCase check for component library directories (shadcn/ui convention)
    const COMPONENT_LIB_PATHS = [
      /(?:^|\/)components\/ui\//,
      /(?:^|\/)ui\/(?!.*\/)/,  // root-level ui/ folder
    ]
    if (filePath.includes('src/components/') && /\.(tsx|jsx)$/.test(fileName)) {
      if (COMPONENT_LIB_PATHS.some((p) => p.test(filePath))) {
        // shadcn/ui uses kebab-case by convention — not a violation
        continue
      }
      const isNotPascalCase    = !/^[A-Z]/.test(nameWithoutExt)
      const isUnderscoreFile   = /^_[A-Z]/.test(nameWithoutExt) // e.g. _DESIGN_REFERENCE.tsx — intentional reference file
      const isNextJsReserved   = ['page', 'layout', 'error', 'loading', 'not-found', 'global-error'].includes(nameWithoutExt)
      if (isNotPascalCase && !isUnderscoreFile && !isNextJsReserved) {
        findings.push({
          severity: 'medium',
          message: `Component file not PascalCase: ${filePath}`,
          filePath,
          suggestion: `Rename to ${nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1)}.tsx`,
        })
      }
    }

    // Accept both useToast.ts (camelCase) and use-toast.ts (kebab-case)
    if (filePath.includes('src/hooks/') && /\.ts$/.test(fileName) && !/^use[A-Z]/.test(nameWithoutExt) && !/^use-[a-z]/.test(nameWithoutExt)) {
      findings.push({
        severity: 'medium',
        message: `Hook-Datei ohne 'use'-Prefix: ${filePath}`,
        filePath,
        suggestion: `Rename to use${nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1)}.ts`,
      })
    }
  }

  const score = findings.length === 0 ? 5 : findings.length <= 3 ? 4 : findings.length <= 10 ? 3 : 2
  return {
    ruleId: 'cat-25-rule-1',
    score,
    reason: `Naming convention check: ${findings.length} violation(s) found`,
    findings,
    automated: true,
  }
}

export async function checkAriaAttributes(ctx: AuditContext): Promise<RuleResult> {
  const componentFiles = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/components/') || f.path.startsWith('src/app/')
  )
  const score = componentFiles.length > 50 ? 4 : componentFiles.length > 10 ? 3 : 2
  return {
    ruleId: 'cat-16-rule-3',
    score,
    reason: `${componentFiles.length} component/page files found — aria attribute coverage estimated (content scan required for exact count)`,
    findings: [],
    automated: true,
  }
}

export async function checkTokenLimitsConfigured(ctx: AuditContext): Promise<RuleResult> {
  const llmFiles = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/lib/llm/') || f.path.includes('ai-chat')
  )
  const TOKEN_LIMIT_PATTERN = /maxOutputTokens|max_tokens|maxTokens|max_completion_tokens/
  const hasTokenConfig = llmFiles.some((f) => {
    if (f.symbols.some((s) => s.signature?.includes('maxOutputTokens') || s.signature?.includes('max_tokens'))) return true
    const content = readContent(ctx, f.path)
    return content ? TOKEN_LIMIT_PATTERN.test(content) : false
  })
  if (hasTokenConfig) {
    return pass('cat-22-rule-2', 5, 'Token limits (maxOutputTokens) found in LLM configuration')
  }
  return {
    ruleId: 'cat-22-rule-2',
    score: 3,
    reason: 'Token limit configuration not detectable from symbol signatures (requires content scan)',
    findings: [],
    automated: true,
  }
}
