// GET /api/agents/[id]/runs — Run-History mit Pagination
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapAgentRun } from '@/types/agents'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '20', 10), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  // Verify agent is accessible to this user's org before exposing run history
  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('organization_id, scope, user_id')
    .eq('id', id)
    .maybeSingle()

  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const accessible =
    ['system', 'package'].includes(agent.scope as string) ||
    (agent.scope === 'org' && agent.organization_id === me.organization_id) ||
    (agent.scope === 'user' && agent.user_id === me.id) ||
    me.role === 'superadmin'

  if (!accessible) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error, count } = await supabaseAdmin
    .from('agent_runs')
    .select('*', { count: 'exact' })
    .eq('agent_id', id)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return apiError(error)

  return NextResponse.json({
    runs:  (data ?? []).map((r) => mapAgentRun(r as Record<string, unknown>)),
    total: count ?? 0,
  })
}
