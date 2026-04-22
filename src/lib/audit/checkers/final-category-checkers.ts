// src/lib/audit/checkers/final-category-checkers.ts
// Fills the last 5 empty categories: cat-8, cat-13, cat-18, cat-21, cat-23.

import { readFileSync } from 'fs'
import { join } from 'path'
import type { AuditContext, RuleResult, Finding } from '../types'
import { isListRoute } from '../utils/route-utils'
import { fileExists, fileExistsInAnyOf } from '../utils/file-utils'

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

// ── cat-13: Backup & DR ─────────────────────────────────────────────────────

export async function checkBackupDocs(ctx: AuditContext): Promise<RuleResult> {
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  const usesDB = '@supabase/supabase-js' in deps || 'firebase' in deps ||
    'prisma' in deps || '@planetscale/database' in deps || '@prisma/client' in deps

  if (!usesDB) return pass('cat-13-rule-8', 5, 'No database dependency — backup docs not applicable')

  // File existence check via shared utility (see docs/checker-design-patterns.md P1)
  const hasBackupDoc = ctx.filePaths.some(k =>
    k.toLowerCase().includes('backup') || k.toLowerCase().includes('runbook') ||
    k.toLowerCase().includes('disaster') || k.toLowerCase().includes('recovery')
  ) || fileExistsInAnyOf(ctx.rootPath, ['docs/runbooks', 'docs/backup.md', 'RUNBOOK.md'])

  if (hasBackupDoc) return pass('cat-13-rule-8', 5, 'Backup/DR documentation found')

  return fail('cat-13-rule-8', 1, 'Database used but no backup documentation', [{
    severity: 'medium',
    message: 'Database found but no backup plan documented — no recovery plan if data is lost',
    suggestion: "Cursor-Prompt: 'Create docs/runbook.md documenting: database provider, backup status, and restore procedure'",
  }])
}

export async function checkSupabasePITR(ctx: AuditContext): Promise<RuleResult> {
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  if (!('@supabase/supabase-js' in deps)) {
    return pass('cat-13-rule-9', 5, 'Not a Supabase project — PITR not applicable')
  }

  return fail('cat-13-rule-9', 3, 'Supabase detected — verify PITR status', [{
    severity: 'info',
    message: 'Supabase detected — Point-in-Time-Recovery (PITR) is only active on Pro plan. Check: Dashboard → Database → Backups',
    suggestion: "Add to README: 'Backup: Supabase [free/pro] — PITR [enabled/disabled]'",
  }])
}

// ── cat-8: Skalierbarkeit ───────────────────────────────────────────────────

