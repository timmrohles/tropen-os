// src/app/api/audit/trigger/route.ts
// POST — run audit engine + persist results to DB
// Requires org admin. Long-running: maxDuration = 60.
export const runtime = 'nodejs'
export const maxDuration = 120

import { NextResponse } from 'next/server'
import { z } from 'zod'
import path from 'node:path'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { buildAuditContext, runAudit } from '@/lib/audit'
import { AUDIT_RULES } from '@/lib/audit/rule-registry'
import { deduplicateFindings } from '@/lib/audit/deduplicator'
import type { AuditReport, CategoryScore } from '@/lib/audit/types'
import type { EnrichedFinding } from '@/lib/audit/deduplicator'

const log = createLogger('api:audit:trigger')
const REPO_ROOT = path.resolve(process.cwd())

const requestSchema = z.object({
  projectName: z.string().min(1).max(100).optional(),
  skipCli: z.boolean().optional().default(false),
  withTools: z.boolean().optional().default(false),
  lighthouseUrl: z.string().url().optional(),
  deepSecrets: z.boolean().optional().default(false),
})

function toDbStatus(status: AuditReport['status']): 'production_grade' | 'stable' | 'risky' | 'prototype' {
  return status.replace(/-/g, '_') as 'production_grade' | 'stable' | 'risky' | 'prototype'
}

function computeScore(cat: CategoryScore): number {
  if (cat.automatedRuleCount === 0) return 0
  return parseFloat(((cat.automatedPercentage ?? 0) / 100 * 5).toFixed(2))
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!['admin', 'owner', 'superadmin'].includes(profile.role ?? '')) {
    return NextResponse.json({ error: 'Admin access required', code: 'FORBIDDEN' }, { status: 403 })
  }

  let body: z.infer<typeof requestSchema>
  try {
    const raw = await request.json().catch(() => ({}))
    const parsed = requestSchema.safeParse(raw)
    body = parsed.success ? parsed.data : { skipCli: false, withTools: false, deepSecrets: false }
  } catch {
    body = { skipCli: false, withTools: false, deepSecrets: false }
  }

  log.info('Audit trigger started', { orgId: profile.organization_id })

  try {
    const skipModes: import('@/lib/audit/types').CheckMode[] = []
    if (body.skipCli) skipModes.push('cli')

    const externalTools = { lighthouseUrl: body.lighthouseUrl, deepSecretsScan: body.deepSecrets }

    log.info('Audit options', { withTools: true, skipModes })

    const ctx = await buildAuditContext(REPO_ROOT, undefined, 8192)
    const report = await runAudit(ctx, { rootPath: REPO_ROOT, skipModes, externalTools })

    // Compute aggregated values
    const allFindings = report.categories.flatMap((c) =>
      c.ruleResults.flatMap((r) =>
        r.findings.map((f) => ({ ...f, ruleId: r.ruleId, categoryId: c.categoryId }))
      )
    )
    const totalScore = report.categories.reduce((s, c) => s + c.weightedScore * c.weight, 0)
    const totalMax = report.categories.reduce((s, c) => s + c.weightedMax * c.weight, 0)

    // 1. Insert audit_runs
    const { data: runRow, error: runErr } = await supabaseAdmin
      .from('audit_runs')
      .insert({
        organization_id: profile.organization_id,
        project_name: body.projectName ?? report.project ?? 'Tropen OS',
        triggered_by: user.id,
        trigger_type: 'manual',
        total_score: totalScore,
        total_max: totalMax,
        percentage: report.automatedPercentage,
        status: toDbStatus(report.status),
        total_rules: report.automatedRuleCount + report.manualRuleCount,
        automated_rules: report.automatedRuleCount,
        manual_rules: report.manualRuleCount,
        total_findings: allFindings.length,
        critical_findings: report.criticalFindings.length,
        full_report: report as unknown as Record<string, unknown>,
      })
      .select('id')
      .single()

    if (runErr || !runRow) {
      log.error('Failed to insert audit_run', { error: runErr?.message })
      return NextResponse.json({ error: 'Failed to save audit run', code: 'DB_ERROR' }, { status: 500 })
    }

    const runId = runRow.id

    // 2. Insert category scores
    const categoryRows = report.categories.map((c) => {
      const score = computeScore(c)
      return {
        run_id: runId,
        category_id: c.categoryId,
        category_name: c.name,
        category_weight: c.weight,
        score,
        max_score: 5.0,
        weighted_score: score * c.weight,
        max_weighted_score: 5.0 * c.weight,
        automated_rule_count: c.automatedRuleCount,
        manual_rule_count: c.manualRuleCount,
      }
    })

    const { error: catErr } = await supabaseAdmin
      .from('audit_category_scores')
      .insert(categoryRows)

    if (catErr) {
      log.error('Failed to insert category scores', { error: catErr.message })
    }

    // 3. Deduplicate findings against the previous run
    const enrichedFindings = allFindings as EnrichedFinding[]
    let newFindings = enrichedFindings
    let skippedCount = 0
    let inheritedCount = 0
    try {
      const result = await deduplicateFindings(enrichedFindings, runId, profile.organization_id)
      newFindings = result.newFindings
      skippedCount = result.skipped.length
      inheritedCount = result.inherited.length
    } catch (dedupErr) {
      log.warn('Deduplication failed — proceeding with all findings', { error: String(dedupErr) })
    }

    // Update audit_runs totals to reflect deduplicated counts
    if (skippedCount > 0) {
      const actualCritical = newFindings.filter((f) => f.severity === 'critical').length
      await supabaseAdmin
        .from('audit_runs')
        .update({ total_findings: newFindings.length, critical_findings: actualCritical })
        .eq('id', runId)
    }

    // 4. Insert deduplicated findings (with agent attribution + inherited status)
    if (newFindings.length > 0) {
      const findingRows = newFindings.map((f) => {
        const rule = AUDIT_RULES.find((r) => r.id === f.ruleId)
        return {
          run_id: runId,
          rule_id: f.ruleId,
          category_id: f.categoryId,
          severity: f.severity,
          message: f.message,
          file_path: f.filePath ?? null,
          line: f.line ?? null,
          suggestion: f.suggestion ?? null,
          agent_source: f.agentSource ?? rule?.agentSource ?? 'core',
          agent_rule_id: f.agentRuleId ?? rule?.agentRuleId ?? null,
          enforcement: f.enforcement ?? rule?.enforcement ?? null,
          affected_files: f.affectedFiles ?? null,
          fix_hint: f.fixHint ?? null,
          ...(f.inheritedStatus ? { status: f.inheritedStatus } : {}),
        }
      })

      const { error: findErr } = await supabaseAdmin
        .from('audit_findings')
        .insert(findingRows)

      if (findErr) {
        log.error('Failed to insert findings', { error: findErr.message })
      }
    }

    log.info('Audit trigger complete', {
      runId,
      percentage: report.automatedPercentage,
      status: report.status,
    })

    return NextResponse.json({
      runId,
      percentage: report.automatedPercentage,
      status: report.status,
      totalFindings: allFindings.length,
    })
  } catch (err) {
    log.error('Audit trigger failed', { error: String(err) })
    return NextResponse.json({ error: 'Audit failed', code: 'AUDIT_ERROR' }, { status: 500 })
  }
}
