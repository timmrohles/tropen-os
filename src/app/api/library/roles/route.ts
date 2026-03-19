// GET /api/library/roles + POST create
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { createRoleSchema } from '@/lib/validators/library'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/roles')

export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin.from('roles')
      .select('id, name, label, icon, description, scope, requires_package, system_prompt, domain_keywords, preferred_capability_types, preferred_outcome_types, recommended_model_class, is_active, is_default, is_public, sort_order')
      .is('deleted_at', null)
      .eq('is_active', true)
      .or(`scope.in.(system,public),scope.eq.package,and(scope.eq.org,organization_id.eq.${me.organization_id}),and(scope.eq.user,user_id.eq.${me.id})`)
      .order('sort_order')

    if (error) { log.error('fetch roles', { error }); throw error }
    return NextResponse.json({ roles: data ?? [] })
  } catch (err) {
    log.error('GET /api/library/roles', { err })
    return NextResponse.json({ error: 'Failed to load roles' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const validated = await validateBody(req, createRoleSchema)
  if (validated.error) return validated.error

  const { scope, ...rest } = validated.data
  const isAdmin = ['superadmin','owner','admin'].includes(me.role)

  if (scope === 'org' && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { data, error } = await supabaseAdmin.from('roles').insert({
      ...rest,
      scope,
      organization_id: scope === 'org' ? me.organization_id : null,
      user_id: scope === 'user' ? me.id : null,
      created_by_role: me.role === 'superadmin' ? 'superadmin' : isAdmin ? 'org_admin' : 'member',
    }).select('id').single()

    if (error) { log.error('insert role', { error }); throw error }

    await supabaseAdmin.from('library_versions').insert({
      entity_type: 'role', entity_id: data.id,
      organization_id: me.organization_id, changed_by: me.id,
      change_type: 'create', snapshot: { ...rest, scope },
    })

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (err) {
    log.error('POST /api/library/roles', { err })
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
  }
}
