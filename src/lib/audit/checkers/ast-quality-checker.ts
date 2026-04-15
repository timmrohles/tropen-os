// src/lib/audit/checkers/ast-quality-checker.ts
// AST-based code quality checks. All use the central ast-analyzer.

import { readFileSync } from 'fs'
import { join } from 'path'
import type { AuditContext, RuleResult, Finding } from '../types'
import { analyzeFile } from './ast-analyzer'

/** Read file content — prefer in-memory (external scans), fall back to disk */
function readContent(ctx: AuditContext, relPath: string): string | null {
  // In-memory content (from buildAuditContextFromFiles — benchmark/external scans)
  if (ctx.fileContents) {
    const content = ctx.fileContents.get(relPath)
    if (content !== undefined) return content
  }
  // Disk fallback (internal/dogfooding scans)
  if (ctx.rootPath) {
    try { return readFileSync(join(ctx.rootPath, relPath), 'utf-8') } catch { return null }
  }
  return null
}
function pass(id: string, score: number, reason: string): RuleResult {
  return { ruleId: id, score, reason, findings: [], automated: true }
}
function fail(id: string, score: number, reason: string, findings: Finding[]): RuleResult {
  return { ruleId: id, score, reason, findings, automated: true }
}

function getCodeFiles(ctx: AuditContext) {
  return ctx.repoMap.files.filter((f) =>
    (f.path.endsWith('.ts') || f.path.endsWith('.tsx')) &&
    !f.path.includes('node_modules') && !f.path.includes('.next') &&
    !f.path.includes('.test.') && !f.path.includes('.spec.') &&
    !f.path.endsWith('.d.ts')
  )
}

// ── B1: Cognitive Complexity ────────────────────────────────────────────────

export async function checkCognitiveComplexity(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []
  for (const file of getCodeFiles(ctx)) {
    const content = readContent(ctx, file.path)
    if (!content) continue
    const analysis = analyzeFile(file.path, content)
    for (const fn of analysis.functions) {
      if (fn.cognitiveComplexity > 30) {
        violations.push({ severity: 'high', message: `Function "${fn.name}" has CC=${fn.cognitiveComplexity} — very hard to maintain`, filePath: file.path, line: fn.startLine, suggestion: `Cursor-Prompt: 'Refactor ${fn.name} in ${file.path.split('/').pop()} — extract helper functions to reduce complexity below 15'` })
      } else if (fn.cognitiveComplexity > 15) {
        violations.push({ severity: 'medium', message: `Function "${fn.name}" has CC=${fn.cognitiveComplexity} — consider simplifying`, filePath: file.path, line: fn.startLine, suggestion: `Cursor-Prompt: 'Simplify ${fn.name} in ${file.path.split('/').pop()} — reduce nesting and extract conditions'` })
      }
    }
  }
  if (violations.length === 0) return pass('cat-2-rule-12', 5, 'All functions have CC ≤ 15')
  return fail('cat-2-rule-12', violations.some((v) => v.severity === 'critical') ? 1 : 2,
    `${violations.length} function(s) exceed CC threshold`, violations)
}

// ── B2: God Component Detection ─────────────────────────────────────────────

export async function checkGodComponents(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []
  for (const file of getCodeFiles(ctx)) {
    if (!file.path.endsWith('.tsx')) continue
    const content = readContent(ctx, file.path)
    if (!content) continue
    const analysis = analyzeFile(file.path, content)
    const hookCount = analysis.hookCalls.length
    const stateCount = analysis.stateHookCount
    if (analysis.lineCount > 500 && hookCount > 8) {
      violations.push({ severity: 'high', message: `God component: ${analysis.lineCount} lines, ${hookCount} hooks`, filePath: file.path, suggestion: 'Split into smaller components with custom hooks' })
    } else if (analysis.lineCount > 300 && hookCount > 5) {
      violations.push({ severity: 'medium', message: `Large component: ${analysis.lineCount} lines, ${hookCount} hooks`, filePath: file.path, suggestion: 'Extract logic into custom hooks' })
    }
    if (stateCount > 7) {
      violations.push({ severity: 'medium', message: `Component has ${stateCount} state hooks — consider useReducer`, filePath: file.path, suggestion: 'Consolidate state with useReducer or a state machine' })
    }
  }
  if (violations.length === 0) return pass('cat-1-rule-10', 5, 'No god components detected')
  return fail('cat-1-rule-10', 2, `${violations.length} oversized component(s)`, violations)
}

// ── B3: Error Handling Analysis ─────────────────────────────────────────────

