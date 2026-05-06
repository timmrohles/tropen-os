// src/lib/audit/index.ts
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { generateRepoMap, generateRepoMapFromFiles } from '@/lib/repo-map'
import type { AuditContext, AuditReport, AuditOptions, GitInfo, PackageJson, TsConfig, Finding } from './types'
import { getRulesForCategory } from './rule-registry'
import { CATEGORIES } from './types'
import { calculateCategoryScore, calculateOverallScore } from './scoring/score-calculator'
import { runComplianceResolver, complianceResultsToFindings, filterFindingsByComplianceAnswers } from './compliance-resolver'

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
  options?: import('./types').AuditOptions,
): Promise<AuditContext> {
  const repoMap = existingRepoMap ?? await generateRepoMap({ rootPath, tokenBudget })
  const packageJson = readJson<PackageJson>(rootPath, 'package.json') ?? {}
  const tsConfig = readJson<TsConfig>(rootPath, 'tsconfig.json') ?? {}
  const filePaths = repoMap.files.map((f) => f.path)
  const gitInfo = readGitInfo(rootPath)

  return {
    rootPath,
    repoMap,
    packageJson,
    tsConfig,
    filePaths,
    gitInfo,
    complianceAnswers: options?.complianceAnswers,
  }
}

export async function runAudit(ctx: AuditContext, options: AuditOptions): Promise<AuditReport> {
  // Attach external tool options to context so check functions can read them
  const enhancedCtx: AuditContext = options.externalTools
    ? { ...ctx, externalTools: options.externalTools }
    : ctx

  const skipModes = new Set(options.skipModes ?? [])

  // ADR-027 Schritt 9a — Universal-Domänen laufen immer (unabhängig vom Profil)
  const UNIVERSAL_DOMAINS = new Set(['code-quality', 'performance', 'security', 'documentation'])
  const domainActivation = options.domainActivation ?? null

  // Mapping von rule.domain (AuditDomain) → DomainActivation-Key
  // Muss synchron mit project-profiles.ts DomainActivation-Interface bleiben.
  // Sprint 9b: alle neuen Domains ergänzt.
  const RULE_DOMAIN_TO_ACTIVATION: Partial<Record<import('./types').AuditDomain, string>> = {
    'dsgvo':          'privacy',
    'ki-act':         'ai',
    'accessibility':  'accessibility',
    'oss':            'oss',
    'marketing':      'marketing',
    'platform':       'platform',
    'infrastructure': 'infrastructure',
  }
  // Merge explicit exclusions with profile-gated rules (if no profile set)
  const baseExclusions = options.excludeRuleIds ?? new Set<string>()
  let excludeRuleIds = baseExclusions
  if (!options.complianceProfile) {
    // No profile → exclude profile-gated compliance rules from scoring
    const { PROFILE_GATED_RULE_IDS } = await import('./compliance-domains')
    excludeRuleIds = new Set([...baseExclusions, ...PROFILE_GATED_RULE_IDS])
  }
  const TIER_ORDER: Record<string, number> = { starter: 0, production: 1, enterprise: 2 }
  const userTier = TIER_ORDER[options.tier ?? 'starter'] ?? 0
  const categoryScores = []

  for (const catDef of CATEGORIES) {
    const rules = getRulesForCategory(catDef.id)
    const results = await Promise.all(
      rules.map(async (rule) => {
        // ADR-027 Schritt 9a: Domain-basiertes Skip für inactive Compliance-Domänen
        if (domainActivation && rule.domain && !UNIVERSAL_DOMAINS.has(rule.domain)) {
          const activationKey = RULE_DOMAIN_TO_ACTIVATION[rule.domain as import('./types').AuditDomain]
          const activation = activationKey ? domainActivation[activationKey] : undefined
          if (activation === 'inactive') {
            return {
              ruleId: rule.id,
              score: null as null,
              reason: 'Domain inactive for this project profile',
              findings: [] as never[],
              automated: false,
            }
          }
          // lazy: today = active (Code-Marker-Erkennung kommt mit Sprint 9b)
        }

        // Profile-based exclusion: rule not relevant for this project
        if (excludeRuleIds.has(rule.id)) {
          return {
            ruleId: rule.id,
            score: null as null,
            reason: 'Not applicable for project profile',
            findings: [] as never[],
            automated: false,
          }
        }
        // Tier filtering: skip rules above user's maturity level
        const ruleTierLevel = TIER_ORDER[rule.maturityTier ?? 'starter'] ?? 0
        if (ruleTierLevel > userTier) {
          return {
            ruleId: rule.id,
            score: null as null,
            reason: 'Rule tier exceeds project maturity level',
            findings: [] as never[],
            automated: false,
          }
        }
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

  // Mark findings from frozen feature paths
  const frozenPaths = options.frozenPaths ?? []
  if (frozenPaths.length > 0) {
    for (const catScore of categoryScores) {
      for (const result of catScore.ruleResults) {
        for (const finding of result.findings) {
          if (finding.filePath && frozenPaths.some((fp) => finding.filePath!.includes(fp))) {
            finding.frozen = true
          }
        }
      }
    }
  }

  // Compliance-Resolver Stufe 1 — 2026-05-06
  // Wenn complianceAnswers im Kontext vorhanden:
  //   1. Code-Findings aus cat-4-rule-11/17/18 filtern (User-Vorrang total)
  //   2. Compliance-Resolver-Findings hinzufügen (has_privacy_policy, has_deletion_process, data_location)
  const complianceCtx = enhancedCtx.complianceAnswers
    ? enhancedCtx
    : (options.complianceAnswers ? { ...enhancedCtx, complianceAnswers: options.complianceAnswers } : null)

  if (complianceCtx?.complianceAnswers) {
    // Filter existing code findings (User-Vorrang)
    for (const catScore of categoryScores) {
      for (const result of catScore.ruleResults) {
        const filteredFindings = filterFindingsByComplianceAnswers(
          result.findings as Finding[],
          complianceCtx.complianceAnswers,
        )
        // Replace in place — cast needed because result.findings is typed as Finding[]
        ;(result.findings as Finding[]).length = 0
        ;(result.findings as Finding[]).push(...filteredFindings)
      }
    }

    // Add resolver findings to cat-4 (Datenschutz & Compliance)
    const complianceResults = runComplianceResolver(complianceCtx)
    const resolverFindings = complianceResultsToFindings(complianceResults)

    if (resolverFindings.length > 0) {
      const cat4 = categoryScores.find((c) => c.categoryId === 4)
      if (cat4) {
        // Append as a synthetic rule result — score=null (manual), no weight impact
        cat4.ruleResults.push({
          ruleId: 'compliance-resolver-stufe1',
          score: null,
          reason: `Compliance-Resolver Stufe 1: ${resolverFindings.length} Finding(s)`,
          findings: resolverFindings,
          automated: false,
        })
        cat4.manualRuleCount += 1
      }
    }
  }

  const fileCount = ctx.repoMap?.stats?.totalFiles ?? ctx.filePaths?.length ?? 0
  const overall = calculateOverallScore(categoryScores, { fileCount })

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
    try { packageJson = JSON.parse(pkgFile.content) as PackageJson } catch { /* ignore */ }
  }

  const tsFile = files.find(
    (f) => f.path === 'tsconfig.json' || f.path.endsWith('/tsconfig.json'),
  )
  let tsConfig: TsConfig = {}
  if (tsFile) {
    try { tsConfig = JSON.parse(tsFile.content) as TsConfig } catch { /* ignore */ }
  }

  // Build in-memory file contents map for AST-based checks (no disk access)
  const fileContents = new Map<string, string>()
  for (const f of files) fileContents.set(f.path, f.content)

  return {
    rootPath: '',
    repoMap,
    packageJson,
    tsConfig,
    filePaths: files.map((f) => f.path),
    gitInfo: { hasGitDir: false, recentCommits: [] },
    fileContents,
  }
}
