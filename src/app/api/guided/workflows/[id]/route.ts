import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { patchWorkflowSchema } from '@/lib/validators/guided'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/guided/workflows/[id]')

// PATCH /api/guided/workflows/[id]
// Updates a user-scoped or org-scoped workflow.
// User can edit their own workflows; org admins/owners can edit org-scoped ones.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = patchWorkflowSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: wf } = await supabaseAdmin
    .from('guided_workflows')
    .select('scope, user_id, organization_id')
    .eq('id', id)
    .single()

  if (!wf) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const canEdit =
    (wf.scope === 'user' && wf.user_id === me.id) ||
    (wf.scope === 'org' &&
      wf.organization_id === me.organization_id &&
      ['owner', 'admin'].includes(me.role))

  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('guided_workflows')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    log.error('update workflow failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(data)
}
