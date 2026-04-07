// src/lib/audit/types.ts
import type { RepoMap } from '@/lib/repo-map'

export type CheckMode = 'file-system' | 'cli' | 'repo-map' | 'documentation' | 'manual'

export interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  filePath?: string
  line?: number
  suggestion?: string
}

export interface RuleResult {
  ruleId: string
  /** 0–5 for automated checks; null for manual/skipped rules */
  score: number | null
  reason: string
  findings: Finding[]
  automated: boolean
}

export interface AuditRule {
  /** 'cat-1-rule-1' format */
  id: string
  categoryId: number
  name: string
  weight: 1 | 2 | 3
  checkMode: CheckMode
  automatable: boolean
  check?: (ctx: AuditContext) => Promise<RuleResult>
}

export interface PackageJson {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
  [key: string]: unknown
}

export interface TsConfig {
  compilerOptions?: {
    strict?: boolean
    noImplicitAny?: boolean
    strictNullChecks?: boolean
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface GitInfo {
  hasGitDir: boolean
  recentCommits: string[]
}

export interface AuditContext {
  rootPath: string
  repoMap: RepoMap
  packageJson: PackageJson
  tsConfig: TsConfig
  /** All relative file paths from repo map */
  filePaths: string[]
  gitInfo: GitInfo
}

export interface CategoryDefinition {
  id: number
  name: string
  weight: 1 | 2 | 3
}

export interface CategoryScore {
  categoryId: number
  name: string
  weight: 1 | 2 | 3
  ruleResults: RuleResult[]
  /** Weighted score from automated rules only: Σ(score × weight) */
  weightedScore: number
  /** Max possible from automated rules only: Σ(5 × weight) */
  weightedMax: number
  /** 0–100 from automated rules; null if no automatable rules in category */
  automatedPercentage: number | null
  automatedRuleCount: number
  manualRuleCount: number
}

export interface AuditReport {
  project: string
  date: string
  rootPath: string
  categories: CategoryScore[]
  /** Overall automated-only score: Σ(score×weight) / Σ(5×weight) × 100 */
  automatedPercentage: number
  status: 'production-grade' | 'stable' | 'risky' | 'prototype'
  criticalFindings: Finding[]
  automatedRuleCount: number
  manualRuleCount: number
  priorAudit?: {
    date: string
    percentage: number
    delta: number
  }
}

export interface AuditOptions {
  rootPath: string
  /** Pre-computed repo map; generated fresh if absent */
  repoMap?: RepoMap
  /** Token budget for repo map generation (default: 8192) */
  tokenBudget?: number
  /** Skip these check modes (e.g. ['cli'] to skip slow CLI tools) */
  skipModes?: CheckMode[]
  /** Directory for writing reports (default: docs/audit-reports/) */
  outputDir?: string
}

/** Category metadata — weights match the manual audit report */
export const CATEGORIES: CategoryDefinition[] = [
  { id: 1,  name: 'Architektur',                   weight: 2 },
  { id: 2,  name: 'Code-Qualität',                  weight: 1 },
  { id: 3,  name: 'Sicherheit',                     weight: 3 },
  { id: 4,  name: 'Datenschutz & Compliance',       weight: 2 },
  { id: 5,  name: 'Datenbank',                      weight: 2 },
  { id: 6,  name: 'API-Design',                     weight: 1 },
  { id: 7,  name: 'Performance',                    weight: 2 },
  { id: 8,  name: 'Skalierbarkeit',                 weight: 2 },
  { id: 9,  name: 'State Management',               weight: 1 },
  { id: 10, name: 'Testing',                        weight: 3 },
  { id: 11, name: 'CI/CD',                          weight: 3 },
  { id: 12, name: 'Observability',                  weight: 3 },
  { id: 13, name: 'Backup & Disaster Recovery',     weight: 3 },
  { id: 14, name: 'Dependency Management',          weight: 2 },
  { id: 15, name: 'Design System',                  weight: 1 },
  { id: 16, name: 'Accessibility',                  weight: 2 },
  { id: 17, name: 'Internationalisierung',          weight: 1 },
  { id: 18, name: 'Dokumentation',                  weight: 1 },
  { id: 19, name: 'Git Governance',                 weight: 2 },
  { id: 20, name: 'Cost Awareness',                 weight: 2 },
  { id: 21, name: 'PWA & Resilience',               weight: 1 },
  { id: 22, name: 'AI Integration',                 weight: 2 },
  { id: 23, name: 'Infrastructure',                 weight: 2 },
  { id: 24, name: 'Supply Chain Security',          weight: 2 },
  { id: 25, name: 'Namenskonventionen & Dateihygiene', weight: 1 },
]
