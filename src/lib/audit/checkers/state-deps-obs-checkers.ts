// src/lib/audit/checkers/state-deps-obs-checkers.ts
// Fills gaps: cat-9 (State Management), cat-14 (Dependencies), cat-12 (Observability).

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

// ── cat-9-rule-5: useEffect + fetch without cache layer ─────────────────────

export async function checkFetchInEffect(ctx: AuditContext): Promise<RuleResult> {
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  const hasCacheLib = '@tanstack/react-query' in deps || 'swr' in deps || 'react-query' in deps

  if (hasCacheLib) {
    return pass('cat-9-rule-5', 5, 'Cache layer installed (React Query or SWR)')
  }

  const violations: Finding[] = []
  for (const file of ctx.repoMap.files) {
    if (!file.path.endsWith('.tsx') && !file.path.endsWith('.ts')) continue
    const content = readContent(ctx, file.path)
    if (!content) continue

    // useEffect with fetch/axios inside
    const hasUseEffect = /useEffect\s*\(/.test(content)
    const hasFetchInside = hasUseEffect && /(?:fetch\s*\(|axios\.|\.get\s*\(|\.post\s*\()/.test(content)

    if (hasFetchInside) {
      violations.push({
        severity: 'medium',
        message: `fetch() in useEffect without cache layer — re-fetches on every render`,
        filePath: file.path,
        suggestion: "Cursor-Prompt: 'Replace useEffect + fetch with useQuery from @tanstack/react-query'",
      })
    }
  }

  if (violations.length === 0) return pass('cat-9-rule-5', 4, 'No uncached fetch-in-useEffect patterns')
  return fail('cat-9-rule-5', violations.length > 5 ? 1 : 2,
    `${violations.length} component(s) fetch data in useEffect without caching`, violations.slice(0, 10))
}

// ── cat-9-rule-6: Too many props (prop drilling indicator) ──────────────────

export async function checkPropDrilling(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []

  for (const file of ctx.repoMap.files) {
    if (!file.path.endsWith('.tsx')) continue
    const content = readContent(ctx, file.path)
    if (!content) continue

    // Count destructured props in function components
    const propMatch = content.match(/function\s+\w+\s*\(\s*\{([^}]+)\}\s*[):]/)
      ?? content.match(/(?:const|let)\s+\w+\s*=\s*(?:\([^)]*\)\s*=>|function)\s*\(\s*\{([^}]+)\}\s*[):]/)
    if (!propMatch) continue

    const propCount = propMatch[1].split(',').filter(p => p.trim()).length
    if (propCount > 7) {
      const name = file.path.split('/').pop() ?? file.path
      violations.push({
        severity: 'info',
        message: `${name} has ${propCount} props — possible prop drilling, consider Context or Zustand`,
        filePath: file.path,
        suggestion: `Cursor-Prompt: 'Analyze if ${name} would benefit from React Context or Zustand for shared state'`,
      })
    }
  }

  if (violations.length === 0) return pass('cat-9-rule-6', 5, 'No excessive prop drilling detected')
  return fail('cat-9-rule-6', violations.length > 5 ? 2 : 3,
    `${violations.length} component(s) with >7 props`, violations.slice(0, 10))
}

// ── cat-9-rule-7: Server data in global store ───────────────────────────────

export async function checkServerStateInStore(ctx: AuditContext): Promise<RuleResult> {
  const storeFiles = ctx.repoMap.files.filter(f =>
    (f.path.includes('store') || f.path.includes('Store')) &&
    (f.path.endsWith('.ts') || f.path.endsWith('.tsx'))
  )

  if (storeFiles.length === 0) return pass('cat-9-rule-7', 5, 'No store files found')

  const violations: Finding[] = []
  for (const file of storeFiles) {
    const content = readContent(ctx, file.path)
    if (!content) continue

    if (/fetch\s*\(|axios\.|supabase\w*\.from|\.query\(/.test(content)) {
      violations.push({
        severity: 'info',
        message: `Store file fetches API data — React Query/SWR handles server state better`,
        filePath: file.path,
        suggestion: `Cursor-Prompt: 'Move API calls from ${file.path.split('/').pop()} to React Query hooks, keep only UI state in the store'`,
      })
    }
  }

  if (violations.length === 0) return pass('cat-9-rule-7', 5, 'Stores don\'t fetch server data')
  return fail('cat-9-rule-7', 3, `${violations.length} store(s) mixing server and UI state`, violations)
}

// ── cat-14-rule-8: Outdated major versions ──────────────────────────────────

export async function checkOutdatedMajorVersions(ctx: AuditContext): Promise<RuleResult> {
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  const violations: Finding[] = []

  function getMajor(version: string | undefined): number | null {
    if (!version) return null
    const clean = version.replace(/[\^~>=<\s]/g, '')
    const major = parseInt(clean, 10)
    return isNaN(major) ? null : major
  }

  const checks: Array<{ pkg: string; minMajor: number; current: string }> = [
    { pkg: 'react', minMajor: 18, current: 'React 19' },
    { pkg: 'next', minMajor: 14, current: 'Next.js 15' },
    { pkg: 'typescript', minMajor: 5, current: 'TypeScript 5' },
  ]

  for (const { pkg, minMajor, current } of checks) {
    const version = deps[pkg]
    const major = getMajor(version)
    if (major !== null && major < minMajor) {
      violations.push({
        severity: 'medium',
        message: `${pkg}@${version} is outdated — ${current} brings significant improvements`,
        filePath: 'package.json',
        suggestion: `Cursor-Prompt: 'Upgrade ${pkg} to the latest version and fix any breaking changes'`,
      })
    }
  }

  if (violations.length === 0) return pass('cat-14-rule-8', 5, 'Core dependencies are up to date')
  return fail('cat-14-rule-8', violations.length > 1 ? 2 : 3,
    `${violations.length} outdated major version(s)`, violations)
}

// ── cat-12-rule-10: Error monitoring for in-memory scans ────────────────────

export async function checkErrorMonitoring(ctx: AuditContext): Promise<RuleResult> {
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }

  const monitoringPackages = [
    '@sentry/nextjs', '@sentry/react', '@sentry/node',
    '@bugsnag/js', '@bugsnag/react',
    '@datadog/browser-rum', 'logrocket',
  ]

  const installed = monitoringPackages.filter(p => p in deps)
  if (installed.length > 0) {
    return pass('cat-12-rule-10', 5, `Error monitoring active: ${installed[0]}`)
  }

  return fail('cat-12-rule-10', 1, 'No error monitoring found', [{
    severity: 'medium',
    message: 'No error monitoring — production errors only visible through user complaints',
    suggestion: "Cursor-Prompt: 'Add Sentry: pnpm add @sentry/nextjs && npx @sentry/wizard@latest -i nextjs'",
    fixHint: 'Install @sentry/nextjs or a similar error monitoring tool',
  }])
}
