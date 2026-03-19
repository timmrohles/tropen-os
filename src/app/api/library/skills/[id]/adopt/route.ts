// POST /api/library/skills/[id]/adopt — copy as org or user scope
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { adoptSkillSchema } from '@/lib/validators/library'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/skills/[id]/adopt')

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const validated = await validateBody(req, adoptSkillSchema)
  if (validated.error) return validated.error

  const { scope, title } = validated.data
  if (scope === 'org' && !['superadmin','owner','admin'].includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: source } = await supabaseAdmin.from('skills')
    .select('*').eq('id', id).is('deleted_at', null).single()
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const s = source as Record<string, unknown>
  const { data: copy, error } = await supabaseAdmin.from('skills').insert({
    name:                       s.name,
    title:                      title ?? s.title,
    icon:                       s.icon,
    description:                s.description,
    scope,
    organization_id:            scope === 'org' ? me.organization_id : null,
    user_id:                    scope === 'user' ? me.id : null,
    instructions:               s.instructions,
    quality_criteria:           s.quality_criteria,
    output_type:                s.output_type,
    trigger_keywords:           s.trigger_keywords ?? [],
    recommended_role_name:      s.recommended_role_name,
    recommended_capability_type:s.recommended_capability_type,
    source_skill_id:            id,
    created_by_role:            ['superadmin','owner','admin'].includes(me.role) ? 'org_admin' : 'member',
    is_active:                  true,
  }).select('id').single()

  if (error) { log.error('adopt skill', { error }); return NextResponse.json({ error: 'Adopt failed' }, { status: 500 }) }
  return NextResponse.json({ id: copy.id }, { status: 201 })
}
