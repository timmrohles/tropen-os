// src/app/api/audit/review/route.ts
// POST — run multi-model review pipeline for an existing audit run
// Requires org admin. Long-running: maxDuration = 120.
export const runtime = 'nodejs'
export const maxDuration = 120

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { runMultiModelReview } from '@/lib/review/orchestrator'
import { checkDeepReviewRateLimit, recordDeepReviewInvocation } from '@/lib/audit/deep-review-rate-limit'
import { withOrgAdmin } from '@/lib/auth/route-guards'

const log = createLogger('api:audit:review')

const requestSchema = z.object({
  runId: z.string().uuid(),
})

export const POST = withOrgAdmin(async (request, { auth }) => {
  // Rate-Limit: 24h Cooldown + 10/Monat pro User
  const rateLimit = await checkDeepReviewRateLimit(auth.id)
  if (!rateLimit.allowed) {
    return NextResponse.json({
      error: 'rate-limit',
      reason: rateLimit.reason,
      cooldownExpires: rateLimit.cooldownExpires,
      usedThisMonth: rateLimit.usedThisMonth,
      monthlyLimit: rateLimit.monthlyLimit,
    }, { status: 429 })
  }

  const raw = await request.json().catch(() => ({}))
  const parsed = requestSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', code: 'VALIDATION_ERROR' }, { status: 400 })
  }
  const { runId } = parsed.data

  // Verify run belongs to this org
  const { data: run } = await supabaseAdmin
    .from('audit_runs')
    .select('id, full_report')
    .eq('id', runId)
    .eq('organization_id', auth.organization_id)
    .single()

  if (!run) {
    return NextResponse.json({ error: 'Run not found', code: 'NOT_FOUND' }, { status: 404 })
  }

  // Build repo summary from the stored full_report
  const report = run.full_report as Record<string, unknown> | null
  const repoSummary = report
    ? `Audit report summary:\n${JSON.stringify(report).slice(0, 20000)}`
    : 'No report data available.'

  // Fetch existing open findings for context (avoid duplicates)
  const { data: existingFindings } = await supabaseAdmin
    .from('audit_findings')
    .select('message')
    .eq('run_id', runId)
    .eq('status', 'open')
    .limit(30)

  const recentFindings = existingFindings?.map((f) => f.message) ?? []

  log.info('Multi-model review started', { runId, orgId: auth.organization_id })

  try {
    const result = await runMultiModelReview({
      runId,
      repoSummary,
      recentFindings,
    })

    if (!result.quorumMet) {
      log.warn('Review quorum not met', { runId, modelsUsed: result.modelsUsed })
    }

    // Remove previous consensus findings so re-runs don't duplicate
    await supabaseAdmin
      .from('audit_findings')
      .delete()
      .eq('run_id', runId)
      .not('consensus_level', 'is', null)

    // Update audit_runs with review metadata
    await supabaseAdmin
      .from('audit_runs')
      .update({
        review_type: 'multi_model',
        models_used: result.modelsUsed,
        judge_model: result.judgeModel,
        review_cost_eur: result.totalCostEur,
        quorum_met: result.quorumMet,
      })
      .eq('id', runId)

    // Record this review run in history table
    await supabaseAdmin
      .from('audit_review_runs')
      .insert({
        run_id: runId,
        organization_id: auth.organization_id,
        findings_count: result.consensusFindings.length,
        cost_eur: result.totalCostEur,
        models_used: result.modelsUsed,
        quorum_met: result.quorumMet,
        judge_model: result.judgeModel,
      })

    // Insert consensus findings
    if (result.consensusFindings.length > 0) {
      const findingRows = result.consensusFindings.map((f) => ({
        run_id: runId,
        rule_id: f.ruleRef,
        category_id: 0,  // cross-cutting — no single category
        severity: f.severity,
        message: f.message,
        file_path: f.filePath ?? null,
        suggestion: f.suggestion ?? null,
        agent_source: 'core' as const,
        consensus_level: f.consensusLevel,
        models_flagged: f.modelsFlagged,
        avg_confidence: f.avgConfidence,
      }))

      await supabaseAdmin.from('audit_findings').insert(findingRows)
    }

    // Record invocation for rate-limiting (fire-and-forget, non-blocking)
    void recordDeepReviewInvocation(auth.id, runId, result.totalCostEur)

    log.info('Multi-model review complete', {
      runId,
      findings: result.consensusFindings.length,
      costEur: result.totalCostEur,
      quorumMet: result.quorumMet,
    })

    return NextResponse.json({
      runId,
      findings: result.consensusFindings.length,
      modelsUsed: result.modelsUsed,
      totalCostEur: result.totalCostEur,
      quorumMet: result.quorumMet,
    })
  } catch (err) {
    log.error('Multi-model review failed', { error: String(err) })
    return NextResponse.json({ error: 'Review failed', code: 'REVIEW_ERROR' }, { status: 500 })
  }
})
