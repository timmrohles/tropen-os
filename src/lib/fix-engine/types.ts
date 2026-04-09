// src/lib/fix-engine/types.ts
// Shared types for the Fix-Engine (Sprint 7)

export type FixStatus = 'pending' | 'applied' | 'rejected'
export type FixConfidence = 'high' | 'medium' | 'low'

/** One hunk within a file diff */
export interface DiffHunk {
  /** 1-based line number in the original file where this hunk starts */
  oldStart: number
  /** Number of original lines covered by this hunk */
  oldCount: number
  /** 1-based line number in the new file where this hunk starts */
  newStart: number
  /** Number of new lines covered by this hunk */
  newCount: number
  /**
   * Lines in the hunk:
   * - Lines starting with '+' are added
   * - Lines starting with '-' are removed
   * - Lines starting with ' ' (space) are context (unchanged)
   */
  lines: string[]
}

/** Diff for a single file */
export interface FileDiff {
  filePath: string
  hunks: DiffHunk[]
}

/** A fully generated fix — mirrors DB row structure */
export interface GeneratedFix {
  id: string
  runId: string
  findingId: string
  ruleId: string
  categoryId: number
  severity: string
  message: string
  filePath: string | null
  line: number | null
  suggestion: string | null

  explanation: string
  confidence: FixConfidence
  diffs: FileDiff[]

  status: FixStatus
  model: string
  costEur: number
  generatedAt: string
  appliedAt: string | null
  rejectedAt: string | null
  appliedBy: string | null

  // Sprint 7b — Consensus + Risk
  fixMode?: 'quick' | 'consensus'
  riskLevel?: RiskLevel
  riskAssessment?: RiskAssessment
  drafts?: ProviderFixDraft[]
  judgeExplanation?: string
}

/** Context passed to the LLM for fix generation */
export interface FixContext {
  finding: {
    id: string
    ruleId: string
    categoryId: number
    severity: string
    message: string
    filePath: string | null
    line: number | null
    suggestion: string | null
    agentSource: string | null
    enforcement: string | null
    affectedFiles?: string[]
    fixHint?: string
  }
  /** Full content of the file referenced in finding.filePath (null if no file) */
  fileContent: string | null
  /** ±30 lines surrounding finding.line, pre-formatted with line numbers */
  surroundingLines: string | null
  /** Project context (package.json, CLAUDE.md, tsconfig, next.config) — always included */
  projectContext: string | null
  /** Content of affected files for multi-file findings (max 8 files, 80 lines each) */
  affectedFilesContent: string | null
  rootPath: string
}

/** LLM response shape for fix generation */
export interface FixLlmResponse {
  explanation: string
  confidence: FixConfidence
  diffs: FileDiff[]
}

/** Request body for POST /api/audit/fix/generate */
export interface FixGenerateRequest {
  findingId: string
  runId: string
}

/** Request body for POST /api/audit/fix/apply */
export interface FixApplyRequest {
  fixId: string
}

/** Request body for POST /api/audit/fix/reject */
export interface FixRejectRequest {
  fixId: string
}

/** Request body for POST /api/audit/fix/batch-generate */
export interface BatchGenerateRequest {
  runId: string
  /** Default: 'critical'. 'high' includes critical+high findings. */
  severityFilter?: 'critical' | 'high'
}

// Sprint 7b — Consensus + Risk types

export type RiskLevel = 'safe' | 'moderate' | 'critical'

export interface RiskAssessment {
  level: RiskLevel
  score: number           // 0–100, higher = more risky
  reasons: string[]       // human-readable risk reasons
  affectedFiles: string[] // files that would change
  importedByCount: number // how many files import the affected file(s)
}

export interface ProviderFixDraft {
  providerId: string    // 'anthropic' | 'openai' | 'google' | 'xai'
  explanation: string
  confidence: FixConfidence
  diffs: FileDiff[]
  costEur: number
  error?: string        // set if this provider failed
}

export interface ConsensusFix {
  drafts: ProviderFixDraft[]
  judgeExplanation: string    // why judge chose the winning diff
  winnerProviderId: string
  consensusLevel: 'unanimous' | 'majority' | 'split' | 'single'
  totalCostEur: number
}

/** Request body for POST /api/audit/fix/generate-consensus */
export interface FixGenerateConsensusRequest {
  findingId: string
  runId: string
}
