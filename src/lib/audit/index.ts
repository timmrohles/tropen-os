// src/lib/audit/index.ts
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { generateRepoMap, generateRepoMapFromFiles } from '@/lib/repo-map'
import type { AuditContext, AuditReport, AuditOptions, GitInfo, PackageJson, TsConfig } from './types'
import { getRulesForCategory } from './rule-registry'
import { CATEGORIES } from './types'
import { calculateCategoryScore, calculateOverallScore } from './scoring/score-calculator'

function readJson<T>(rootPath: string, ...parts: string[]): T | null {
  const filePath = join(rootPath, ...parts)
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T
  } catch {
    return null
  }
}

function readGitInfo(rootPath: string): GitInfo {
  const hasGitDir = existsSync(join(rootPath, '.git'))
  if (!hasGitDir) return { hasGitDir: false, recentCommits: [] }
  try {
    const output = execFileSync('git', ['log', '--format=%s', '-20'], {
      cwd: rootPath, encoding: 'utf-8', timeout: 10_000,
    })
    const recentCommits = String(output).split('\n').map((s) => s.trim()).filter(Boolean)
    return { hasGitDir: true, recentCommits }
  } catch {
    return { hasGitDir: true, recentCommits: [] }
  }
}

export async function buildAuditContext(
  rootPath: string,
  existingRepoMap?: AuditContext['repoMap'],
  tokenBudget = 8192,
): Promise<AuditContext> {
  const repoMap = existingRepoMap ?? await generateRepoMap({ rootPath, tokenBudget })
  const packageJson = readJson<PackageJson>(rootPath, 'package.json') ?? {}
  const tsConfig = readJson<TsConfig>(rootPath, 'tsconfig.json') ?? {}
  const filePaths = repoMap.files.map((f) => f.path)
  const gitInfo = readGitInfo(rootPath)

  return { rootPath, repoMap, packageJson, tsConfig, filePaths, gitInfo }
}

export async function runAudit(ctx: AuditContext, options: AuditOptions): Promise<AuditReport> {
  // Attach external tool options to context so check functions can read them
  const enhancedCtx: AuditContext = options.externalTools
    ? { ...ctx, externalTools: options.externalTools }
    : ctx

  const skipModes = new Set(options.skipModes ?? [])
  const categoryScores = []

  for (const catDef of CATEGORIES) {
    const rules = getRulesForCategory(catDef.id)
    const results = await Promise.all(
      rules.map(async (rule) => {
        if (!rule.automatable || !rule.check || skipModes.has(rule.checkMode)) {
          return {
            ruleId: rule.id,
            score: null as null,
            reason: skipModes.has(rule.checkMode)
              ? `${rule.checkMode} checks skipped`
              : 'Manual rule — not automatable',
            findings: [] as never[],
            automated: false,
          }
        }
        try {
          return await rule.check(enhancedCtx)
        } catch (err) {
          return {
            ruleId: rule.id,
            score: null as null,
            reason: `Check failed: ${String(err)}`,
            findings: [] as never[],
            automated: false,
          }
        }
      })
    )

    categoryScores.push(
      calculateCategoryScore(catDef.id, catDef.name, catDef.weight, rules, results)
    )
  }

  const overall = calculateOverallScore(categoryScores)

  return {
    project: (ctx.packageJson as { name?: string }).name ?? 'unknown',
    date: new Date().toISOString().split('T')[0],
    rootPath: ctx.rootPath,
    categories: categoryScores,
    ...overall,
  }
}

export { formatReportText, formatReportMarkdown } from './scoring/score-formatter'
export type { AuditReport, AuditOptions, AuditContext, Finding } from './types'

/**
 * Builds an AuditContext from in-memory file content.
 * Used for external project scans — no disk access required.
 */
export async function buildAuditContextFromFiles(
  files: Array<{ path: string; content: string }>,
  tokenBudget = 4096,
): Promise<AuditContext> {
  const repoMap = await generateRepoMapFromFiles(files, { tokenBudget })

  const pkgFile = files.find(
    (f) => f.path === 'package.json' || f.path.endsWith('/package.json'),
  )
  let packageJson: PackageJson = {}
  if (pkgFile) {
    try { packageJson = JSON.parse(pkgFile.content) as PackageJson } catch {}
  }

  const tsFile = files.find(
    (f) => f.path === 'tsconfig.json' || f.path.endsWith('/tsconfig.json'),
  )
  let tsConfig: TsConfig = {}
  if (tsFile) {
    try { tsConfig = JSON.parse(tsFile.content) as TsConfig } catch {}
  }

  return {
    rootPath: '',
    repoMap,
    packageJson,
    tsConfig,
    filePaths: files.map((f) => f.path),
    gitInfo: { hasGitDir: false, recentCommits: [] },
  }
}
