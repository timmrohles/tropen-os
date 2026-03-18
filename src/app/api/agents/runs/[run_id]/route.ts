// GET /api/agents/runs/[run_id] — einzelner Run mit Details
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapAgentRun } from '@/types/agents'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ run_id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { run_id } = await params

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
}
