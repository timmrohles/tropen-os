import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/guided/workflows/[id]/copy')

// POST /api/guided/workflows/[id]/copy
// Copies a workflow (any scope) into a new user-scoped workflow.
// Also copies all options, remapping workflow_id to the new copy.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: source } = await supabaseAdmin
    .from('guided_workflows')
    .select('*, guided_workflow_options(*)')
    .eq('id', id)
    .single()

  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const {
    id: _srcId,
    created_at: _ca,
    updated_at: _ua,
    scope: _scope,
    user_id: _uid,
    organization_id: _oid,
    guided_workflow_options: sourceOptions,
    ...rest
  } = source as Record<string, unknown> & { guided_workflow_options: Record<string, unknown>[] }

  const { data: copy, error } = await supabaseAdmin
    .from('guided_workflows')
    .insert({ ...rest, scope: 'user', user_id: me.id, title: `Kopie von ${source.title}` })
    .select()
    .single()

  if (error || !copy) {
    log.error('copy workflow failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  if (sourceOptions?.length) {
    const options = sourceOptions.map(({ id: _oid2, workflow_id: _wid, ...opt }) => ({
      ...opt,
      workflow_id: copy.id,
    }))
    await supabaseAdmin.from('guided_workflow_options').insert(options)
  }

  return NextResponse.json(copy, { status: 201 })
}
