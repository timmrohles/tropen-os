export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { updateSkillSchema } from '@/lib/validators/library'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/skills/[id]')
type Params = { params: Promise<{ id: string }> }

async function checkOwnership(skillId: string, userId: string, orgId: string, userRole: string) {
  const { data, error } = await supabaseAdmin.from('skills')
    .select('id, scope, user_id, organization_id').eq('id', skillId).is('deleted_at', null).single()
  if (error || !data) return null
  const r = data as { id: string; scope: string; user_id: string | null; organization_id: string | null }
  const isSuperadmin = userRole === 'superadmin'
  const isOrgAdmin = ['owner','admin'].includes(userRole) && r.organization_id === orgId
  const isOwner = r.user_id === userId
  if (isSuperadmin || isOrgAdmin || isOwner) return r
  return null
}

export async function GET(_req: Request, { params }: Params) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { data } = await supabaseAdmin.from('skills').select('*').eq('id', id).is('deleted_at', null).single()
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ skill: data })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const skill = await checkOwnership(id, me.id, me.organization_id, me.role)
  if (!skill) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })

  const validated = await validateBody(req, updateSkillSchema)
  if (validated.error) return validated.error

  const snapshot = { ...skill }
  const { error } = await supabaseAdmin.from('skills')
    .update({ ...validated.data, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) { log.error('update skill', { error }); return NextResponse.json({ error: 'Update failed' }, { status: 500 }) }

  const { error: vErr } = await supabaseAdmin.from('library_versions').insert({
    entity_type: 'skill', entity_id: id,
    organization_id: me.organization_id, changed_by: me.id,
    change_type: 'update', snapshot,
  })
  if (vErr) log.warn('library_versions insert failed on update', { vErr })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const skill = await checkOwnership(id, me.id, me.organization_id, me.role)
  if (!skill) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })

  const { error } = await supabaseAdmin.from('skills')
    .update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', id)
  if (error) { log.error('delete skill', { error }); return NextResponse.json({ error: 'Delete failed' }, { status: 500 }) }

  const { error: vErr } = await supabaseAdmin.from('library_versions').insert({
    entity_type: 'skill', entity_id: id,
    organization_id: me.organization_id, changed_by: me.id,
    change_type: 'deactivate', snapshot: { id, scope: skill.scope },
  })
  if (vErr) log.warn('library_versions insert failed on delete', { vErr })

  return NextResponse.json({ ok: true })
}
