// src/lib/audit/types.ts
import type { RepoMap } from '@/lib/repo-map'

export type CheckMode = 'file-system' | 'cli' | 'repo-map' | 'documentation' | 'manual' | 'external-tool'

/** Which agent ruleset produced this rule/finding. 'core' = engineering-standard.md baseline. */
export type AgentSource =
  | 'architecture' | 'security' | 'observability' | 'core'
  // Committee-generated agents (Sprint 5)
  | 'code-style' | 'error-handling' | 'database' | 'dependencies' | 'git-governance'
  | 'backup-dr' | 'testing' | 'performance' | 'platform' | 'api' | 'cost-awareness'
  | 'scalability' | 'accessibility' | 'design-system' | 'content' | 'legal'
  | 'ai-integration' | 'analytics'
  // Security Scan Agent (Sprint 7)
  | 'security-scan'
  // Regulatory Deep Agents (Sprint 8)
  | 'dsgvo' | 'bfsg' | 'ai-act'
  // Lighthouse per-category (Sprint 9)
  | 'lighthouse-performance' | 'lighthouse-accessibility'
  | 'lighthouse-best-practices' | 'lighthouse-seo'
  // Package vulnerability scanner (Sprint 10)
  | 'npm-audit'
  // Slop Detection Agent (Sprint 11)
  | 'slop'
  // Spec Agent (Sprint 11)
  | 'spec'

/** Enforcement level from agent documents */
export type EnforcementLevel = 'blocked' | 'prevented' | 'reviewed' | 'advisory'

/** How this finding should be fixed */
export type FixType = 'code-fix' | 'code-gen' | 'refactoring' | 'manual'

/** Which maturity tier this rule belongs to */
export type RuleTier = 'starter' | 'production' | 'enterprise'

/**
 * Semantic category of what a rule checks.
 * code = concrete code fix; metric = value/score measurement; compliance = regulatory requirement
 */
export type AuditTier = 'code' | 'metric' | 'compliance'

export type AuditDomain =
  | 'code-quality'    // allgemeine Code-Hygiene, Architektur, Tests
  | 'performance'     // Lighthouse, Bundle, Core Web Vitals
  | 'security'        // OWASP, Auth, Injection, Secrets, DB-Sicherheit
  | 'accessibility'   // WCAG, ARIA, BFSG
  | 'dsgvo'           // DSGVO-Pflichten, Cookie-Consent, Datenexport
  | 'ki-act'          // EU AI Act, Risiko-Klassifizierung

export interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  filePath?: string
  line?: number
  suggestion?: string
  /** Agent that produced this finding (undefined = 'core') */
  agentSource?: AgentSource
  enforcement?: EnforcementLevel
  /** All affected files when finding spans multiple files */
  affectedFiles?: string[]
  /** Concise hint for what to fix across affected files */
  fixHint?: string
  /** Per-finding rule ID (e.g. 'lighthouse-performance-first-contentful-paint') */
  agentRuleId?: string
  /** How this finding should be fixed (inherited from the rule) */
  fixType?: FixType
  /** True when filePath matches a frozenPath — finding will be auto-dismissed on persist */
  frozen?: boolean
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
  /** Agent ruleset that owns this rule. Defaults to 'core' if unset. */
  agentSource?: AgentSource
  /** Original rule ID in the agent document (e.g. 'R1', 'R3') */
  agentRuleId?: string
  enforcement?: EnforcementLevel
  /** How findings from this rule should be fixed */
  fixType?: FixType
  /** Maturity tier — rules only apply if user tier >= rule tier. Default: starter */
  maturityTier?: RuleTier
  /** Semantic tier: code (fix it), metric (track it), compliance (prove it). Added 2026-04-27. */
  tier?: AuditTier
  /** Domain-Tab in dem diese Rule erscheint. Added 2026-04-29 (ADR-025). */
  domain?: AuditDomain
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
  /** Options for external tool checks — attached by runAudit when --with-tools is active */
  externalTools?: ExternalToolsOptions
  /** In-memory file contents for external project scans (no disk access) */
  fileContents?: Map<string, string>
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

export interface ExternalToolsOptions {
  /** Lighthouse: URL to scan (e.g. http://localhost:3000). Required to run lighthouse checks. */
  lighthouseUrl?: string
  /** gitleaks: also scan git history (slower). Default: false (files only). */
  deepSecretsScan?: boolean
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
  /** Options for external tool checks (depcruise, lighthouse, bundle, eslint-detailed) */
  externalTools?: ExternalToolsOptions
  /** Rule IDs to exclude from scoring (profile-based compliance filtering) */
  excludeRuleIds?: Set<string>
  /** User maturity tier — rules above this tier are excluded. Default: 'starter' */
  tier?: RuleTier
  /** If set, compliance rules use this profile. If absent, profile-gated rules are excluded. */
  complianceProfile?: { app_type: string; user_location: string; features: string[] }
  /** Path prefixes for inactive/frozen features — findings from these paths are auto-dismissed */
  frozenPaths?: string[]
}

/** Category metadata — weights match the manual audit report */
export const CATEGORIES: CategoryDefinition[] = [
  { id: 1,  name: 'Architektur',                   weight: 2 },
  { id: 2,  name: 'Code-Qualität',                  weight: 2 },
  { id: 3,  name: 'Sicherheit',                     weight: 3 },
  { id: 4,  name: 'Datenschutz & Compliance',       weight: 2 },
  { id: 5,  name: 'Datenbank',                      weight: 2 },
  { id: 6,  name: 'API-Design',                     weight: 1 },
  { id: 7,  name: 'Performance',                    weight: 2 },
  { id: 8,  name: 'Skalierbarkeit',                 weight: 1 },
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
  { id: 19, name: 'Git Governance',                 weight: 3 },
  { id: 20, name: 'Cost Awareness',                 weight: 2 },
  { id: 21, name: 'PWA & Resilience',               weight: 1 },
  { id: 22, name: 'AI Integration',                 weight: 2 },
  { id: 23, name: 'Infrastructure',                 weight: 2 },
  { id: 24, name: 'Supply Chain Security',          weight: 2 },
  { id: 25, name: 'Namenskonventionen & Dateihygiene', weight: 1 },
  { id: 26, name: 'KI-Code-Hygiene',                  weight: 1 },
]
