// src/lib/audit/checkers/spec-checker.ts
// SPEC_AGENT — checks quality of AI context files and project specifications.
// Registered in cat-18 (Dokumentation) as rules 9–12.
//
// OVERLAP NOTES:
//   cat-18-rule-1 (checkReadmePresent): checks README exists → this is different.
//   cat-18-rule-7 (checkReadmeQuality): checks README length → this is different.
//   cat-18-rule-11 (this): checks README cross-references vs package.json — content drift.
//   cat-1-rule-5 (checkADRsPresent): ADRs for tech decisions → we check product specs (PRD).
//   cat-26 (SLOP): detects what's wrong in existing files → SPEC detects what's missing.
//
// Tone: constructive — "Without this context, your AI tool works from guesses."

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { AuditContext, RuleResult, Finding } from '../types'

function readRootFile(ctx: AuditContext, relPath: string): string | null {
  // In-memory first (benchmark scans)
  if (ctx.fileContents) {
    const c = ctx.fileContents.get(relPath)
    if (c !== undefined) return c
  }
  // Disk fallback (live project scans)
  if (ctx.rootPath) {
    try { return readFileSync(join(ctx.rootPath, relPath), 'utf-8') } catch { return null }
  }
  return null
}

function hasRootFile(ctx: AuditContext, relPath: string): boolean {
  if (ctx.fileContents) return ctx.fileContents.has(relPath)
  if (ctx.rootPath) return existsSync(join(ctx.rootPath, relPath))
  return false
}

function pass(id: string, score: number, reason: string): RuleResult {
  return { ruleId: id, score, reason, findings: [], automated: true }
}

function fail(id: string, score: number, reason: string, findings: Finding[]): RuleResult {
  return { ruleId: id, score, reason, findings, automated: true }
}

// ── cat-18-rule-9: AI context file (too short or missing) ────────────────────
// DISTINCT from cat-18-rule-1 (README exists) and cat-18-rule-7 (README quality).
// This rule specifically targets AI context files — .cursorrules, CLAUDE.md, etc.

const AI_CONTEXT_FILES = [
  '.cursorrules',
  'CLAUDE.md',
  '.cursor/rules',
  'docs/CLAUDE.md',
  '.ai/rules.md',
]

const MIN_USEFUL_LENGTH = 200 // below this = stub

export async function checkAiContextFile(ctx: AuditContext): Promise<RuleResult> {
  for (const candidate of AI_CONTEXT_FILES) {
    const content = readRootFile(ctx, candidate)
    if (content === null) continue

    if (content.length < MIN_USEFUL_LENGTH) {
      return fail('cat-18-rule-9', 2, `AI context file ${candidate} is too short (${content.length} chars)`, [{
        severity: 'medium',
        message: `${candidate} exists but has only ${content.length} chars — too short to give AI tools real context. AI generates guesses instead of project-specific code.`,
        filePath: candidate,
        suggestion: `Cursor-Prompt: 'Expand ${candidate} to include: tech stack (framework, DB, auth), coding conventions, forbidden patterns (e.g., no direct DB calls from frontend), and the 5 most important project-specific rules'`,
        agentSource: 'spec',
      }])
    }

    return pass('cat-18-rule-9', 5, `AI context file found and substantive: ${candidate} (${content.length} chars)`)
  }

  // No AI context file found at all
  return fail('cat-18-rule-9', 3, 'No AI context file (.cursorrules / CLAUDE.md) found', [{
    severity: 'info',
    message: 'No .cursorrules or CLAUDE.md found — AI tools have no project-specific context and work from generic assumptions',
    suggestion: "Cursor-Prompt: 'Create .cursorrules with your tech stack, coding conventions, forbidden patterns, and the most important rules for this project'",
    agentSource: 'spec',
  }])
}

// ── cat-18-rule-10: No PRD or requirements document ──────────────────────────

const PRD_CANDIDATES = [
  'docs/PRD.md', 'docs/prd.md',
  'docs/spec.md', 'docs/SPEC.md',
  'SPEC.md', 'PRD.md',
  'docs/requirements.md', 'docs/REQUIREMENTS.md',
  'docs/product.md', 'docs/product-spec.md',
  'docs/product-requirements.md',
]

export async function checkPrdPresent(ctx: AuditContext): Promise<RuleResult> {
  // Skip for micro-projects — a single-page app doesn't need a PRD
  if (ctx.filePaths.length < 20) {
    return pass('cat-18-rule-10', 5, 'Small project — PRD not required')
  }

  const found = PRD_CANDIDATES.find((f) => hasRootFile(ctx, f) || ctx.filePaths.some(p => p === f))
  if (found) return pass('cat-18-rule-10', 5, `PRD/spec document found: ${found}`)

  return fail('cat-18-rule-10', 3, 'No PRD or requirements document found', [{
    severity: 'low', // low: Nice-to-have Doku, kein Funktionsproblem
    message: 'No PRD or spec document (docs/PRD.md, docs/spec.md, SPEC.md) — without written requirements, AI generates what it guesses you want. README-implementation drift is the common result.',
    suggestion: "Cursor-Prompt: 'Create docs/PRD.md with: problem statement (1 sentence), target user (1 sentence), core features (5 bullets), out-of-scope (3 bullets)'",
    agentSource: 'spec',
  }])
}

