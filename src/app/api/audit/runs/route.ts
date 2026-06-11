// src/app/api/audit/runs/route.ts
// GET  — list audit runs for the current org
// POST — save a pre-computed report (for CI/external use)
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withAuth } from '@/lib/auth/route-guards'

const log = createLogger('api:audit:runs')

export const GET = withAuth(async (_req, { auth }) => {
  try {
    const { data: runs, error } = await supabaseAdmin
      .from('audit_runs')
      .select('id, project_name, percentage, status, total_findings, critical_findings, created_at')
      .eq('organization_id', auth.organization_id)
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
})