export async function checkErrorHandling(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []
  for (const file of getCodeFiles(ctx)) {
    const content = readContent(ctx, file.path)
    if (!content) continue
    const analysis = analyzeFile(file.path, content)
    // Empty catch blocks
    for (const cb of analysis.catchBlocks) {
      if (cb.isEmpty) {
        violations.push({ severity: 'high', message: 'Empty catch block — errors silently swallowed', filePath: file.path, line: cb.line, suggestion: 'Log the error or handle it explicitly' })
      } else if (cb.hasOnlyConsoleLog && !cb.hasRethrow) {
        violations.push({ severity: 'medium', message: 'Catch block only has console.log — use structured logger', filePath: file.path, line: cb.line, suggestion: 'Replace console.log with createLogger() from @/lib/logger' })
      }
    }
    // API routes without try-catch
    if (file.path.includes('/api/') && file.path.endsWith('route.ts') && !analysis.hasTryCatch) {
      violations.push({ severity: 'high', message: 'API route has no try-catch — unhandled errors crash the request', filePath: file.path, suggestion: 'Wrap route handler in try-catch with apiError()' })
    }
  }
  if (violations.length === 0) return pass('cat-2-rule-10', 5, 'Error handling looks solid')
  return fail('cat-2-rule-10', violations.some((v) => v.severity === 'high') ? 2 : 3,
    `${violations.length} error handling issue(s)`, violations)
}

// ── B4: Hardcoded Secrets ───────────────────────────────────────────────────

const SECRET_PATTERNS = [
  { name: 'Stripe Live Key', pattern: /^sk_live_/ },
  { name: 'Stripe Publishable', pattern: /^pk_live_/ },
  { name: 'Google API Key', pattern: /^AIza[0-9A-Za-z\-_]{35}$/ },
  { name: 'GitHub Token', pattern: /^ghp_[a-zA-Z0-9]{36}$/ },
  { name: 'OpenAI Key', pattern: /^sk-[a-zA-Z0-9]{20,}$/ },
  { name: 'Anthropic Key', pattern: /^sk-ant-/ },
  { name: 'AWS Access Key', pattern: /^AKIA[0-9A-Z]{16}$/ },
  { name: 'Supabase Service Key', pattern: /^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\./ },
]

export async function checkHardcodedSecrets(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []
  for (const file of getCodeFiles(ctx)) {
    if (file.path.includes('.env') || file.path.includes('.test.')) continue
    const content = readContent(ctx, file.path)
    if (!content) continue
    const analysis = analyzeFile(file.path, content)
    for (const lit of analysis.stringLiterals) {
      for (const sp of SECRET_PATTERNS) {
        if (sp.pattern.test(lit.value)) {
          violations.push({ severity: 'critical', message: `Hardcoded ${sp.name} in source code`, filePath: file.path, line: lit.line, suggestion: 'Move to environment variable (.env.local)' })
          break
        }
      }
    }
  }
  if (violations.length === 0) return pass('cat-3-rule-30', 5, 'No hardcoded secrets detected')
  return fail('cat-3-rule-30', 0, `${violations.length} hardcoded secret(s) found!`, violations)
}

// ── B5: Circular Import Detection ───────────────────────────────────────────

export async function checkCircularImports(ctx: AuditContext): Promise<RuleResult> {
  // Build import graph from all code files
  const graph = new Map<string, Set<string>>()
  for (const file of getCodeFiles(ctx)) {
    const content = readContent(ctx, file.path)
    if (!content) continue
    const analysis = analyzeFile(file.path, content)
    const deps = new Set<string>()
    for (const imp of analysis.imports) {
      if (imp.source.startsWith('.') || imp.source.startsWith('@/')) {
        deps.add(imp.source)
      }
    }
    graph.set(file.path, deps)
  }

  // DFS cycle detection (simplified — detects direct + 1-hop cycles)
  const cycles: string[][] = []
  const visited = new Set<string>()
  for (const [file, deps] of graph) {
    for (const dep of deps) {
      const depFile = resolveImport(dep, file, graph)
      if (!depFile) continue
      const depDeps = graph.get(depFile)
      if (depDeps) {
        for (const depDep of depDeps) {
          const resolved = resolveImport(depDep, depFile, graph)
          if (resolved === file && !visited.has(`${file}→${depFile}`)) {
            cycles.push([file, depFile])
            visited.add(`${file}→${depFile}`)
            visited.add(`${depFile}→${file}`)
          }
        }
      }
    }
  }

  if (cycles.length === 0) return pass('cat-1-rule-11', 5, 'No circular imports detected')
  const findings: Finding[] = cycles.slice(0, 10).map(([a, b]) => ({
    severity: 'medium' as const, message: `Circular import: ${a} ↔ ${b}`,
    filePath: a, suggestion: 'Break the cycle by extracting shared types or using dependency injection',
  }))
  return fail('cat-1-rule-11', 2, `${cycles.length} circular import(s)`, findings)
}

