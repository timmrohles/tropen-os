// src/app/api/audit/fix/batch-generate/route.ts
// POST — generate fixes for all critical (or critical+high) findings in a run
// Runs sequentially to avoid rate limits. maxDuration = 120.
export const runtime = 'nodejs'
export const maxDuration = 120

import { NextResponse } from 'next/server'
import path from 'node:path'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { buildFixContext, generateFix } from '@/lib/fix-engine'

const log = createLogger('api:audit:fix:batch-generate')
const REPO_ROOT = path.resolve(process.cwd())

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'owner', 'superadmin'].includes(profile.role ?? ''))
    return NextResponse.json({ error: 'Admin access required', code: 'FORBIDDEN' }, { status: 403 })

  const rawBody = await request.json().catch(() => ({})) as {
    runId?: string
    severityFilter?: string | string[]
    maxFixes?: number
    findingIds?: string[]
    mode?: string
  }

  // Zod-ähnliche Validierung
  if (!rawBody.runId || typeof rawBody.runId !== 'string') {
    return NextResponse.json({ error: 'runId required' }, { status: 400 })
  }

  const body = {
    runId: rawBody.runId,
    severityFilter: Array.isArray(rawBody.severityFilter)
      ? rawBody.severityFilter as Array<'critical' | 'high' | 'medium' | 'low'>
      : undefined,
    maxFixes: typeof rawBody.maxFixes === 'number' ? Math.min(rawBody.maxFixes, 25) : 10,
    findingIds: Array.isArray(rawBody.findingIds) ? rawBody.findingIds as string[] : undefined,
    mode: (rawBody.mode === 'consensus' ? 'consensus' : 'quick') as 'quick' | 'consensus',
  }

  // Basis-Query — organization_id is enforced via RLS (audit_findings → audit_runs.organization_id)
  let query = supabaseAdmin
    .from('audit_findings')
    .select('id, rule_id, category_id, severity, message, file_path, line, suggestion, agent_source, enforcement')
    .eq('run_id', body.runId)
    .in('status', ['open', 'acknowledged'])

  if (body.findingIds && body.findingIds.length > 0) {
    // Wenn findingIds angegeben → nur diese Findings laden, aber Limit trotzdem erzwingen
    query = query.in('id', body.findingIds)
  } else {
    // Sonst: Severity-Filter
    if (body.severityFilter && body.severityFilter.length > 0) {
      query = query.in('severity', body.severityFilter)
    } else {
      query = query.in('severity', ['critical', 'high'])
    }
  }
  // Always cap to maxFixes to avoid timeout (sequential LLM calls)
  query = query.limit(body.maxFixes)

  // Lade Findings
  const { data: findings, error: findErr } = await query

  if (findErr || !findings) {
    return NextResponse.json({ error: 'Failed to load findings' }, { status: 500 })
  }

  // Lade bereits existierende Fixes für diesen Run
  const { data: existingFixes } = await supabaseAdmin
    .from('audit_fixes')
    .select('finding_id')
    .eq('run_id', body.runId)
    .in('status', ['pending', 'applied'])

  const alreadyFixed = new Set((existingFixes ?? []).map((f) => f.finding_id))
  const toFix = findings.filter((f) => !alreadyFixed.has(f.id))

  log.info('Batch generate started', {
    runId: body.runId,
    total: findings.length,
    toGenerate: toFix.length,
    skipped: alreadyFixed.size,
  })

  const results: Array<{ findingId: string; fixId?: string; success: boolean; error?: string }> = []
  let totalCostEur = 0

  for (const finding of toFix) {
    try {
      const ctx = buildFixContext(finding, REPO_ROOT)
      const { fix, model, costEur } = await generateFix(ctx)
      totalCostEur += costEur

      const { data: fixRow } = await supabaseAdmin
        .from('audit_fixes')
        .insert({
          run_id: body.runId,
          finding_id: finding.id,
          organization_id: profile.organization_id,
          explanation: fix.explanation,
          confidence: fix.confidence,
          diffs: fix.diffs as unknown as Record<string, unknown>[],
          status: 'pending',
          model,
          cost_eur: costEur,
        })
        .select('id')
        .single()

      results.push({ findingId: finding.id, fixId: fixRow?.id, success: true })
    } catch (err) {
      log.error('Batch: fix failed for finding', { findingId: finding.id, error: String(err) })
      results.push({ findingId: finding.id, success: false, error: String(err) })
    }
  }

  const successCount = results.filter((r) => r.success).length
  log.info('Batch generate complete', { successCount, total: toFix.length, totalCostEur: totalCostEur.toFixed(4) })

  return NextResponse.json({
    generated: successCount,
    failed: toFix.length - successCount,
    skipped: alreadyFixed.size,
    totalCostEur,
    results,
  })
}
