// src/app/api/audit/fix/consensus/route.ts
// POST — generate a consensus AI fix (4 models + Opus judge) for a single audit finding
// Requires org admin. maxDuration = 120.
export const runtime = 'nodejs'
export const maxDuration = 120

import { NextResponse } from 'next/server'
import path from 'node:path'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { buildFixContext, generateConsensusFix, assessRisk } from '@/lib/fix-engine'

const log = createLogger('api:audit:fix:consensus')
const REPO_ROOT = path.resolve(process.cwd())

export async function POST(request: Request) {
  // Auth check (nur admin)
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

  const body = await request.json().catch(() => ({})) as { findingId?: string; runId?: string }
  if (!body.findingId || !body.runId)
    return NextResponse.json({ error: 'findingId and runId required' }, { status: 400 })

  // Lade Finding aus DB
  const { data: finding, error: findErr } = await supabaseAdmin
    .from('audit_findings')
    .select('id, rule_id, category_id, severity, message, file_path, line, suggestion, agent_source, enforcement, run_id')
    .eq('id', body.findingId)
    .eq('run_id', body.runId)
    .single()

  if (findErr || !finding)
    return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

  // Prüfe ob bereits ein pending/applied Consensus-Fix existiert
  const { data: existingFix } = await supabaseAdmin
    .from('audit_fixes')
    .select('id, status, fix_mode')
    .eq('finding_id', body.findingId)
    .eq('fix_mode', 'consensus')
    .in('status', ['pending', 'applied'])
    .single()

  if (existingFix)
    return NextResponse.json({ error: 'Consensus fix already exists', fixId: existingFix.id, status: existingFix.status }, { status: 409 })

  log.info('Generating consensus fix', { findingId: body.findingId, ruleId: finding.rule_id })

  try {
    const ctx = buildFixContext(finding, REPO_ROOT)

    // Run consensus generation and risk assessment in parallel
    const [{ consensus, model, totalCostEur }, riskAssessment] = await Promise.all([
      generateConsensusFix(ctx),
      assessRisk(ctx),
    ])

    // Find winning draft
    const winner = consensus.drafts.find((d) => d.providerId === consensus.winnerProviderId)
    const explanation = winner?.explanation ?? consensus.judgeExplanation
    const confidence = winner?.confidence ?? 'medium'
    const diffs = winner?.diffs ?? []

    // Speichere Fix in DB
    const { data: fixRow, error: insertErr } = await supabaseAdmin
      .from('audit_fixes')
      .insert({
        run_id: body.runId,
        finding_id: body.findingId,
        organization_id: profile.organization_id,
        explanation,
        confidence,
        diffs: diffs as unknown as Record<string, unknown>[],
        status: 'pending',
        model,
        cost_eur: totalCostEur,
        fix_mode: 'consensus',
        risk_level: riskAssessment.level,
        risk_details: riskAssessment as unknown as Record<string, unknown>,
        drafts: consensus.drafts as unknown as Record<string, unknown>[],
        judge_explanation: consensus.judgeExplanation,
      })
      .select('id')
      .single()

    if (insertErr || !fixRow) {
      log.error('Failed to save consensus fix', { error: insertErr?.message })
      return NextResponse.json({ error: 'Failed to save fix', code: 'DB_ERROR' }, { status: 500 })
    }

    return NextResponse.json({
      fixId: fixRow.id,
      explanation,
      confidence,
      diffs,
      model,
      costEur: totalCostEur,
      fixMode: 'consensus',
      consensusLevel: consensus.consensusLevel,
      winnerProviderId: consensus.winnerProviderId,
      judgeExplanation: consensus.judgeExplanation,
      draftsCount: consensus.drafts.length,
      riskLevel: riskAssessment.level,
      riskAssessment,
    })
  } catch (err) {
    log.error('Consensus fix generation failed', { error: String(err) })
    return NextResponse.json({ error: 'Consensus fix generation failed', code: 'GENERATE_ERROR' }, { status: 500 })
  }
}
