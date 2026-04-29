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

// Patterns that indicate genuine client-state need — these fetches are legitimate in
// useEffect because the data is user-specific, realtime, browser-API-dependent, or
// explicitly managed with loading state (developer-aware pattern, not an accidental anti-pattern).
const CLIENT_STATE_INDICATORS =
  /useAuth\s*\(|useUser\s*\(|useSession\s*\(|useCurrentUser\s*\(|useProfile\s*\(|useSupabaseClient\s*\(|useWebSocket\s*\(|new\s+WebSocket\s*\(|new\s+EventSource\s*\(|supabase\.channel\s*\(|\.subscribe\s*\(|useSocket\s*\(|useRealtime\s*\(|set\w*[Ll]oading\s*\(|set\w*[Ff]etching\s*\(|new\s+AbortController\s*\(|setSaving\s*\(|setSaved\s*\(/

export async function checkFetchInEffect(ctx: AuditContext): Promise<RuleResult> {
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  const hasCacheLib = '@tanstack/react-query' in deps || 'swr' in deps || 'react-query' in deps

  if (hasCacheLib) {
    return pass('cat-9-rule-5', 5, 'Cache layer installed (React Query or SWR)')
  }

  const isNextJs = Boolean(deps.next)
  const violations: Finding[] = []

  for (const file of ctx.repoMap.files) {
    if (!file.path.endsWith('.tsx') && !file.path.endsWith('.ts')) continue
    if (file.path.includes('.test.') || file.path.includes('.spec.')) continue
    // Skip infrastructure files — not React components, regex/string content can cause false positives
    if (/(?:[\\/]|^)(?:src[\\/]lib[\\/]audit|src[\\/]scripts|src[\\/]lib[\\/]benchmark)[\\/]/.test(file.path)) continue

    const content = readContent(ctx, file.path)
    if (!content) continue

    // Detect fetch/axios directly inside a useEffect callback.
    // Use an 80-char window: tight enough to avoid nearby event-handler false positives
    // (e.g. useEffect(() => { load() }) picking up fetch in a sibling function below),
    // wide enough to catch the common `useEffect(async () => {\n  const res = await fetch(...)` pattern.
    const useEffectMatches = [...content.matchAll(/useEffect\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*\{/g)]
    const hasFetchInEffect = useEffectMatches.some((m) => {
      const slice = content.slice(m.index ?? 0, (m.index ?? 0) + 80)
      return /fetch\s*\(|axios\.|supabase.*\.from\s*\(.*\)\.select/.test(slice)
    })

    if (!hasFetchInEffect) continue

    // Skip files that use explicit loading-state management or client-only signals:
    // auth hooks, realtime subscriptions, loading state setters, etc.
    // These fetches are developer-aware patterns, not accidental anti-patterns.
    // Applied globally — not just in App Router — because components/ widgets follow the same logic.
    if (CLIENT_STATE_INDICATORS.test(content)) continue

    if (isNextJs) {
      // App Router files: apply additional framework-aware guards
      const isAppRouterFile = /(?:[\\/]|^)(?:src[\\/])?app[\\/]/.test(file.path)

      if (isAppRouterFile) {
        // API Route Handlers are not components — useEffect is impossible there
        if (/[\\/]api[\\/]/.test(file.path)) continue

        const hasUseClient = content.includes("'use client'") || content.includes('"use client"')

        // Server Components cannot run useEffect at all — not a caching issue, skip
        if (!hasUseClient) continue
      }
    }

    violations.push({
      severity: 'medium',
      message: `fetch() in useEffect — no cache between remounts or navigation`,
      filePath: file.path,
      suggestion: "Cursor-Prompt: 'Add SWR or @tanstack/react-query to cache this fetch call and avoid redundant network requests'",
    })
  }

  if (violations.length === 0) return pass('cat-9-rule-5', 4, 'No uncached fetch-in-useEffect patterns')
  // 1–2 isolated cases = score 3; >2 = systemic problem = score 2; >10 = score 1
  return fail('cat-9-rule-5', violations.length > 10 ? 1 : violations.length > 2 ? 2 : 3,
    `${violations.length} component(s) fetch data in useEffect without caching`, violations.slice(0, 10))
}

// ── cat-9-rule-6: Prop drilling detection (actual forwarding, not prop count) ──

export async function checkPropDrilling(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []

  for (const file of ctx.repoMap.files) {
    if (!file.path.endsWith('.tsx')) continue
    const content = readContent(ctx, file.path)
    if (!content) continue

    const componentMatches = [
      ...content.matchAll(/(?:export\s+(?:default\s+)?)?function\s+([A-Z]\w*)\s*\(\s*\{([^}]+)\}\s*[):]/g),
      ...content.matchAll(/(?:export\s+)?(?:const|let)\s+([A-Z]\w*)\s*=\s*(?:\([^)]*\)\s*=>|function)\s*\(\s*\{([^}]+)\}\s*[):]/g),
    ]

    for (const match of componentMatches) {
      const componentName = match[1]
      const propsStr = match[2]

      const propNames = propsStr
        .split(',')
        .map((p) => p.trim().split(/[\s:=]/)[0].replace(/^\.\.\./, '').trim())
        .filter((p) => /^[a-zA-Z_$]\w*$/.test(p))

      if (propNames.length < 4) continue

      // Identity-forwarding: propName={propName} — prop passed to child unchanged
      const forwardedProps = propNames.filter((name) =>
        new RegExp(`\\b${name}=\\{${name}\\}`).test(content)
      )

      // Spread forwarding: {...props} or {...rest} — all props forwarded at once
      const hasPropSpread = /\{\.\.\.(?:props|rest)\}/.test(content)

      const isDrilling = forwardedProps.length >= 3 || (hasPropSpread && propNames.length > 5)
      if (!isDrilling) continue

      const severity = forwardedProps.length >= 6 || (hasPropSpread && propNames.length > 15) ? 'high' as const : 'info' as const
      const what = hasPropSpread
        ? 'spreads all props to children'
        : `forwards ${forwardedProps.length} props unchanged (${forwardedProps.slice(0, 3).join(', ')}${forwardedProps.length > 3 ? '...' : ''})`
      violations.push({
        severity,
        message: `${componentName} leitet ${what} durch — React Context oder Zustand vereinfachen das`,
        filePath: file.path,
        suggestion: `Cursor-Prompt: 'Refactor ${componentName} in ${file.path.split('/').pop()} — move shared state to React Context or Zustand store'`,
      })
    }
  }

  if (violations.length === 0) return pass('cat-9-rule-6', 5, 'No prop drilling detected')
  const highCount = violations.filter((v) => v.severity === 'high').length
  const score = highCount > 2 ? 2 : 3
  return fail('cat-9-rule-6', score,
    `${violations.length} component(s) with prop drilling`, violations.slice(0, 10))
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
