// POST /api/library/roles/[id]/adopt — copy as org or user scope
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { adoptSchema } from '@/lib/validators/library'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/roles/[id]/adopt')

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const validated = await validateBody(req, adoptSchema)
  if (validated.error) return validated.error

  const { scope, label } = validated.data
  if (scope === 'org' && !['superadmin','owner','admin'].includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: source } = await supabaseAdmin.from('roles')
    .select('*').eq('id', id).is('deleted_at', null).single()
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const s = source as Record<string, unknown>
  const { data: copy, error } = await supabaseAdmin.from('roles').insert({
    name:                      s.name,
    label:                     label ?? s.label,
    icon:                      s.icon,
    description:               s.description,
    scope,
    organization_id:           scope === 'org' ? me.organization_id : null,
    user_id:                   scope === 'user' ? me.id : null,
    system_prompt:             s.system_prompt,
    domain_keywords:           s.domain_keywords ?? [],
    vocabulary:                s.vocabulary ?? [],
    preferred_capability_types:s.preferred_capability_types ?? [],
    preferred_skill_names:     s.preferred_skill_names ?? [],
    preferred_outcome_types:   s.preferred_outcome_types ?? [],
    recommended_model_class:   s.recommended_model_class ?? 'deep',
    source_id:                 id,
    created_by_role:           ['superadmin','owner','admin'].includes(me.role) ? 'org_admin' : 'member',
    is_active:                 true,
  }).select('id').single()

  if (error) { log.error('adopt role', { error }); return NextResponse.json({ error: 'Adopt failed' }, { status: 500 }) }
  return NextResponse.json({ id: copy.id }, { status: 201 })
}
