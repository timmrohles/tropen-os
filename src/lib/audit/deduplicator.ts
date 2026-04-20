// src/lib/audit/deduplicator.ts
// Finding deduplication across audit runs.
//
// Prevents findings that were already fixed, dismissed, or acknowledged in a
// previous run from flooding the next run as if they were new.
//
// Match key: ruleId + filePath.  Scoped to static-audit runs only — the trigger
// route never calls this for deep review (that's a separate endpoint).

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import type { AgentSource, EnforcementLevel } from './types'

const log = createLogger('audit:deduplicator')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** An enriched finding as built by the trigger route (pre-DB-insert). */
export interface EnrichedFinding {
  ruleId: string
  categoryId: number
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  filePath?: string
  line?: number
  suggestion?: string
  agentSource?: AgentSource
  enforcement?: EnforcementLevel
  affectedFiles?: string[]
  fixHint?: string
  /** Per-finding rule ID — overrides rule-level agentRuleId for granular findings */
  agentRuleId?: string
  /** Set to 'acknowledged' when status is inherited from previous run. */
  inheritedStatus?: string
}

interface PreviousFinding {
  id: string
  rule_id: string
  file_path: string | null
  message: string
  status: string
}

export interface DeduplicationResult {
  /** Findings that should be written to the DB. */
  newFindings: EnrichedFinding[]
  /** Findings that were skipped (fixed or dismissed in previous run). */
  skipped: Array<{ finding: EnrichedFinding; reason: string; previousId: string }>
  /** Findings whose status was inherited (acknowledged). */
  inherited: Array<{ finding: EnrichedFinding; inheritedStatus: string; previousId: string }>
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Deduplicate `currentFindings` against the most recent previous run for the
 * same organisation.
 *
 * - fixed    in prev → skip (unless message changed → Regression)
 * - dismissed in prev → skip
 * - acknowledged in prev → keep but inherit status
 * - open / no match → keep as-is
 */
export async function deduplicateFindings(
  currentFindings: EnrichedFinding[],
  runId: string,
  organizationId: string,
): Promise<DeduplicationResult> {
  // No findings → nothing to do
  if (currentFindings.length === 0) {
    return { newFindings: [], skipped: [], inherited: [] }
  }

  const previousRun = await getPreviousRun(runId, organizationId)

  if (!previousRun) {
    // First run for this org — everything is new
    return { newFindings: currentFindings, skipped: [], inherited: [] }
  }

  const previousFindings = await loadPreviousFindings(previousRun.id)

  if (previousFindings.length === 0) {
    return { newFindings: currentFindings, skipped: [], inherited: [] }
  }

  const index = buildIndex(previousFindings)

  const result: DeduplicationResult = { newFindings: [], skipped: [], inherited: [] }

  for (const finding of currentFindings) {
    const match = findMatch(finding, index)

    if (!match) {
      result.newFindings.push(finding)
      continue
    }

    switch (match.status) {
      case 'fixed': {
        // Checker is still firing → issue was not actually fixed; re-open it.
        // We never skip a 'fixed' finding — that would hide real problems.
        result.newFindings.push(finding)
        break
      }

      case 'dismissed': {
        result.skipped.push({
          finding,
          reason: 'Im vorherigen Run als ignoriert markiert',
          previousId: match.id,
        })
        break
      }

      case 'acknowledged': {
        const inherited: EnrichedFinding = { ...finding, inheritedStatus: 'acknowledged' }
        result.newFindings.push(inherited)
        result.inherited.push({ finding: inherited, inheritedStatus: 'acknowledged', previousId: match.id })
        break
      }

      default: {
        // open or unknown — keep as-is
        result.newFindings.push(finding)
        break
      }
    }
  }

  log.info('Deduplication complete', {
    total: currentFindings.length,
    new: result.newFindings.length,
    skipped: result.skipped.length,
    inherited: result.inherited.length,
    previousRunId: previousRun.id,
  })

  return result
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

async function getPreviousRun(
  currentRunId: string,
  organizationId: string,
): Promise<{ id: string } | null> {
  const { data } = await supabaseAdmin
    .from('audit_runs')
    .select('id')
    .eq('organization_id', organizationId)
    .neq('id', currentRunId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

async function loadPreviousFindings(runId: string): Promise<PreviousFinding[]> {
  const { data } = await supabaseAdmin
    .from('audit_findings')
    .select('id, rule_id, file_path, message, status')
    .eq('run_id', runId)

  return (data ?? []) as PreviousFinding[]
}

/**
 * Build a map from matchKey → finding.
 * When there are duplicates (same rule+file in the previous run), keep the one
 * with the highest-priority status so the most cautious decision is made.
 */
function buildIndex(findings: PreviousFinding[]): Map<string, PreviousFinding> {
  const index = new Map<string, PreviousFinding>()
  for (const f of findings) {
    const key = matchKey(f.rule_id, f.file_path)
    const existing = index.get(key)
    if (!existing || statusPriority(f.status) > statusPriority(existing.status)) {
      index.set(key, f)
    }
  }
  return index
}

function matchKey(ruleId: string, filePath: string | null | undefined): string {
  return `${ruleId || 'unknown'}::${filePath || 'global'}`
}

function findMatch(
  finding: EnrichedFinding,
  index: Map<string, PreviousFinding>,
): PreviousFinding | null {
  return index.get(matchKey(finding.ruleId, finding.filePath)) ?? null
}

/**
 * True when the same rule + file combination produces the same logical issue.
 * Strips digits (line numbers, counts) before comparing so minor formatting
 * differences don't incorrectly flag a finding as a regression.
 */
function isSameIssue(current: EnrichedFinding, previous: PreviousFinding): boolean {
  const normalize = (msg: string) =>
    msg.replace(/^\[Regression\]\s*/i, '')
       .replace(/\d+/g, 'N')
       .replace(/\s+/g, ' ')
       .trim()
       .toLowerCase()
  return normalize(current.message) === normalize(previous.message)
}

function statusPriority(status: string): number {
  switch (status) {
    case 'fixed':        return 4
    case 'dismissed':    return 3
    case 'acknowledged': return 2
    case 'open':         return 1
    default:             return 0
  }
}
