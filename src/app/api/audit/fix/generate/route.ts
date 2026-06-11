// src/app/api/audit/fix/generate/route.ts
// POST — generate an AI fix for a single audit finding
// Requires org admin. maxDuration = 60.
export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import path from 'node:path'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { buildFixContext, generateFix, assessRisk } from '@/lib/fix-engine'
import { withOrgAdmin } from '@/lib/auth/route-guards'

const log = createLogger('api:audit:fix:generate')
const REPO_ROOT = path.resolve(process.cwd())

export const POST = withOrgAdmin(async (request, { auth }) => {
  if (process.env.NEXT_PUBLIC_FIX_ENGINE_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'fix_engine_disabled', message: 'Fix-Engine ist temporär deaktiviert. Nutze stattdessen den Fix-Prompt-Export.', documentation: 'docs/synthese/anhang-c-kill-und-einfrier-liste.md#k1' },
      { status: 410 }
    )
  }

  const body = await request.json().catch(() => ({})) as { findingId?: string; runId?: string }
  if (!body.findingId || !body.runId)
    return NextResponse.json({ error: 'findingId and runId required' }, { status: 400 })

  // Lade Finding aus DB
  const { data: finding, error: findErr } = await supabaseAdmin
    .from('audit_findings')
    .select('id, rule_id, category_id, severity, message, file_path, line, suggestion, agent_source, enforcement, run_id, affected_files, fix_hint')
    .eq('id', body.findingId)
    .eq('run_id', body.runId)
    .single()

  if (findErr || !finding)
    return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

  // Prüfe ob bereits ein pending/applied Fix existiert
  const { data: existingFix } = await supabaseAdmin
    .from('audit_fixes')
    .select('id, status')
    .eq('finding_id', body.findingId)
    .in('status', ['pending', 'applied'])
    .single()

  if (existingFix)
    return NextResponse.json({ error: 'Fix already exists', fixId: existingFix.id, status: existingFix.status }, { status: 409 })

  log.info('Generating fix', { findingId: body.findingId, ruleId: finding.rule_id })

  try {
    const ctx = buildFixContext(finding, REPO_ROOT)
    const { fix, model, costEur } = await generateFix(ctx)
    const riskAssessment = await assessRisk(ctx)

    // Speichere Fix in DB
    const { data: fixRow, error: insertErr } = await supabaseAdmin
      .from('audit_fixes')
      .insert({
        run_id: body.runId,
        finding_id: body.findingId,
        organization_id: auth.organization_id,
        explanation: fix.explanation,
        confidence: fix.confidence,
        diffs: fix.diffs as unknown as Record<string, unknown>[],
        status: 'pending',
        model,
        cost_eur: costEur,
        fix_mode: 'quick',
        risk_level: riskAssessment.level,
        risk_details: riskAssessment as unknown as Record<string, unknown>,
      })
      .select('id')
      .single()

    if (insertErr || !fixRow) {
      log.error('Failed to save fix', { error: insertErr?.message })
      return NextResponse.json({ error: 'Failed to save fix', code: 'DB_ERROR' }, { status: 500 })
    }

    return NextResponse.json({
      fixId: fixRow.id,
      explanation: fix.explanation,
      confidence: fix.confidence,
      diffs: fix.diffs,
      model,
      costEur,
      riskLevel: riskAssessment.level,
      riskAssessment,
    })
  } catch (err) {
    log.error('Fix generation failed', { error: String(err) })
    return NextResponse.json({ error: 'Fix generation failed', code: 'GENERATE_ERROR' }, { status: 500 })
  }
})