export async function checkAPITimeouts(ctx: AuditContext): Promise<RuleResult> {
  const apiFiles = ctx.repoMap.files.filter(f =>
    f.path.includes('/api/') && f.path.endsWith('route.ts')
  )
  if (apiFiles.length === 0) return pass('cat-8-rule-6', 5, 'No API routes found')

  const violations: Finding[] = []
  for (const file of apiFiles) {
    const content = readContent(ctx, file.path)
    if (!content) continue
    // Require actual call patterns — not string literals like 'openai' in enums
    const hasExternalCall = /\bfetch\s*\(|from ['"]openai['"]|from ['"]@anthropic|from ['"]@ai-sdk|axios\.\w+\s*\(|generateText\s*\(|streamText\s*\(/i.test(content)
    const hasTimeout = /maxDuration|timeout|AbortController/i.test(content)

    if (hasExternalCall && !hasTimeout) {
      violations.push({
        severity: 'medium',
        message: `API route with external calls but no timeout — request hangs indefinitely if service is slow`,
        filePath: file.path,
        suggestion: `Cursor-Prompt: 'Add export const maxDuration = 30 to ${file.path.split('/').pop()}'`,
      })
    }
  }

  if (violations.length === 0) return pass('cat-8-rule-6', 5, 'API routes have timeout handling')
  return fail('cat-8-rule-6', violations.length > 3 ? 2 : 3,
    `${violations.length} API route(s) without timeout`, violations.slice(0, 10))
}

export async function checkUnlimitedQueries(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []
  for (const file of ctx.repoMap.files) {
    if (!file.path.includes('/api/') || !file.path.endsWith('route.ts')) continue
    if (!isListRoute(file.path)) continue // List-Route-Detection via shared utility
    const content = readContent(ctx, file.path)
    if (!content) continue

    // Only flag GET handlers — POST/PATCH/DELETE rarely need pagination
    const hasGetHandler = /export\s+(?:async\s+)?function\s+GET|export\s+const\s+GET\s*=/i.test(content)
    if (!hasGetHandler) continue

    const hasUnlimited = (/\.select\s*\(|findMany\s*\(|\.from\s*\(/.test(content)) &&
      !/\.limit\s*\(|\.take\s*\(|\.range\s*\(|\.eq\s*\(|pagination|paginate/i.test(content)

    if (hasUnlimited) {
      violations.push({
        severity: 'medium',
        message: 'List endpoint fetches all records without limit — could load thousands of rows',
        filePath: file.path,
        suggestion: `Cursor-Prompt: 'Add .limit(50) to database queries in ${file.path.split('/').pop()} and add pagination'`,
      })
    }
  }

  if (violations.length === 0) return pass('cat-8-rule-7', 5, 'Queries have limits or pagination')
  return fail('cat-8-rule-7', violations.length > 3 ? 2 : 3,
    `${violations.length} query(ies) without limit`, violations.slice(0, 10))
}

// ── cat-18: Dokumentation ───────────────────────────────────────────────────

export async function checkReadmeQuality(ctx: AuditContext): Promise<RuleResult> {
  const readme = readContent(ctx, 'README.md') ?? readContent(ctx, 'readme.md') ?? ''

  if (readme.length === 0) {
    return fail('cat-18-rule-7', 0, 'No README.md found', [{
      severity: 'medium',
      message: 'No README.md — new developers don\'t know how to start the project',
      suggestion: "Cursor-Prompt: 'Create README.md with: project description, prerequisites, install steps, how to run, env variables'",
    }])
  }

  if (readme.length < 200) {
    return fail('cat-18-rule-7', 2, 'README.md is very short', [{
      severity: 'low',
      message: `README.md is very short (${readme.length} chars) — setup instructions likely missing`,
      suggestion: "Cursor-Prompt: 'Expand README.md with install, run, and environment setup sections'",
    }])
  }

  return pass('cat-18-rule-7', readme.length > 500 ? 5 : 4, `README.md exists (${readme.length} chars)`)
}

export async function checkChangelog(ctx: AuditContext): Promise<RuleResult> {
  // File existence check via shared utility (see docs/checker-design-patterns.md P1)
  const has = ctx.filePaths.some(p =>
    p.toLowerCase() === 'changelog.md' || p.toLowerCase() === 'changelog'
  ) || fileExists(ctx.rootPath, 'CHANGELOG.md')

  if (has) return pass('cat-18-rule-8', 5, 'CHANGELOG found')
  return fail('cat-18-rule-8', 3, 'No CHANGELOG', [{
    severity: 'info',
    message: 'No CHANGELOG — changes between versions not traceable',
    suggestion: "Cursor-Prompt: 'Create CHANGELOG.md following keepachangelog.com format'",
  }])
}

// ── cat-21: PWA & Resilience ────────────────────────────────────────────────

export async function checkWebManifest(ctx: AuditContext): Promise<RuleResult> {
  const inRepoMap = ctx.filePaths.some(p =>
    p.endsWith('manifest.json') || p.endsWith('site.webmanifest')
  )
  // File existence check via shared utility (see docs/checker-design-patterns.md P1)
  const onDisk = fileExistsInAnyOf(ctx.rootPath, ['public/manifest.json', 'public/site.webmanifest'])

  if (inRepoMap || onDisk) return pass('cat-21-rule-5', 5, 'Web app manifest found')
  return fail('cat-21-rule-5', 3, 'No web manifest', [{
    severity: 'info',
    message: 'No manifest.json — app cannot be installed as PWA',
    suggestion: "Cursor-Prompt: 'Create public/manifest.json with name, icons, start_url, display: standalone'",
  }])
}

export async function checkOfflineFallback(ctx: AuditContext): Promise<RuleResult> {
  // File existence check via shared utility (see docs/checker-design-patterns.md P1)
  const hasSW = ctx.filePaths.some(k =>
    k.includes('service-worker') || k.includes('sw.js') || k.includes('sw.ts')
  ) || fileExistsInAnyOf(ctx.rootPath, ['public/sw.js', 'public/service-worker.js'])
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  const hasPWAPlugin = 'next-pwa' in deps || '@ducanh2912/next-pwa' in deps

  if (hasSW || hasPWAPlugin) return pass('cat-21-rule-6', 5, 'Service worker or PWA plugin found')
  return fail('cat-21-rule-6', 3, 'No offline support', [{
    severity: 'info',
    message: 'No service worker — app shows error page when offline',
    suggestion: "Cursor-Prompt: 'Add offline support: pnpm add next-pwa and configure in next.config.js'",
  }])
}

// ── cat-23: Infrastructure ──────────────────────────────────────────────────

export async function checkHealthEndpoint(ctx: AuditContext): Promise<RuleResult> {
  const has = ctx.filePaths.some(k =>
    k.includes('/api/health') || k.includes('/healthz') || k.includes('/health/route')
  )

  if (has) return pass('cat-23-rule-3', 5, 'Health check endpoint found')
  return fail('cat-23-rule-3', 3, 'No health check', [{
    severity: 'info',
    message: 'No /api/health endpoint — monitoring tools cannot check app status',
    suggestion: "Cursor-Prompt: 'Create app/api/health/route.ts returning { status: ok, timestamp } with HTTP 200'",
  }])
}

export async function checkDeploymentDocs(ctx: AuditContext): Promise<RuleResult> {
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  const isNextJs = 'next' in deps
  if (!isNextJs) return pass('cat-23-rule-4', 5, 'Not a Next.js project — deployment docs not checked')

  // File existence check via shared utility (see docs/checker-design-patterns.md P1)
  const rootVercel = fileExistsInAnyOf(ctx.rootPath, ['vercel.json', 'vercel.ts', 'Dockerfile', 'fly.toml'])
    || ctx.filePaths.some(p => p === 'vercel.json' || p === 'vercel.ts')

  const readme = (readContent(ctx, 'README.md') ?? readContent(ctx, 'docs/README.md') ?? '').toLowerCase()
  const hasDeployDocs = readme.includes('deploy') || readme.includes('vercel') || readme.includes('production')
  // Also accept CLAUDE.md with deployment section (project-specific docs)
  const claudeMd = (readContent(ctx, 'CLAUDE.md') ?? '').toLowerCase()
  const hasClaudeDeployDocs = claudeMd.includes('deploy') || claudeMd.includes('supabase db push') || claudeMd.includes('vercel')

  if (rootVercel || hasDeployDocs || hasClaudeDeployDocs) {
    return pass('cat-23-rule-4', 5, 'Deployment setup documented')
  }

  return fail('cat-23-rule-4', 3, 'No deployment documentation', [{
    severity: 'info',
    message: 'No deployment setup documented — unclear how the project is deployed',
    suggestion: "Cursor-Prompt: 'Add deployment section to README.md for Vercel: npx vercel deploy'",
  }])
}
