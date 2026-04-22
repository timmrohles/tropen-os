// src/lib/audit/checkers/thin-category-checkers.ts
// Strengthens thin categories: cat-15, cat-17, cat-19, cat-23.

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

// ── cat-15: Icon library enforcement ────────────────────────────────────────

export async function checkIconLibraryConsistency(ctx: AuditContext): Promise<RuleResult> {
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  const banned = ['lucide-react', 'react-icons', '@heroicons/react', '@radix-ui/react-icons']
  const found = banned.filter(b => b in deps)

  if (found.length === 0) return pass('cat-15-rule-7', 5, 'No conflicting icon libraries')
  return fail('cat-15-rule-7', 3, `${found.length} extra icon library(ies) installed`, found.map(pkg => ({
    severity: 'info' as const,
    message: `Multiple icon libraries: "${pkg}" installed alongside others — inconsistent icons`,
    filePath: 'package.json',
    suggestion: `Cursor-Prompt: 'Remove ${pkg} and replace its imports with your primary icon library'`,
  })))
}

// ── cat-17: Hardcoded strings in TSX ────────────────────────────────────────

export async function checkHardcodedStrings(ctx: AuditContext): Promise<RuleResult> {
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  const hasI18n = 'next-intl' in deps || 'react-intl' in deps || 'i18next' in deps || 'react-i18next' in deps

  // If no i18n framework, cat-17-rule-1 already flags it — skip this check
  if (!hasI18n) return pass('cat-17-rule-4', 5, 'No i18n framework — hardcoded strings expected')

  const violations: Finding[] = []
  for (const file of ctx.repoMap.files) {
    if (!file.path.endsWith('.tsx')) continue
    if (file.path.includes('.test.') || file.path.includes('_DESIGN')) continue
    const content = readContent(ctx, file.path)
    if (!content) continue

    // Count string literals in JSX that aren't in t() calls
    // Heuristic: lines with >tag text content that isn't {t('...')} or {variable}
    const jsxTextLines = content.split('\n').filter(line => {
      const trimmed = line.trim()
      // Skip imports, comments, empty
      if (trimmed.startsWith('import ') || trimmed.startsWith('//') || !trimmed) return false
      // Has literal text between JSX tags (>some text<)
      return />[A-Za-z][A-Za-z\s]{5,}</.test(trimmed) && !trimmed.includes('{t(')
    })

    if (jsxTextLines.length > 5) {
      violations.push({
        severity: 'info',
        message: `${jsxTextLines.length} hardcoded strings in JSX — not using i18n translation function`,
        filePath: file.path,
        suggestion: `Cursor-Prompt: 'Replace hardcoded strings in ${file.path.split('/').pop()} with t() calls from the i18n library'`,
      })
    }
  }

  if (violations.length === 0) return pass('cat-17-rule-4', 5, 'Strings properly internationalized')
  return fail('cat-17-rule-4', 3, `${violations.length} file(s) with hardcoded strings`, violations.slice(0, 10))
}

// ── cat-19: .gitignore completeness ─────────────────────────────────────────

export async function checkGitignoreCompleteness(ctx: AuditContext): Promise<RuleResult> {
  const gitignore = readContent(ctx, '.gitignore')

  if (!gitignore) {
    return fail('cat-19-rule-5', 0, 'No .gitignore found', [{
      severity: 'high',
      message: 'No .gitignore — node_modules, .env, and build artifacts could be committed',
      suggestion: "Cursor-Prompt: 'Create .gitignore for a Next.js project with node_modules, .next, .env*, dist, coverage'",
    }])
  }

  const required = [
    { pattern: 'node_modules', label: 'node_modules' },
    { pattern: '.env', label: '.env files' },
    { pattern: '.next', label: '.next build output' },
  ]

  const missing = required.filter(r => !gitignore.includes(r.pattern))

  if (missing.length === 0) return pass('cat-19-rule-5', 5, '.gitignore covers essential patterns')
  return fail('cat-19-rule-5', missing.length > 1 ? 1 : 2,
    `.gitignore missing ${missing.length} essential pattern(s)`,
    missing.map(m => ({
      severity: 'high' as const,
      message: `.gitignore missing "${m.label}" — ${m.pattern} could be committed to repo`,
      filePath: '.gitignore',
      suggestion: `Add "${m.pattern}" to .gitignore`,
    })))
}

