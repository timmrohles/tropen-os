// src/lib/audit/prompt-export/types.ts
// Types for the rule-based fix prompt template engine.
// No LLM calls — deterministic, fast, free.

/** Which coding tool the generated prompt targets. */
export type ToolTarget = 'cursor' | 'claude-code' | 'generic'

/** How this finding should be fixed */
export type FixType = 'code-fix' | 'code-gen' | 'refactoring' | 'manual'

/** A finding passed into the template engine. */
export interface PromptFinding {
  ruleId: string
  severity: string
  message: string
  filePath?: string | null
  line?: number | null
  suggestion?: string | null
  agentSource?: string | null
  agentRuleId?: string | null
  affectedFiles?: string[] | null
  fixHint?: string | null
  fixType?: FixType | null
}

/** Repo context snippet to embed in the prompt (optional). */
export interface RepoContextSnippet {
  /** Relevant symbol signatures near the affected file */
  symbolLines: string[]
  /** Files that import the affected file */
  importedBy: string[]
  /** Files the affected file imports */
  imports: string[]
  /** Token count estimate of the snippet */
  estimatedTokens: number
}

/** A fully generated fix prompt ready to copy. */
export interface GeneratedPrompt {
  tool: ToolTarget
  title: string
  content: string
  /** All file paths mentioned in the prompt (for display) */
  fileRefs: string[]
}
