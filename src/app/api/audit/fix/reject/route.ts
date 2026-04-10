// src/app/api/audit/fix/reject/route.ts
// POST — reject a pending fix
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:audit:fix:reject')

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

  const { error } = await supabaseAdmin
    .from('audit_fixes')
    .update({ status: 'rejected', rejected_at: new Date().toISOString() })
    .eq('id', body.fixId)
    .eq('organization_id', profile.organization_id)
    .eq('status', 'pending')

  if (error) {
    log.error('Reject failed', { error: error.message })
    return NextResponse.json({ error: 'Reject failed', code: 'DB_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