function resolveImport(source: string, from: string, graph: Map<string, Set<string>>): string | null {
  // Simple resolution — check if any graph key ends with the import path
  const normalized = source.replace(/^@\//, 'src/').replace(/^\.\//, '')
  for (const key of graph.keys()) {
    if (key.endsWith(normalized + '.ts') || key.endsWith(normalized + '.tsx') ||
        key.endsWith(normalized + '/index.ts') || key.endsWith(normalized + '/index.tsx')) {
      return key
    }
  }
  return null
}

// ── B6: any-Type Usage ──────────────────────────────────────────────────────

export async function checkAnyUsage(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []
  for (const file of getCodeFiles(ctx)) {
    const content = readContent(ctx, file.path)
    if (!content) continue
    const analysis = analyzeFile(file.path, content)
    if (analysis.anyUsages.length > 10) {
      violations.push({ severity: 'high', message: `${analysis.anyUsages.length} \`any\` usages in one file`, filePath: file.path, suggestion: 'Replace any with proper types or unknown' })
    } else if (analysis.anyUsages.length > 3) {
      violations.push({ severity: 'medium', message: `${analysis.anyUsages.length} \`any\` usages`, filePath: file.path, suggestion: 'Reduce any usage — use unknown or specific types' })
    }
  }
  if (violations.length === 0) return pass('cat-2-rule-13', 5, 'Minimal any usage')
  return fail('cat-2-rule-13', violations.some((v) => v.severity === 'high') ? 2 : 3,
    `${violations.length} file(s) with excessive any usage`, violations)
}

// ── B7: N+1 Query Detection ─────────────────────────────────────────────────

const DB_CALL_PATTERNS = /supabase\w*\.from|prisma\.\w+\.(find|create|update|delete)|\.query\(|fetch\s*\(/

export async function checkNPlusOneQueries(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []
  for (const file of getCodeFiles(ctx)) {
    const content = readContent(ctx, file.path)
    if (!content) continue
    const lines = content.split('\n')
    // Find loops containing DB/API calls
    let inLoop = false
    let loopStart = 0
    let braceDepth = 0
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (/\b(for\s*\(|\.map\s*\(|\.forEach\s*\(|while\s*\()/.test(line)) {
        inLoop = true
        loopStart = i + 1
        braceDepth = 0
      }
      if (inLoop) {
        braceDepth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length
        if (DB_CALL_PATTERNS.test(line)) {
          violations.push({ severity: 'high', message: 'Potential N+1 query: DB/API call inside loop', filePath: file.path, line: i + 1, suggestion: 'Batch the query outside the loop (e.g. WHERE id IN ...)' })
          inLoop = false
        }
        if (braceDepth <= 0) inLoop = false
      }
    }
  }
  if (violations.length === 0) return pass('cat-5-rule-15', 5, 'No N+1 query patterns detected')
  return fail('cat-5-rule-15', 2, `${violations.length} potential N+1 quer(ies)`, violations)
}

// ── B8: Missing Error Boundary ──────────────────────────────────────────────

export async function checkErrorBoundary(ctx: AuditContext): Promise<RuleResult> {
  const files = ctx.repoMap.files.map((f) => f.path)
  const hasErrorTsx = files.some((f) => f.endsWith('error.tsx') || f.endsWith('error.jsx'))
  const hasGlobalError = files.some((f) => f.includes('global-error'))
  const hasErrorBoundaryPkg = Object.keys({
    ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies,
  }).includes('react-error-boundary')

  if (hasErrorTsx && hasGlobalError) {
    return pass('cat-2-rule-11', 5, 'Error boundaries found (error.tsx + global-error)')
  }
  if (hasErrorTsx || hasErrorBoundaryPkg) {
    return pass('cat-2-rule-11', 4, 'Partial error boundary coverage')
  }
  return fail('cat-2-rule-11', 1, 'No error boundary found', [{
    severity: 'medium', message: 'No error.tsx or react-error-boundary — unhandled errors show blank page',
    suggestion: 'Create src/app/error.tsx and src/app/global-error.tsx for graceful error handling',
    fixHint: 'Add error.tsx with "use client" + Error component showing fallback UI',
  }])
}
