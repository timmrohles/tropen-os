// src/lib/audit/checkers/gap-checkers.ts
// New checkers from gap analysis: .env.example, TODO/FIXME, promises, loading states.

import { readFileSync } from 'fs'
import { join } from 'path'
import type { AuditContext, RuleResult, Finding } from '../types'

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

function pass(id: string, score: number, reason: string): RuleResult {
  return { ruleId: id, score, reason, findings: [], automated: true }
}

function fail(id: string, score: number, reason: string, findings: Finding[]): RuleResult {
  return { ruleId: id, score, reason, findings, automated: true }
}

function codeFiles(ctx: AuditContext) {
  return ctx.repoMap.files.filter((f) =>
    (f.path.endsWith('.ts') || f.path.endsWith('.tsx') || f.path.endsWith('.js') || f.path.endsWith('.jsx')) &&
    !f.path.includes('node_modules') && !f.path.includes('.next') &&
    !f.path.includes('.test.') && !f.path.includes('.spec.') &&
    !f.path.endsWith('.d.ts')
  )
}

// ── Missing .env.example ────────────────────────────────────────────────────

export async function checkEnvExample(ctx: AuditContext): Promise<RuleResult> {
  // Collect all process.env.X references
  const envVars = new Set<string>()
  for (const file of codeFiles(ctx)) {
    const content = readContent(ctx, file.path)
    if (!content) continue
    const matches = content.matchAll(/process\.env\.(\w+)/g)
    for (const m of matches) envVars.add(m[1])
  }

  if (envVars.size === 0) {
    return pass('cat-14-rule-7', 5, 'No process.env usage found')
  }

  // Check if .env.example exists
  const hasExample = ctx.filePaths.some((p) =>
    p.endsWith('.env.example') || p.endsWith('env.example')
  )

  if (hasExample) {
    return pass('cat-14-rule-7', 5, `.env.example exists (${envVars.size} env vars used)`)
  }

  return fail('cat-14-rule-7', 2, `${envVars.size} env vars used but no .env.example`, [{
    severity: 'medium',
    message: `${envVars.size} environment variables used but no .env.example — new developers can't start the project`,
    suggestion: "Cursor-Prompt: 'Create .env.example listing all required environment variables without values'",
    agentSource: 'dependencies',
  }])
}

// ── TODO/FIXME without ticket ───────────────────────────────────────────────

export async function checkTodoComments(ctx: AuditContext): Promise<RuleResult> {
  const TODO_PATTERN = /\/\/\s*(TODO|FIXME|HACK)\b/gi
  const HAS_TICKET = /(?:#\d+|[A-Z]+-\d+)/
  let totalTodos = 0
  const filesWithTodos: string[] = []

  for (const file of codeFiles(ctx)) {
    const content = readContent(ctx, file.path)
    if (!content) continue
    const lines = content.split('\n')
    let fileTodos = 0
    for (const line of lines) {
      if (TODO_PATTERN.test(line) && !HAS_TICKET.test(line)) {
        fileTodos++
      }
      TODO_PATTERN.lastIndex = 0 // reset regex
    }
    if (fileTodos > 0) {
      totalTodos += fileTodos
      filesWithTodos.push(file.path)
    }
  }

  if (totalTodos <= 3) {
    return pass('cat-18-rule-6', totalTodos === 0 ? 5 : 4,
      totalTodos === 0 ? 'No untracked TODOs' : `Only ${totalTodos} TODO(s) — acceptable`)
  }

  return fail('cat-18-rule-6', totalTodos > 10 ? 2 : 3,
    `${totalTodos} TODO/FIXME without ticket reference`, [{
      severity: 'info',
      message: `${totalTodos} open TODO/FIXME comments without ticket reference — technical debt that's easy to forget`,
      suggestion: "Cursor-Prompt: 'List all TODO and FIXME comments, create GitHub issues for each, then replace with issue numbers'",
      affectedFiles: filesWithTodos.slice(0, 10),
    }])
}

// ── Unhandled Promise Rejections ────────────────────────────────────────────

export async function checkUnhandledPromises(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []

  for (const file of codeFiles(ctx)) {
    const content = readContent(ctx, file.path)
    if (!content) continue
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Pattern: .then( without .catch( in nearby lines
      if (/\.then\s*\(/.test(line) && !/\.catch\s*\(/.test(line)) {
        // Check next 3 lines for .catch
        const nearby = lines.slice(i, i + 4).join(' ')
        if (!/\.catch\s*\(/.test(nearby) && !/\.finally\s*\(/.test(nearby)) {
          violations.push({
            severity: 'medium',
            message: `.then() without .catch() — unhandled rejection can crash silently`,
            filePath: file.path,
            line: i + 1,
            suggestion: `Cursor-Prompt: 'Add .catch() error handling to the promise chain in ${file.path.split('/').pop()} line ${i + 1}'`,
          })
        }
      }
    }
  }

  if (violations.length === 0) {
    return pass('cat-6-rule-8', 5, 'All promise chains have error handling')
  }
  return fail('cat-6-rule-8', violations.length > 5 ? 2 : 3,
    `${violations.length} unhandled promise chain(s)`, violations.slice(0, 15))
}

// ── Missing Loading States ──────────────────────────────────────────────────

export async function checkLoadingStates(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []
  const QUERY_HOOKS = /\b(useQuery|useSWR|useMutation|useInfiniteQuery)\b/
  const LOADING_INDICATORS = /\b(isLoading|isPending|isFetching|loading|Skeleton|Spinner|LoadingState)\b/

  for (const file of codeFiles(ctx)) {
    if (!file.path.endsWith('.tsx')) continue
    const content = readContent(ctx, file.path)
    if (!content) continue

    if (QUERY_HOOKS.test(content) && !LOADING_INDICATORS.test(content)) {
      violations.push({
        severity: 'medium',
        message: `${file.path.split('/').pop()} uses data fetching hooks but shows no loading state — users see a blank page while data loads`,
        filePath: file.path,
        suggestion: `Cursor-Prompt: 'Add loading skeleton to ${file.path.split('/').pop()} while data is being fetched'`,
      })
    }
  }

  if (violations.length === 0) {
    return pass('cat-9-rule-4', 5, 'All data-fetching components handle loading state')
  }
  return fail('cat-9-rule-4', violations.length > 5 ? 2 : 3,
    `${violations.length} component(s) without loading state`, violations.slice(0, 10))
}
