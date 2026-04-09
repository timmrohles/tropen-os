// src/app/api/audit/fix/apply/route.ts
// POST — apply a generated fix to the local filesystem
// Requires org admin.
export const runtime = 'nodejs'
export const maxDuration = 30

import { NextResponse } from 'next/server'
import path from 'node:path'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { applyDiffs } from '@/lib/fix-engine'
import type { FileDiff } from '@/lib/fix-engine'

const log = createLogger('api:audit:fix:apply')
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

  const body = await request.json().catch(() => ({})) as { fixId?: string }
  if (!body.fixId) return NextResponse.json({ error: 'fixId required' }, { status: 400 })

  // Lade Fix
  const { data: fix, error: fixErr } = await supabaseAdmin
    .from('audit_fixes')
    .select('id, status, diffs, finding_id, organization_id')
    .eq('id', body.fixId)
    .eq('organization_id', profile.organization_id)
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
          applied_by: user.id,
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

    return NextResponse.json({ success: allSuccess, results })
  } catch (err) {
    log.error('Apply failed', { error: String(err) })
    return NextResponse.json({ error: 'Apply failed', code: 'APPLY_ERROR' }, { status: 500 })
  }
}
