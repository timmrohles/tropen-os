// GET  /api/skills — alle für User sichtbaren Skills
// POST /api/skills — neuen Skill anlegen
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapSkill } from '@/types/agents'
import { createLogger } from '@/lib/logger'
import { parsePaginationParams } from '@/lib/api/pagination'

export const runtime = 'nodejs'

const log = createLogger('api/skills')

// ─── GET /api/skills ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const { limit, offset } = parsePaginationParams(url.searchParams)
  const scopeFilter = url.searchParams.get('scope')       // optional: 'system' | 'org' | 'user'
  const activeOnly = url.searchParams.get('active') !== 'false'

  // Visibility filter: system + package + own-org + own-user
  const orFilter = [
    'scope.eq.system',
    'scope.eq.package',
    `and(scope.eq.org,organization_id.eq.${me.organization_id})`,
    `and(scope.eq.user,user_id.eq.${me.id})`,
  ].join(',')

  let query = supabaseAdmin
    .from('skills')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .or(orFilter)
    .order('scope', { ascending: true })
    .order('title', { ascending: true })

  if (activeOnly) query = query.eq('is_active', true)
  if (scopeFilter) query = query.eq('scope', scopeFilter)

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    log.error('GET /api/skills failed', { error: error.message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({
    data: (data ?? []).map((row) => mapSkill(row as Record<string, unknown>)),
    total: count ?? 0,
    limit,
    offset,
  })
}

// ─── POST /api/skills ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.name || !body?.title || !body?.instructions) {
    return NextResponse.json(
      { error: 'name, title, and instructions are required' },
      { status: 400 }
    )
  }

  // Scope validation
  const scope = (body.scope as string) ?? 'user'

  if (scope === 'org') {
    if (!['owner', 'admin', 'superadmin'].includes(me.role)) {
      return NextResponse.json(
        { error: 'Forbidden: org-scope skills require org admin or higher' },
        { status: 403 }
      )
    }
  }

  if (['system', 'package'].includes(scope) && me.role !== 'superadmin') {
    return NextResponse.json(
      { error: 'Forbidden: system/package skills require superadmin' },
      { status: 403 }
    )
  }

  const insertData: Record<string, unknown> = {
    name:                body.name,
    title:               body.title,
    description:         body.description ?? null,
    scope,
    instructions:        body.instructions,
    context_requirements: body.contextRequirements ?? null,
    governance_rules:    body.governanceRules ?? null,
    quality_criteria:    body.qualityCriteria ?? null,
    input_schema:        body.inputSchema ?? {},
    output_type:         body.outputType ?? 'text',
    trigger_keywords:    body.triggerKeywords ?? [],
    is_active:           body.isActive ?? true,
    is_template:         body.isTemplate ?? false,
    requires_package:    body.requiresPackage ?? null,
    created_by_role:     me.role === 'superadmin' ? 'superadmin'
                         : ['owner', 'admin'].includes(me.role) ? 'org_admin'
                         : 'member',
    source_skill_id:     body.sourceSkillId ?? null,
  }

  // Attach to correct owner
  if (scope === 'user') {
    insertData.user_id = me.id
  } else if (scope === 'org') {
    insertData.organization_id = me.organization_id
  }

  const { data, error } = await supabaseAdmin
    .from('skills')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    log.error('POST /api/skills failed', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { skill: mapSkill(data as Record<string, unknown>) },
    { status: 201 }
  )
}
