// GET /api/workspaces/[id]/members/suggestions?q=...
// Returns active org users for the member invite picker.
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser, canWriteWorkspace } from '@/lib/api/workspaces'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  const like = q ? `%${q}%` : '%'

  const { data } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email')
    .eq('organization_id', me.organization_id)
    .eq('is_active', true)
    .neq('id', me.id)
    .or(`full_name.ilike.${like},email.ilike.${like}`)
    .order('full_name', { ascending: true })
    .limit(20)

  return NextResponse.json(data ?? [])
}
