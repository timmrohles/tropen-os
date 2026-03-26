// GET /api/library/versions/[entity_type]/[entity_id]
// Superadmin only — full version history for any entity
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'

type Params = { params: Promise<{ entity_type: string; entity_id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (me.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { entity_type, entity_id } = await params
  const allowed = ['capability','outcome','role','skill']
  if (!allowed.includes(entity_type)) return NextResponse.json({ error: 'Invalid entity_type' }, { status: 400 })

  const { data } = await supabaseAdmin.from('library_versions')
    .select('id, change_type, change_reason, snapshot, created_at, changed_by')
    .eq('entity_type', entity_type).eq('entity_id', entity_id)
    .order('created_at', { ascending: false }).limit(50)

  return NextResponse.json({ versions: data ?? [] })
}
