// src/lib/audit/checkers/category-gap-checkers.ts
// Fills category gaps: cat-7 (Performance), cat-11 (CI/CD), cat-20 (Cost Awareness).

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

// ── cat-7: Performance — Static Indicators ──────────────────────────────────

export async function checkPerformanceBasics(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  const hasNextJs = 'next' in deps

  for (const file of ctx.repoMap.files) {
    if (!file.path.endsWith('.tsx') && !file.path.endsWith('.jsx')) continue
    const content = readContent(ctx, file.path)
    if (!content) continue

    // Images without lazy loading
    const imgNoLazy = content.match(/<img(?![^>]*loading\s*=)/g)
    if (imgNoLazy && imgNoLazy.length > 2) {
      violations.push({
        severity: 'info',
        message: `${imgNoLazy.length} <img> tags without loading="lazy" — slows initial page load`,
        filePath: file.path,
        suggestion: 'Add loading="lazy" to images below the fold, or use next/image for automatic optimization',
      })
    }
  }

  // Full lodash import instead of specific modules
  const pkgContent = readContent(ctx, 'package.json')
  if (pkgContent && /"lodash"\s*:/.test(pkgContent) && !/"lodash-es"\s*:/.test(pkgContent)) {
    violations.push({
      severity: 'info',
      message: 'Full lodash imported — adds ~70KB to bundle. Use lodash-es or specific imports',
      filePath: 'package.json',
      suggestion: "Cursor-Prompt: 'Replace import _ from lodash with specific imports like import pick from lodash/pick'",
    })
  }

  // Next.js without next/image usage
  if (hasNextJs) {
    let usesNextImage = false
    for (const file of ctx.repoMap.files) {
      if (!file.path.endsWith('.tsx')) continue
      const content = readContent(ctx, file.path)
      if (content && /from ['"]next\/image['"]/.test(content)) { usesNextImage = true; break }
    }
    if (!usesNextImage) {
      const imgCount = ctx.repoMap.files.filter(f => {
        const c = readContent(ctx, f.path)
        return c && /<img\s/.test(c)
      }).length
      if (imgCount > 0) {
        violations.push({
          severity: 'info',
          message: `Next.js project uses <img> but not next/image — missing automatic image optimization`,
          suggestion: "Cursor-Prompt: 'Replace all <img> tags with next/image Image component for automatic optimization'",
        })
      }
    }
  }

  if (violations.length === 0) return pass('cat-7-rule-7', 5, 'Performance basics look good')
  return fail('cat-7-rule-7', violations.length > 3 ? 2 : 3,
    `${violations.length} performance improvement(s) possible`, violations)
}

// ── cat-11: CI/CD — Pipeline Existence ──────────────────────────────────────

export async function checkCIPipelineExists(ctx: AuditContext): Promise<RuleResult> {
  const ciPaths = ctx.filePaths.filter(p =>
    p.includes('.github/workflows/') && (p.endsWith('.yml') || p.endsWith('.yaml'))
  )

  if (ciPaths.length > 0) {
    return pass('cat-11-rule-7', 5, `CI pipeline found: ${ciPaths.length} workflow(s)`)
  }

  // Check for other CI systems
  const hasGitlabCI = ctx.filePaths.some(p => p.endsWith('.gitlab-ci.yml'))
  const hasCircleCI = ctx.filePaths.some(p => p.includes('.circleci/config.yml'))
  const hasVercelJson = ctx.filePaths.some(p => p.endsWith('vercel.json'))

  if (hasGitlabCI || hasCircleCI) {
    return pass('cat-11-rule-7', 4, 'CI pipeline found (non-GitHub)')
  }
  if (hasVercelJson) {
    return pass('cat-11-rule-7', 3, 'Vercel auto-deploy detected but no explicit CI pipeline')
  }

  return fail('cat-11-rule-7', 0, 'No CI/CD pipeline found', [{
    severity: 'high',
    message: 'No CI pipeline — broken code can be deployed without any automated checks',
    suggestion: "Cursor-Prompt: 'Create .github/workflows/ci.yml with install, type-check (tsc --noEmit), lint, and test steps'",
    fixHint: 'Create .github/workflows/ci.yml',
  }])
}

export async function checkCIHasTypeCheck(ctx: AuditContext): Promise<RuleResult> {
  const ciFiles = ctx.filePaths.filter(p =>
    p.includes('.github/workflows/') && (p.endsWith('.yml') || p.endsWith('.yaml'))
  )
  if (ciFiles.length === 0) {
    return pass('cat-11-rule-8', 3, 'No CI — type-check not applicable')
  }

  for (const ciPath of ciFiles) {
    const content = readContent(ctx, ciPath)
    if (!content) continue
    if (/tsc|typecheck|type-check|next build/.test(content)) {
      return pass('cat-11-rule-8', 5, 'CI includes type checking')
    }
  }

  return fail('cat-11-rule-8', 2, 'CI pipeline exists but has no type-check step', [{
    severity: 'medium',
    message: 'CI pipeline runs without TypeScript type checking — type errors slip into production',
    suggestion: "Add 'npx tsc --noEmit' step to your CI workflow before the build step",
  }])
}

// ── cat-20: Cost Awareness — LLM Token Limits ──────────────────────────────

export async function checkLLMTokenLimits(ctx: AuditContext): Promise<RuleResult> {
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  const hasLLM = Object.keys(deps).some(d =>
    d.includes('openai') || d.includes('anthropic') || d.includes('@ai-sdk') || d.includes('langchain')
  )

  if (!hasLLM) return pass('cat-20-rule-6', 5, 'No LLM SDK — token limit check not applicable')

  const violations: Finding[] = []
  for (const file of ctx.repoMap.files) {
    if (!file.path.endsWith('.ts') && !file.path.endsWith('.tsx')) continue
    const content = readContent(ctx, file.path)
    if (!content) continue

    // Find LLM API calls
    const hasLLMCall = /completions\.create|generateText|streamText|chat\.create/i.test(content)
    if (!hasLLMCall) continue

    const hasTokenLimit = /max_tokens|maxTokens|maxOutputTokens|max_completion_tokens/i.test(content)
    if (!hasTokenLimit) {
      violations.push({
        severity: 'high',
        message: `LLM API call without token limit — a single request can consume unlimited tokens`,
        filePath: file.path,
        suggestion: `Cursor-Prompt: 'Add maxTokens or max_tokens to all LLM API calls in ${file.path.split('/').pop()}'`,
      })
    }
  }

  if (violations.length === 0) return pass('cat-20-rule-6', 5, 'All LLM calls have token limits')
  return fail('cat-20-rule-6', 1, `${violations.length} LLM call(s) without token limit`, violations)
}

export async function checkAIRouteRateLimiting(ctx: AuditContext): Promise<RuleResult> {
  const deps = { ...ctx.packageJson.dependencies, ...ctx.packageJson.devDependencies }
  const hasLLM = Object.keys(deps).some(d =>
    d.includes('openai') || d.includes('anthropic') || d.includes('@ai-sdk')
  )

  if (!hasLLM) return pass('cat-20-rule-7', 5, 'No LLM SDK — rate limiting not applicable')

  // Find API routes that import LLM SDKs
  const aiRoutes = ctx.repoMap.files.filter(f => {
    if (!f.path.includes('/api/') || !f.path.endsWith('route.ts')) return false
    const content = readContent(ctx, f.path)
    return content && /openai|anthropic|ai-sdk|generateText|streamText/i.test(content)
  })

  if (aiRoutes.length === 0) return pass('cat-20-rule-7', 5, 'No AI API routes found')

  const violations: Finding[] = []
  for (const route of aiRoutes) {
    const content = readContent(ctx, route.path)
    if (!content) continue
    const hasRateLimit = /rateLimit|rateLimiter|upstash|redis.*limit|checkRateLimit/i.test(content)
    if (!hasRateLimit) {
      violations.push({
        severity: 'high',
        message: `AI API route without rate limiting — users can trigger unlimited LLM costs`,
        filePath: route.path,
        suggestion: `Cursor-Prompt: 'Add rate limiting to ${route.path.split('/').pop()} using Upstash or in-memory limiter'`,
      })
    }
  }

  if (violations.length === 0) return pass('cat-20-rule-7', 5, 'AI routes have rate limiting')
  return fail('cat-20-rule-7', 1, `${violations.length} AI route(s) without rate limiting`, violations)
}
