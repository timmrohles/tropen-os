// src/lib/preflight/corpus/types.ts
export type ConventionSection =
  | 'overview'        // LLM-Projekt-Schicht
  | 'architecture'    // LLM-Projekt-Schicht
  | 'code-rules'
  | 'naming'
  | 'structure'
  | 'db'
  | 'error-handling'
  | 'testing'
  | 'git'
  | 'security'
  | 'maintenance'

export type RuleSeverity = 'must' | 'should'

export interface ConventionRule {
  id: string
  section: ConventionSection
  rule: string // imperativ („tun")
  rationale?: string
  appliesWhen?: string[] // undefined = universell
  severity: RuleSeverity
  source: string
}
