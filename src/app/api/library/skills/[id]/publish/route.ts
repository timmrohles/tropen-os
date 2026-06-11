export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/skills/[id]/publish')

export const POST = withAuth<{ id: string }>(async (_req, { params, auth: me }) => {
  const { id } = params

  const { data: skill } = await supabaseAdmin.from('skills')
    .select('id, scope, user_id, organization_id').eq('id', id).is('deleted_at', null).single()
  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const r = skill as { scope: string; user_id: string | null; organization_id: string | null }
  const canPublish = me.role === 'superadmin'
    || (r.user_id === me.id)
    || (['owner','admin'].includes(me.role) && r.organization_id === me.organization_id)
  if (!canPublish) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabaseAdmin.from('skills')
    .update({ scope: 'public', is_public: true, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) { log.error('publish skill', { error }); return NextResponse.json({ error: 'Publish failed' }, { status: 500 }) }

  const { error: vErr } = await supabaseAdmin.from('library_versions').insert({
    entity_type: 'skill', entity_id: id, organization_id: me.organization_id,
    changed_by: me.id, change_type: 'publish', snapshot: { id },
  })
  if (vErr) log.warn('library_versions insert failed on publish', { vErr })

  return NextResponse.json({ ok: true })
})
