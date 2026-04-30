// GET  /api/agents — alle sichtbaren Agenten (scope-basiert)
// POST /api/agents — neuen Agenten anlegen
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapAgent } from '@/types/agents'
import { createLogger } from '@/lib/logger'
import { parsePaginationParams } from '@/lib/api/pagination'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

const log = createLogger('api/agents')

// ─── GET /api/agents ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const { limit, offset } = parsePaginationParams(searchParams)
  const scopeFilter   = searchParams.get('scope')
  const packageFilter = searchParams.get('package')
  const activeOnly    = searchParams.get('active') !== 'false'

  let query = supabaseAdmin
    .from('agents')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('display_order', { ascending: true })

  if (activeOnly) query = query.eq('is_active', true)
  if (scopeFilter) query = query.eq('scope', scopeFilter)
  if (packageFilter) query = query.eq('requires_package', packageFilter)

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    log.error('GET /api/agents failed', { error: error.message })
    return apiError(error)
  }

  const isSuperadmin = me.role === 'superadmin'
  const rows = (data ?? []) as Record<string, unknown>[]

  const filtered = isSuperadmin
    ? rows
    : rows.filter((r) => {
        const scope = r.scope as string
        if (scope === 'system' || scope === 'package') return true
        if (scope === 'org') return r.organization_id === me.organization_id
        if (scope === 'user') return r.user_id === me.id
        return false
      })

  return NextResponse.json({ data: filtered.map(mapAgent), total: count ?? 0, limit, offset })
}

// ─── POST /api/agents ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || !body.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const scope = (body.scope as string) ?? 'user'

  if ((scope === 'system' || scope === 'package') && me.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (scope === 'org' && !['owner', 'admin', 'superadmin'].includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('agents')
    .insert({
      name:              body.name as string,
      description:       (body.description as string) ?? null,
      emoji:             (body.emoji as string) ?? '🤖',
      scope,
      organization_id:   scope === 'org' ? me.organization_id : null,
      user_id:           scope === 'user' ? me.id : null,
      system_prompt:     (body.systemPrompt as string) ?? null,
      trigger_type:      (body.triggerType as string) ?? null,
      trigger_config:    body.triggerConfig ?? null,
      capability_steps:  body.capabilitySteps ?? [],
      input_sources:     body.inputSources ?? [],
      output_targets:    body.outputTargets ?? [],
      requires_approval: (body.requiresApproval as boolean) ?? false,
      max_cost_eur:      (body.maxCostEur as number) ?? 1.00,
      requires_package:  (body.requiresPackage as string) ?? null,
      created_by_role:   me.role === 'superadmin' ? 'superadmin'
                          : ['owner','admin'].includes(me.role) ? 'org_admin'
                          : 'member',
      is_template:       (body.isTemplate as boolean) ?? false,
      is_active:         true,
      display_order:     0,
    })
    .select()
    .single()

  if (error) {
    log.error('POST /api/agents failed', { error: error.message })
    return apiError(error)
  }

  return NextResponse.json({ agent: mapAgent(data as Record<string, unknown>) }, { status: 201 })
}
