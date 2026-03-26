export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/roles/[id]/unpublish')

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { data: role } = await supabaseAdmin.from('roles')
    .select('id, scope, user_id, organization_id').eq('id', id).is('deleted_at', null).single()
  if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const r = role as { scope: string; user_id: string | null; organization_id: string | null }
  const revertScope = r.user_id === me.id ? 'user' : 'org'
  const canUnpublish = me.role === 'superadmin' || r.user_id === me.id
    || (['owner','admin'].includes(me.role) && r.organization_id === me.organization_id)
  if (!canUnpublish) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabaseAdmin.from('roles')
    .update({ scope: revertScope, is_public: false, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) { log.error('unpublish role', { error }); return NextResponse.json({ error: 'Unpublish failed' }, { status: 500 }) }

  const { error: vErr } = await supabaseAdmin.from('library_versions').insert({
    entity_type: 'role', entity_id: id, organization_id: me.organization_id,
    changed_by: me.id, change_type: 'unpublish', snapshot: { id },
  })
  if (vErr) log.warn('library_versions insert failed on unpublish', { vErr })

  return NextResponse.json({ ok: true })
}