// ── cat-23: Docker/deployment config exists ─────────────────────────────────

export async function checkDeploymentConfig(ctx: AuditContext): Promise<RuleResult> {
  const configs = [
    'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
    'fly.toml', 'render.yaml', 'railway.json',
    'vercel.json', 'vercel.ts', 'netlify.toml',
    'Procfile', 'app.yaml',
  ]

  const found = configs.filter(c => ctx.filePaths.some(p => p.endsWith(c)))

  if (found.length > 0) {
    return pass('cat-23-rule-5', 5, `Deployment config found: ${found[0]}`)
  }

  // Check if Vercel is implied by Next.js (auto-deploy)
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  if ('next' in deps) {
    return pass('cat-23-rule-5', 4, 'Next.js project — likely auto-deployed via Vercel')
  }

  return fail('cat-23-rule-5', 2, 'No deployment configuration found', [{
    severity: 'info',
    message: 'No deployment config (Dockerfile, vercel.json, fly.toml) — unclear how to deploy',
    suggestion: "Cursor-Prompt: 'Create vercel.json or Dockerfile for deployment configuration'",
  }])
}

// ── cat-15: next/font display mode ──────────────────────────────────────────
// display: 'optional' suppresses Next.js auto-generated fallback metrics
// (size-adjust, ascent-override etc.), making font-swap visually noticeable.

export async function checkNextFontDisplayMode(ctx: AuditContext): Promise<RuleResult> {
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  if (!('next' in deps)) return pass('cat-15-rule-8', 5, 'Not a Next.js project')

  const layoutCandidates = ['src/app/layout.tsx', 'app/layout.tsx', 'src/app/layout.ts', 'app/layout.ts']
  let layoutContent: string | null = null
  let layoutPath = ''
  for (const p of layoutCandidates) {
    const c = readContent(ctx, p)
    if (c) { layoutContent = c; layoutPath = p; break }
  }

  if (!layoutContent) return pass('cat-15-rule-8', 5, 'No root layout found — next/font not in use')

  const usesNextFont = layoutContent.includes("from 'next/font") || layoutContent.includes('from "next/font')
  if (!usesNextFont) return pass('cat-15-rule-8', 5, 'next/font not used in root layout')

  const hasOptional = /display\s*:\s*['"]optional['"]/.test(layoutContent)
  if (!hasOptional) return pass('cat-15-rule-8', 5, 'next/font display mode is not "optional"')

  return fail('cat-15-rule-8', 3, 'next/font uses display: "optional" — fallback metrics not generated', [{
    severity: 'medium',
    message: 'next/font with display: "optional" skips auto-generated size-adjust/ascent-override on the fallback font — layout shift is visible on font swap. Use display: "swap" instead.',
    filePath: layoutPath,
    suggestion: `Replace display: 'optional' with display: 'swap' in the next/font config. Next.js automatically generates an adjusted Arial fallback (size-adjust, ascent-override, descent-override) that makes the swap visually imperceptible.`,
    fixType: 'code-fix',
  }])
}

// ── cat-10: Test framework installed ────────────────────────────────────────

export async function checkTestFrameworkInstalled(ctx: AuditContext): Promise<RuleResult> {
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  const frameworks = ['vitest', 'jest', '@jest/core', 'mocha', 'ava', 'tap', 'playwright', 'cypress']
  const installed = frameworks.filter(f => f in deps)

  if (installed.length > 0) {
    return pass('cat-10-rule-7', 5, `Test framework installed: ${installed[0]}`)
  }

  return fail('cat-10-rule-7', 0, 'No test framework installed', [{
    severity: 'high',
    message: 'No test framework (vitest, jest, playwright) — no automated testing possible',
    suggestion: "Cursor-Prompt: 'Add vitest: pnpm add -D vitest @testing-library/react and create vitest.config.ts'",
  }])
}
