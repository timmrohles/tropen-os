// src/app/api/audit/fix/apply/route.ts
// POST — apply a generated fix to the local filesystem
// Requires org admin.
export const runtime = 'nodejs'
export const maxDuration = 30

import { NextResponse } from 'next/server'
import path from 'node:path'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { applyDiffs } from '@/lib/fix-engine'
import type { FileDiff } from '@/lib/fix-engine'
import { withOrgAdmin } from '@/lib/auth/route-guards'

const log = createLogger('api:audit:fix:apply')
const REPO_ROOT = path.resolve(process.cwd())

export const POST = withOrgAdmin(async (request, { auth }) => {
  if (process.env.NEXT_PUBLIC_FIX_ENGINE_ENABLED !== 'true') {
    return NextResponse.json(
      {
        error: 'fix_engine_disabled',
        message: 'Fix-Engine ist temporär deaktiviert. Nutze stattdessen den Fix-Prompt-Export.',
        documentation: 'docs/synthese/anhang-c-kill-und-einfrier-liste.md#k1',
      },
      { status: 410 }
    )
  }

  const body = await request.json().catch(() => ({})) as { fixId?: string }
  if (!body.fixId) return NextResponse.json({ error: 'fixId required' }, { status: 400 })

  // Lade Fix
  const { data: fix, error: fixErr } = await supabaseAdmin
    .from('audit_fixes')
    .select('id, status, diffs, finding_id, organization_id')
    .eq('id', body.fixId)
    .eq('organization_id', auth.organization_id)
    .single()

  if (fixErr || !fix) return NextResponse.json({ error: 'Fix not found' }, { status: 404 })
  if (fix.status !== 'pending') return NextResponse.json({ error: `Fix is already ${fix.status}` }, { status: 409 })

  log.info('Applying fix', { fixId: body.fixId, findingId: fix.finding_id })

  try {
    const diffs = fix.diffs as unknown as FileDiff[]
    const results = await applyDiffs(diffs, REPO_ROOT)

    const allSuccess = results.every((r) => r.success)
    const tsFailures = results.filter((r) => !r.success && r.tsErrors)

    // Only mark as applied if all diffs succeeded and no TS errors
    if (allSuccess) {
      await supabaseAdmin
        .from('audit_fixes')
        .update({
          status: 'applied',
          applied_at: new Date().toISOString(),
          applied_by: auth.id,
        })
        .eq('id', body.fixId)

      await supabaseAdmin
        .from('audit_findings')
        .update({ status: 'fixed', resolved_at: new Date().toISOString() })
        .eq('id', fix.finding_id)
    }

    if (tsFailures.length > 0) {
      log.warn('Fix rejected: TypeScript validation failed', {
        fixId: body.fixId,
        failures: tsFailures.map((r) => r.filePath),
      })
      return NextResponse.json({
        success: false,
        results,
        error: 'Fix konnte nicht sauber angewendet werden — TypeScript-Fehler nach dem Patchen. Backup wiederhergestellt.',
        tsErrors: tsFailures.map((r) => ({ filePath: r.filePath, errors: r.tsErrors })),
      }, { status: 422 })
    }

    if (!allSuccess) {
      const firstFailure = results.find((r) => !r.success)
      const reason = firstFailure?.error ?? 'Diff konnte nicht angewendet werden'
      log.warn('Fix not applied', { fixId: body.fixId, reason, results })
      return NextResponse.json({ success: false, error: reason, results }, { status: 422 })
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    log.error('Apply failed', { error: String(err) })
    return NextResponse.json({ error: 'Apply failed', code: 'APPLY_ERROR' }, { status: 500 })
  }
})
