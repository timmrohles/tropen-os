import { createLogger } from '@/lib/logger'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { validateBody } from '@/lib/validators'
import { createProjectSchema } from '@/lib/validators/projects'
import { apiError } from '@/lib/api-error'
const log = createLogger('projects')

async function verifyDeptOrg(departmentId: string, organizationId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('departments')
    .select('id')
    .eq('id', departmentId)
    .eq('organization_id', organizationId)
    .single()
  return !!data
}

// GET /api/projects?department_id=...&limit=50&offset=0
export async function GET(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const department_id = searchParams.get('department_id')
  if (!department_id) return NextResponse.json({ error: 'department_id fehlt' }, { status: 400 })

  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  if (me.role !== 'superadmin') {
    const allowed = await verifyDeptOrg(department_id, me.organization_id)
    if (!allowed) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const { data, error, count } = await supabaseAdmin
    .from('projects')
    .select('id, department_id, title, goal, instructions, emoji, context, meta, created_by, created_at, updated_at, project_memory(count)', { count: 'exact' })
    .eq('department_id', department_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return apiError(error)
  return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
}

// POST /api/projects
export async function POST(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { data: body, error: validationError } = await validateBody(request, createProjectSchema)
  if (validationError) return validationError

  if (me.role !== 'superadmin') {
    const allowed = await verifyDeptOrg(body.department_id, me.organization_id)
    if (!allowed) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .insert({
      department_id: body.department_id,
      title: body.title.trim(),
      goal: body.goal?.trim() ?? null,
      instructions: body.instructions?.trim() ?? null,
      created_by: me.id,
    })
    .select()
    .single()

  if (error) return apiError(error)

  // Auto-add creator as admin participant
  const { error: participantErr } = await supabaseAdmin.from('project_participants').insert({
    project_id: project.id,
    user_id: me.id,
    role: 'admin',
  })
  if (participantErr) {
    log.error('[projects] participant insert error:', participantErr.message)
  }

  return NextResponse.json(project)
}
