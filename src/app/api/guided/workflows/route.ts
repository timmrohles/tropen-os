import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createWorkflowSchema } from '@/lib/validators/guided'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/guided/workflows')

// GET /api/guided/workflows
// Returns all active workflows visible to the user:
// system-scope + org-scope (for user's org) + user-scope (own workflows).
export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workflows, error } = await supabaseAdmin
    .from('guided_workflows')
    .select(`
      id, scope, title, subtitle, trigger_keywords, trigger_contexts,
      package_id, is_active, sort_order,
      guided_workflow_options (
        id, label, description, emoji, capability_id, outcome_id,
        next_workflow_id, system_prompt, sort_order, is_custom
      )
    `)
    .or(
      `scope.eq.system,and(scope.eq.org,organization_id.eq.${me.organization_id}),and(scope.eq.user,user_id.eq.${me.id})`
    )
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    log.error('workflows query failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(workflows ?? [])
}

// POST /api/guided/workflows
// Creates a new user-scoped workflow.
export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createWorkflowSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('guided_workflows')
    .insert({
      ...parsed.data,
      scope:   'user',
      user_id: me.id,
    })
    .select()
    .single()

  if (error) {
    log.error('create workflow failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
