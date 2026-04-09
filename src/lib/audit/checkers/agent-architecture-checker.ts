// src/lib/audit/checkers/agent-architecture-checker.ts
// Architecture Agent v3 — automated checks for R1, R2, R7
import * as fs from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'

function pass(ruleId: string, score: number, reason: string): RuleResult {
  return { ruleId, score, reason, findings: [], automated: true }
}
function fail(ruleId: string, score: number, reason: string, findings: Finding[] = []): RuleResult {
  return { ruleId, score, reason, findings, automated: true }
}
function hasFile(rootPath: string, ...parts: string[]): boolean {
  return fs.existsSync(join(rootPath, ...parts))
}
function hasDep(pkg: AuditContext['packageJson'], name: string): boolean {
  return !!(pkg.dependencies?.[name] || pkg.devDependencies?.[name])
}

// R1 — Dependency model enforced by tooling
export async function checkDependencyModel(ctx: AuditContext): Promise<RuleResult> {
  const hasCruiser = hasFile(ctx.rootPath, '.dependency-cruiser.cjs')
    || hasFile(ctx.rootPath, '.dependency-cruiser.js')
    || hasFile(ctx.rootPath, '.dependency-cruiser.mjs')
  const hasBoundaries = hasDep(ctx.packageJson, 'eslint-plugin-boundaries')

  if (hasCruiser && hasBoundaries) {
    return pass('cat-1-rule-6', 5, 'Dependency model enforced: dependency-cruiser + eslint-plugin-boundaries')
  }
  if (hasCruiser || hasBoundaries) {
    const which = hasCruiser ? 'dependency-cruiser' : 'eslint-plugin-boundaries'
    return fail('cat-1-rule-6', 3, `Partial dependency model: only ${which} configured`, [{
      severity: 'medium',
      message: `Dependency model partially enforced via ${which}`,
      suggestion: 'Add both dependency-cruiser (cycle detection) and eslint-plugin-boundaries (import direction) for full enforcement',
    }])
  }
  return fail('cat-1-rule-6', 0, 'No dependency model enforcement configured', [{
    severity: 'high',
    message: 'No dependency model tooling found (dependency-cruiser / eslint-plugin-boundaries)',
    suggestion: 'Add .dependency-cruiser.cjs and eslint-plugin-boundaries to prevent architectural drift',
  }])
}

// R2 — No forbidden/ambiguous folder names
export async function checkForbiddenFolderNames(ctx: AuditContext): Promise<RuleResult> {
  const forbidden = ['helpers', 'misc', 'temp', 'stuff']
  const seenFolders = new Set<string>()

  for (const filePath of ctx.filePaths) {
    const parts = filePath.split('/')
    for (const name of forbidden) {
      if (parts.includes(name)) {
        const folderPath = parts.slice(0, parts.indexOf(name) + 1).join('/')
        seenFolders.add(folderPath)
      }
    }
  }

  // Flag bare utils/ with many direct files and no subdirs (likely a catch-all)
  const utilsDirectFiles = ctx.filePaths.filter((p) => /\/utils\/[^/]+\.(ts|tsx)$/.test(p))
  const utilsHasSubdirs = ctx.filePaths.some((p) => /\/utils\/[^/]+\//.test(p))
  if (utilsDirectFiles.length > 5 && !utilsHasSubdirs) {
    seenFolders.add('utils/ (unscoped, > 5 direct files)')
  }

  const violations = [...seenFolders]
  if (violations.length === 0) {
    return pass('cat-1-rule-7', 5, 'No forbidden or ambiguous folder names found')
  }

  const findings: Finding[] = violations.map((v) => ({
    severity: 'medium' as const,
    message: `Forbidden/ambiguous folder: ${v}`,
    suggestion: 'Rename to a scoped, descriptive name (e.g. lib/date-utils/, shared/validators/)',
  }))
  const score = violations.length === 1 ? 4 : violations.length <= 3 ? 3 : 1
  return fail('cat-1-rule-7', score, `${violations.length} forbidden/ambiguous folder name(s) in codebase`, findings)
}

// R7 — No unexpected top-level src/ namespaces
export async function checkUnexpectedNamespaces(ctx: AuditContext): Promise<RuleResult> {
  const expected = new Set([
    'app', 'components', 'hooks', 'lib', 'types', 'utils', 'db',
    'actions', 'core', 'modules', 'scripts', 'middleware.ts', 'middleware.js',
  ])

  const topLevelDirs = new Set<string>()
  for (const p of ctx.filePaths) {
    const match = p.match(/^src\/([^/]+)/)
    if (match && match[1] && !match[1].includes('.')) {
      topLevelDirs.add(match[1])
    }
  }

  const unexpected = [...topLevelDirs].filter((d) => !expected.has(d))
  if (unexpected.length === 0) {
    return pass('cat-1-rule-8', 5, 'All src/ top-level directories follow standard structure')
  }

  const findings: Finding[] = unexpected.map((d) => ({
    severity: 'medium' as const,
    message: `Unexpected top-level directory in src/: ${d}/`,
    suggestion: 'Move to an established location or document intent in an ADR',
  }))
  const score = unexpected.length === 1 ? 4 : unexpected.length === 2 ? 2 : 1
  return fail('cat-1-rule-8', score,
    `${unexpected.length} unexpected top-level src/ dir(s): ${unexpected.join(', ')}`, findings)
}
