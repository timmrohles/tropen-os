// src/app/api/audit/runs/[id]/route.ts
// GET — single audit run with category scores + findings + previous run delta
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withAuth } from '@/lib/auth/route-guards'

const log = createLogger('api:audit:runs:id')

export const GET = withAuth<{ id: string }>(async (_req, { params, auth }) => {
  const { id } = params

  try {
    const [runRes, categoriesRes, findingsRes] = await Promise.all([
      supabaseAdmin
        .from('audit_runs')
        .select('*')
        .eq('id', id)
        .eq('organization_id', auth.organization_id)
        .single(),

      supabaseAdmin
        .from('audit_category_scores')
        .select('*')
        .eq('run_id', id)
        .order('score', { ascending: true }),

      supabaseAdmin
        .from('audit_findings')
        .select('*')
        .eq('run_id', id)
        .order('severity', { ascending: true }),
    ])

    if (runRes.error || !runRes.data) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }

    // Find previous run for delta
    const { data: prevRuns } = await supabaseAdmin
      .from('audit_runs')
      .select('id, percentage, created_at')
      .eq('organization_id', auth.organization_id)
      .lt('created_at', runRes.data.created_at)
      .order('created_at', { ascending: false })
      .limit(1)

    const previousRun = prevRuns?.[0] ?? null

    return NextResponse.json({
      run: runRes.data,
      categories: categoriesRes.data ?? [],
      findings: findingsRes.data ?? [],
      previousRun,
    })
  } catch (err) {
    log.error('GET /api/audit/runs/[id] error', { error: String(err), runId: id })
    return NextResponse.json({ error: 'Failed to fetch run' }, { status: 500 })
  }
})
