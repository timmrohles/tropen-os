import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'

export const runtime = 'nodejs'

// POST /api/conversations/[id]/set-intention
// Body: { intention: 'focused' | 'guided', projectId?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { intention?: string; projectId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { intention, projectId } = body
  if (intention !== 'focused' && intention !== 'guided') {
    return NextResponse.json({ error: 'intention must be "focused" or "guided"' }, { status: 400 })
  }

  // Ownership check
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const update: Record<string, unknown> = { intention }
  if (intention === 'focused' && projectId) {
    update.current_project_id = projectId
  } else if (intention === 'guided') {
    update.current_project_id = null
  }

  const { error } = await supabaseAdmin
    .from('conversations')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
