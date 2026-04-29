// src/app/audit/_data.ts
// Server-only data access for the audit pages. All supabaseAdmin calls live here.

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function fetchAuditRuns(orgId: string, scanProjectId?: string | null) {
  let query = supabaseAdmin
    .from('audit_runs')
    .select('id, project_name, percentage, status, total_findings, critical_findings, created_at, review_type, review_cost_eur, models_used, scan_project_id')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (scanProjectId === null) {
    query = query.is('scan_project_id', null)
  } else if (scanProjectId) {
    query = query.eq('scan_project_id', scanProjectId)
  }

  const { data } = await query
  return data ?? []
}

export async function fetchScanProjects(orgId: string) {
  const { data } = await supabaseAdmin
    .from('scan_projects')
    .select('id, name, source, file_count, last_scan_at, last_score, detected_stack, created_at, live_url')
    .eq('organization_id', orgId)
    .order('last_scan_at', { ascending: false })
  return data ?? []
}

export async function fetchAuditReviewRuns(orgId: string) {
  const { data } = await supabaseAdmin
    .from('audit_review_runs')
    .select('id, run_id, findings_count, cost_eur, models_used, quorum_met, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}

export async function fetchAuditRunDetail(runId: string) {
  const { data } = await supabaseAdmin
    .from('audit_runs')
    .select('id, project_name, percentage, status, created_at, review_type, review_cost_eur, quorum_met, models_used')
    .eq('id', runId)
    .single()
  return data as Record<string, unknown> | null
}

export async function fetchAuditCategoryScores(runId: string) {
  const { data } = await supabaseAdmin
    .from('audit_category_scores')
    .select('*')
    .eq('run_id', runId)
    .order('score', { ascending: true })
  return data ?? []
}

export async function fetchAuditFindings(runId: string) {
  const { data } = await supabaseAdmin
    .from('audit_findings')
    .select('id, rule_id, category_id, severity, message, file_path, line, suggestion, status, not_relevant_reason, resolved_at, agent_source, agent_rule_id, enforcement, consensus_level, models_flagged, avg_confidence, affected_files, fix_hint')
    .eq('run_id', runId)
    .order('severity', { ascending: true })
    .order('rule_id', { ascending: true })
    .order('id', { ascending: true })
  return data ?? []
}

export async function fetchUserOrgId(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single()
  return data?.organization_id ?? null
}
