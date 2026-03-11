import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getAdminUser() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: me } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!me || !['owner', 'admin', 'superadmin'].includes(me.role)) return null
  return me as { organization_id: string; role: string }
}

// GET /api/admin/budget — alle Orgs + Workspaces mit Budget-Limits
export async function GET() {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const [orgs, workspaces] = await Promise.all([
    supabaseAdmin
      .from('organizations')
      .select('id, name, slug, plan, budget_limit')
      .order('name'),
    supabaseAdmin
      .from('workspaces')
      .select('id, name, budget_limit, organizations(name)')
      .order('name')
  ])

  if (orgs.error) {
    console.error('DB Error:', orgs.error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
  if (workspaces.error) {
    console.error('DB Error:', workspaces.error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }

  return NextResponse.json({ organizations: orgs.data, workspaces: workspaces.data })
}

// PATCH /api/admin/budget — Budget-Limit setzen
// Body: { type: 'organization' | 'workspace', id: string, budget_limit: number | null }
export async function PATCH(req: NextRequest) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const { type, id, budget_limit } = await req.json()

  if (!type || !id || !['organization', 'workspace'].includes(type)) {
    return NextResponse.json(
      { error: 'type muss "organization" oder "workspace" sein' },
      { status: 400 }
    )
  }

  const table = type === 'organization' ? 'organizations' : 'workspaces'

  const { data, error } = await supabaseAdmin
    .from(table)
    .update({ budget_limit: budget_limit ?? null })
    .eq('id', id)
    .select('id, name, budget_limit')
    .single()

  if (error) {
    console.error('DB Error:', error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
  return NextResponse.json(data)
}
