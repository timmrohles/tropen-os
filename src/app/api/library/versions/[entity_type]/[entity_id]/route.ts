// GET /api/library/versions/[entity_type]/[entity_id]
// Superadmin only — full version history for any entity
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { withSuperadmin } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const GET = withSuperadmin<{ entity_type: string; entity_id: string }>(async (_req, { params }) => {
  const { entity_type, entity_id } = params
  const allowed = ['capability','outcome','role','skill']
  if (!allowed.includes(entity_type)) return NextResponse.json({ error: 'Invalid entity_type' }, { status: 400 })

  const { data } = await supabaseAdmin.from('library_versions')
    .select('id, change_type, change_reason, snapshot, created_at, changed_by')
    .eq('entity_type', entity_type).eq('entity_id', entity_id)
    .order('created_at', { ascending: false }).limit(50)

  return NextResponse.json({ versions: data ?? [] })
})
