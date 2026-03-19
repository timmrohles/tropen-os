// GET /api/library/skills + POST create
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { createSkillSchema } from '@/lib/validators/library'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/skills')

export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin.from('skills')
    .select('id, name, title, icon, description, scope, requires_package, instructions, trigger_keywords, recommended_role_name, recommended_capability_type, output_type, is_active, is_public, is_template, sort_order')
    .is('deleted_at', null)
    .eq('is_active', true)
    .or(`scope.in.(system,public),scope.eq.package,and(scope.eq.org,organization_id.eq.${me.organization_id}),and(scope.eq.user,user_id.eq.${me.id})`)
    .order('sort_order')

  return NextResponse.json({ skills: data ?? [] })
}

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const validated = await validateBody(req, createSkillSchema)
  if (validated.error) return validated.error

  const { scope, ...rest } = validated.data
  const isAdmin = ['superadmin','owner','admin'].includes(me.role)
  if (scope === 'org' && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { data, error } = await supabaseAdmin.from('skills').insert({
      ...rest, scope,
      organization_id: scope === 'org' ? me.organization_id : null,
      user_id: scope === 'user' ? me.id : null,
      created_by_role: me.role === 'superadmin' ? 'superadmin' : isAdmin ? 'org_admin' : 'member',
    }).select('id').single()

    if (error) { log.error('insert skill', { error }); throw error }

    await supabaseAdmin.from('library_versions').insert({
      entity_type: 'skill', entity_id: data.id,
      organization_id: me.organization_id, changed_by: me.id,
      change_type: 'create', snapshot: { ...rest, scope },
    })

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (err) {
    log.error('POST /api/library/skills', { err })
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 })
  }
}
