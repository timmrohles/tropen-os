// src/app/api/audit/runs/route.ts
// GET  — list audit runs for the current org
// POST — save a pre-computed report (for CI/external use)
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:audit:runs')

export async function GET() {
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

  try {
    const { data: runs, error } = await supabaseAdmin
      .from('audit_runs')
      .select('id, project_name, percentage, status, total_findings, critical_findings, created_at')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      log.error('Failed to fetch audit runs', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 })
    }

    return NextResponse.json({ runs: runs ?? [] })
  } catch (err) {
    log.error('GET /api/audit/runs error', { error: String(err) })
    return NextResponse.json({ runs: [] })
  }
}
