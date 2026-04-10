// GET    /api/agents/[id] — einzelner Agent mit letzten 5 Runs
// PATCH  /api/agents/[id] — bearbeiten
// DELETE /api/agents/[id] — Soft Delete
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapAgent, mapAgentRun } from '@/types/agents'
import { createLogger } from '@/lib/logger'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

const log = createLogger('api/agents/[id]')

// ─── GET /api/agents/[id] ────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: agentData } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!agentData) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const row = agentData as Record<string, unknown>

  // Scope check
  const scope = row.scope as string
  const isSuperadmin = me.role === 'superadmin'
  if (!isSuperadmin) {
    if (scope === 'org' && row.organization_id !== me.organization_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (scope === 'user' && row.user_id !== me.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  // Last 5 runs
  const { data: runsData } = await supabaseAdmin
    .from('agent_runs')
    .select('*')
    .eq('agent_id', id)
    .order('started_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    agent: mapAgent(row),
    runs: (runsData ?? []).map((r) => mapAgentRun(r as Record<string, unknown>)),
  })
}

// ─── PATCH /api/agents/[id] ──────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: existing } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const row = existing as Record<string, unknown>
  const canEdit =
    row.user_id === me.id ||
    (row.scope === 'org' && row.organization_id === me.organization_id && ['owner','admin'].includes(me.role)) ||
    me.role === 'superadmin'

  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const allowedFields: Record<string, string> = {
    name:             'name',
    description:      'description',
    emoji:            'emoji',
    systemPrompt:     'system_prompt',
    triggerType:      'trigger_type',
    triggerConfig:    'trigger_config',
    capabilitySteps:  'capability_steps',
    inputSources:     'input_sources',
    outputTargets:    'output_targets',
    requiresApproval: 'requires_approval',
    maxCostEur:       'max_cost_eur',
    isActive:         'is_active',
    isTemplate:       'is_template',
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const [camel, snake] of Object.entries(allowedFields)) {
    if (camel in body) updates[snake] = body[camel]
  }

  const { data, error } = await supabaseAdmin
    .from('agents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    log.error('PATCH /api/agents/[id] failed', { id, error: error.message })
    return apiError(error)
  }

  return NextResponse.json({ agent: mapAgent(data as Record<string, unknown>) })
}

// ─── DELETE /api/agents/[id] — Soft Delete ───────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: existing } = await supabaseAdmin
    .from('agents')
    .select('user_id, scope, organization_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const row = existing as Record<string, unknown>
  const canDelete =
    row.user_id === me.id || me.role === 'superadmin'

  if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabaseAdmin
    .from('agents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    log.error('DELETE /api/agents/[id] failed', { id, error: error.message })
    return apiError(error)
  }

  return NextResponse.json({ ok: true })
}