// ── cat-18-rule-11: README-implementation drift ──────────────────────────────
// DISTINCT from cat-18-rule-7: that checks README length.
// This checks if README mentions packages that don't exist in package.json.

// Package name pattern — npm-style: lowercase, may include hyphens/numbers
const BACKTICK_PACKAGE = /`([a-z][a-z0-9@/_-]{1,40})`/g

// Ignore common false positives: generic terms, env vars, file paths, etc.
const IGNORE_WORDS = new Set([
  'true', 'false', 'null', 'undefined', 'string', 'number', 'boolean',
  'const', 'let', 'var', 'import', 'export', 'from', 'default',
  'src', 'app', 'lib', 'api', 'db', 'env', 'config', 'types',
  'node_modules', 'package.json', 'tsconfig', '.env', '.env.local',
  'localhost', '3000', '8080', 'http', 'https', 'git', 'npm', 'pnpm', 'yarn',
  'bash', 'sh', 'zsh', 'curl', 'node', 'ts-node', 'tsx',
])

export async function checkReadmeDrift(ctx: AuditContext): Promise<RuleResult> {
  const readme = readRootFile(ctx, 'README.md') ?? readRootFile(ctx, 'readme.md')
  if (!readme) return pass('cat-18-rule-11', 5, 'No README found — drift check skipped')

  const allDeps = new Set([
    ...Object.keys(ctx.packageJson.dependencies ?? {}),
    ...Object.keys(ctx.packageJson.devDependencies ?? {}),
  ])

  if (allDeps.size === 0) return pass('cat-18-rule-11', 5, 'No package.json deps — drift check not applicable')

  const mentioned = new Set<string>()
  let match: RegExpExecArray | null
  // Reset regex before using
  BACKTICK_PACKAGE.lastIndex = 0
  while ((match = BACKTICK_PACKAGE.exec(readme)) !== null) {
    const name = match[1].split('/')[0] // strip @org/pkg to just @org or take bare name
    const bare = name.startsWith('@') ? name : name.split('@')[0]
    if (bare.length < 2 || IGNORE_WORDS.has(bare)) continue
    // Only flag if it looks like a real package name (contains a hyphen or is a known pattern)
    if (bare.includes('-') || bare.includes('/') || bare.startsWith('@')) {
      mentioned.add(bare)
    }
  }

  const driftPackages = [...mentioned].filter((pkg) => !allDeps.has(pkg))

  if (driftPackages.length < 2) {
    return pass('cat-18-rule-11', 5, 'README package references match package.json')
  }

  const examples = driftPackages.slice(0, 3).join(', ')
  return fail('cat-18-rule-11', 3, `README mentions ${driftPackages.length} package(s) not in package.json`, [{
    severity: 'low', // low: Veraltete Doku, kein Sicherheits- oder Funktionsproblem
    message: `README mentions ${driftPackages.length} packages not in package.json (e.g. ${examples}) — possibly outdated documentation`,
    suggestion: "Cursor-Prompt: 'Update README.md to match the current tech stack in package.json. Remove references to packages that are no longer used.'",
    agentSource: 'spec',
  }])
}

// ── cat-18-rule-12: .cursorrules without tech stack keywords ─────────────────

const STACK_KEYWORDS = [
  'next', 'react', 'vue', 'svelte', 'angular', 'nuxt', 'remix',
  'node', 'express', 'fastify', 'hono', 'nestjs',
  'supabase', 'prisma', 'postgres', 'mongodb', 'mysql', 'sqlite', 'drizzle',
  'typescript', 'python', 'rust', 'go',
  'tailwind', 'shadcn', 'radix',
  'vercel', 'railway', 'fly.io', 'render',
]

export async function checkCursorrulesHasStack(ctx: AuditContext): Promise<RuleResult> {
  const content = readRootFile(ctx, '.cursorrules') ?? readRootFile(ctx, '.cursor/rules')
  if (!content) return pass('cat-18-rule-12', 5, 'No .cursorrules — stack-keyword check skipped')

  // Only relevant if the file is substantive enough to have context
  if (content.length < MIN_USEFUL_LENGTH) {
    return pass('cat-18-rule-12', 5, '.cursorrules too short — handled by cat-18-rule-9')
  }

  const lower = content.toLowerCase()
  const hasStack = STACK_KEYWORDS.some((kw) => lower.includes(kw))

  if (hasStack) return pass('cat-18-rule-12', 5, '.cursorrules contains tech stack context')

  return fail('cat-18-rule-12', 3, '.cursorrules has no tech stack keywords', [{
    severity: 'info',
    message: '.cursorrules exists but mentions no tech stack — AI tools cannot make stack-specific decisions',
    suggestion: "Add a line at the top of .cursorrules: 'Tech Stack: [Next.js 15 / Supabase / TypeScript / Tailwind]' with your actual stack",
    filePath: '.cursorrules',
    agentSource: 'spec',
  }])
}
