// src/app/api/audit/findings/[id]/route.ts
// PATCH — update finding status (acknowledged, fixed, dismissed)
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:audit:findings:id')

const patchSchema = z.object({
  status: z.enum(['open', 'acknowledged', 'fixed', 'dismissed']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: z.infer<typeof patchSchema>
  try {
    const raw = await request.json()
    const parsed = patchSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status', details: parsed.error.flatten() }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Verify finding belongs to org (via run → organization_id)
  const { data: finding } = await supabaseAdmin
    .from('audit_findings')
    .select('id, run_id')
    .eq('id', id)
    .single()

  if (!finding) {
    return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
  }

  const { data: run } = await supabaseAdmin
    .from('audit_runs')
    .select('organization_id')
    .eq('id', finding.run_id)
    .single()

  if (run?.organization_id !== profile.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const isResolved = body.status === 'open'
    const { data: updated, error } = await supabaseAdmin
      .from('audit_findings')
      .update({
        status: body.status,
        resolved_at: isResolved ? null : new Date().toISOString(),
        resolved_by: isResolved ? null : user.id,
      })
      .eq('id', id)
      .select('id, status, resolved_at')
      .single()

    if (error) {
      log.error('Failed to update finding', { error: error.message, findingId: id })
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ finding: updated })
  } catch (err) {
    log.error('PATCH /api/audit/findings/[id] error', { error: String(err), findingId: id })
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
