import { apiError } from '@/lib/api-error'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { patchWorkflowSchema } from '@/lib/validators/guided'
import { createLogger } from '@/lib/logger'
import { apiValidationError } from '@/lib/api-error'

const log = createLogger('api/guided/workflows/[id]')

// PATCH /api/guided/workflows/[id]
// Updates a user-scoped or org-scoped workflow.
// User can edit their own workflows; org admins/owners can edit org-scoped ones.
export const PATCH = withAuth<{ id: string }>(async (req, { auth, params }) => {
  try {
    const { id } = params
    const body = await req.json().catch(() => null)
    const parsed = patchWorkflowSchema.safeParse(body)
    if (!parsed.success) {
      return apiValidationError(parsed.error)
    }
  
    const { data: wf } = await supabaseAdmin
      .from('guided_workflows')
      .select('scope, user_id, organization_id')
      .eq('id', id)
      .single()
  
    if (!wf) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  
    const canEdit =
      (wf.scope === 'user' && wf.user_id === auth.id) ||
      (wf.scope === 'org' &&
        wf.organization_id === auth.organization_id &&
        ['owner', 'admin'].includes(auth.role))
  
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
  } catch (err) {
    return apiError(err)
  }
})
