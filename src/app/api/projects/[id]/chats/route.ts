import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { getAuthUser, verifyProjectAccess } from '@/lib/api/projects'
import { apiError } from '@/lib/api-error'

// GET /api/projects/[id]/chats
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  const { id } = await params

  const allowed = await verifyProjectAccess(id, me)
  if (!allowed) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .eq('project_id', id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) return apiError(error)
  return NextResponse.json(data ?? [])
}
