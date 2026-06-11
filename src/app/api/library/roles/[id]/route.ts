export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { updateRoleSchema } from '@/lib/validators/library'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/roles/[id]')

async function checkOwnership(roleId: string, userId: string, orgId: string, userRole: string) {
  const { data, error } = await supabaseAdmin.from('roles')
    .select('id, scope, user_id, organization_id').eq('id', roleId).is('deleted_at', null).single()
  if (error || !data) return null
  const r = data as { id: string; scope: string; user_id: string | null; organization_id: string | null }
  const isSuperadmin = userRole === 'superadmin'
  const isOrgAdmin = ['owner','admin'].includes(userRole) && r.organization_id === orgId
  const isOwner = r.user_id === userId
  if (isSuperadmin || isOrgAdmin || isOwner) return r
  return null
}

export const GET = withAuth<{ id: string }>(async (_req, { params }) => {
  const { id } = params
  const { data } = await supabaseAdmin.from('roles').select('*').eq('id', id).is('deleted_at', null).single()
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ role: data })
})

export const PATCH = withAuth<{ id: string }>(async (req, { params, auth: me }) => {
  const { id } = params

  const role = await checkOwnership(id, me.id, me.organization_id, me.role)
  if (!role) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })

  const validated = await validateBody(req, updateRoleSchema)
  if (validated.error) return validated.error

  const snapshot = { ...role }
  const { error } = await supabaseAdmin.from('roles')
    .update({ ...validated.data, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) { log.error('update role', { error }); return NextResponse.json({ error: 'Update failed' }, { status: 500 }) }

  const { error: vErr } = await supabaseAdmin.from('library_versions').insert({
    entity_type: 'role', entity_id: id,
    organization_id: me.organization_id, changed_by: me.id,
    change_type: 'update', snapshot,
  })
  if (vErr) log.warn('library_versions insert failed on update', { vErr })

  return NextResponse.json({ ok: true })
})

export const DELETE = withAuth<{ id: string }>(async (_req, { params, auth: me }) => {
  const { id } = params

  const role = await checkOwnership(id, me.id, me.organization_id, me.role)
  if (!role) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })

  const { error } = await supabaseAdmin.from('roles')
    .update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', id)
  if (error) { log.error('delete role', { error }); return NextResponse.json({ error: 'Delete failed' }, { status: 500 }) }

  const { error: vErr } = await supabaseAdmin.from('library_versions').insert({
    entity_type: 'role', entity_id: id,
    organization_id: me.organization_id, changed_by: me.id,
    change_type: 'deactivate', snapshot: { id, scope: role.scope },
  })
  if (vErr) log.warn('library_versions insert failed on delete', { vErr })

  return NextResponse.json({ ok: true })
})
