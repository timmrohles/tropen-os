// src/app/api/audit/fix/reject/route.ts
// POST — reject a pending fix
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withOrgAdmin } from '@/lib/auth/route-guards'

const log = createLogger('api:audit:fix:reject')

export const POST = withOrgAdmin(async (request, { auth }) => {
  const body = await request.json().catch(() => ({})) as { fixId?: string }
  if (!body.fixId) return NextResponse.json({ error: 'fixId required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('audit_fixes')
    .update({ status: 'rejected', rejected_at: new Date().toISOString() })
    .eq('id', body.fixId)
    .eq('organization_id', auth.organization_id)
    .eq('status', 'pending')

  if (error) {
    log.error('Reject failed', { error: error.message })
    return NextResponse.json({ error: 'Reject failed', code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
})
