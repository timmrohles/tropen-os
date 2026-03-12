import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id, role: profile.role } as {
    id: string; organization_id: string; role: string
  }
}

async function verifyDeptOrg(departmentId: string, organizationId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('departments')
    .select('id')
    .eq('id', departmentId)
    .eq('organization_id', organizationId)
    .single()
  return !!data
}

// GET /api/projects?department_id=...
export async function GET(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const department_id = searchParams.get('department_id')
  if (!department_id) return NextResponse.json({ error: 'department_id fehlt' }, { status: 400 })

  if (me.role !== 'superadmin') {
    const allowed = await verifyDeptOrg(department_id, me.organization_id)
    if (!allowed) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('id, department_id, title, goal, instructions, meta, created_by, created_at, updated_at')
    .eq('department_id', department_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/projects
export async function POST(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 }) }

  const { department_id, title, goal, instructions } = body as {
    department_id?: string; title?: string; goal?: string; instructions?: string
  }
  if (!department_id || !title?.trim())
    return NextResponse.json({ error: 'department_id und title erforderlich' }, { status: 400 })

  if (me.role !== 'superadmin') {
    const allowed = await verifyDeptOrg(department_id, me.organization_id)
    if (!allowed) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .insert({
      department_id,
      title: (title as string).trim(),
      goal: goal?.trim() ?? null,
      instructions: instructions?.trim() ?? null,
      created_by: me.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-add creator as admin participant
  await supabaseAdmin.from('project_participants').insert({
    project_id: project.id,
    user_id: me.id,
    role: 'admin',
  })

  return NextResponse.json(project)
}
