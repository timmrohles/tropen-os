// src/lib/audit/checkers/repo-map-checker.ts
import type { AuditContext, RuleResult, Finding } from '../types'
import type { FileDependency } from '@/lib/repo-map'

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

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
}

export async function checkFileSizes(ctx: AuditContext): Promise<RuleResult> {
  // Only flag files >800 lines as findings (Lovable/Bolt routinely generates 500-700 line files)
  const THRESHOLD = 800
  const WARNING_THRESHOLD = 500

  const over = ctx.repoMap.files.filter((f) =>
    !isExemptFile(f.path) && f.lineCount > WARNING_THRESHOLD
  )

  const findings: Finding[] = over.map((f) => ({
    severity: (f.lineCount > THRESHOLD ? 'medium' : 'info') as Finding['severity'],
    message: f.lineCount > THRESHOLD
      ? `${f.path} has ${f.lineCount} lines — consider splitting at the next change`
      : `${f.path} has ${f.lineCount} lines — large but not critical`,
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
    ? 'All files under 500 lines'
    : `${over.length} large file(s) (${violations.length} over ${THRESHOLD} lines)`

  return { ruleId: 'cat-1-rule-4', score, reason, findings, automated: true }
}

export async function checkInputValidationCoverage(ctx: AuditContext): Promise<RuleResult> {
  const apiRoutes = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') && f.path.endsWith('route.ts')
  )
  if (apiRoutes.length === 0) {
    return pass('cat-3-rule-2', 3, 'No API route files found to check')
  }

  const withValidation = apiRoutes.filter(
    (f) => f.imports.some((imp) => imp.symbols.includes('validateBody'))
  )
  const ratio = withValidation.length / apiRoutes.length

  const findings: Finding[] = apiRoutes
    .filter((f) => !f.imports.some((imp) => imp.symbols.includes('validateBody')))
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
    reason: `${withValidation.length}/${apiRoutes.length} API routes use validateBody (${Math.round(ratio * 100)}%)`,
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
  const ratio = apiFiles.length > 0 ? withLogger.length / apiFiles.length : 1

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
  const violations = ctx.repoMap.files.filter((f) => {
    const isClientSide = f.path.startsWith('src/components/')
      || (f.path.startsWith('src/app/') && !f.path.includes('/api/') && !f.path.includes('server'))
    const importsServiceKey = f.imports.some(
      (imp) => imp.symbols.includes('supabaseAdmin') || imp.target.includes('supabase-admin')
    )
    return isClientSide && importsServiceKey
  })

  if (violations.length === 0) {
    return pass('cat-5-rule-6', 5, 'supabaseAdmin service key not found in client-side code')
  }
  const findings: Finding[] = violations.map((f) => ({
    severity: 'critical' as const,
    message: `Service key (supabaseAdmin) imported in client-side file: ${f.path}`,
    filePath: f.path,
    suggestion: 'Move this logic to a server component or API route',
  }))
  return fail('cat-5-rule-6', 0, `${violations.length} client file(s) import supabaseAdmin service key`, findings)
}

export async function checkBudgetEnforcement(ctx: AuditContext): Promise<RuleResult> {
  const llmRoutes = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') && (
      f.path.includes('chat') || f.path.includes('image') || f.path.includes('tts')
      || f.path.includes('perspective') || f.path.includes('agent')
    )
  )
  if (llmRoutes.length === 0) {
    return pass('cat-20-rule-2', 3, 'No LLM route files found to check')
  }
  const withBudget = llmRoutes.filter(
    (f) => f.imports.some((imp) =>
      imp.symbols.includes('checkBudget') || imp.symbols.some((s) => s.includes('budget'))
    )
  )
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
      if (!/^[A-Z]/.test(nameWithoutExt) && !['page', 'layout', 'error', 'loading', 'not-found', 'global-error'].includes(nameWithoutExt)) {
        findings.push({
          severity: 'medium',
          message: `Component file not PascalCase: ${filePath}`,
          filePath,
          suggestion: `Rename to ${nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1)}.tsx`,
        })
      }
    }

    if (filePath.includes('src/hooks/') && /\.ts$/.test(fileName)) {
      // Accept both useToast.ts (camelCase) and use-toast.ts (kebab-case)
      if (!/^use[A-Z]/.test(nameWithoutExt) && !/^use-[a-z]/.test(nameWithoutExt)) {
        findings.push({
          severity: 'medium',
          message: `Hook file missing 'use' prefix: ${filePath}`,
          filePath,
          suggestion: `Rename to use${nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1)}.ts`,
        })
      }
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
  const hasTokenConfig = llmFiles.some((f) =>
    f.symbols.some((s) => s.signature?.includes('maxOutputTokens') || s.signature?.includes('max_tokens'))
  )
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
