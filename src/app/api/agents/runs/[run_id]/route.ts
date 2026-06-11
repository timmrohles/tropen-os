// GET /api/agents/runs/[run_id] — einzelner Run mit Details
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapAgentRun } from '@/types/agents'

export const runtime = 'nodejs'

export const GET = withAuth<{ run_id: string }>(async (_request, { auth: me, params }) => {
  const { run_id } = params

  const { data } = await supabaseAdmin
    .from('agent_runs')
    .select('*')
    .eq('id', run_id)
    .single()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const row = data as Record<string, unknown>

  // Access check: own org or superadmin
  if (
    row.organization_id !== me.organization_id &&
    row.user_id !== me.id &&
    me.role !== 'superadmin'
  ) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ run: mapAgentRun(row) })
})
