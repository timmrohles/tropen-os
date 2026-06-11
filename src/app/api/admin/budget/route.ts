import { apiError } from '@/lib/api-error'
import { createLogger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withOrgAdmin } from '@/lib/auth/route-guards'
const log = createLogger('admin/budget')

// GET /api/admin/budget — Orgs + Workspaces mit Budget-Limits.
// Superadmin: alle Orgs. Org-Admin: nur die eigene Org (kein Cross-Org-Leak).
export const GET = withOrgAdmin(async (_req, { auth }) => {
  const isSuperadmin = auth.role === 'superadmin'

  const orgsQuery = supabaseAdmin
    .from('organizations')
    .select('id, name, slug, plan, budget_limit')
    .order('name')
  const wsQuery = supabaseAdmin
    .from('departments')
    .select('id, name, budget_limit, organizations(name)')
    .order('name')

  const [orgs, workspaces] = await Promise.all([
    isSuperadmin ? orgsQuery : orgsQuery.eq('id', auth.organization_id),
    isSuperadmin ? wsQuery : wsQuery.eq('organization_id', auth.organization_id),
  ])

  if (orgs.error) {
    log.error('DB Error:', orgs.error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
  if (workspaces.error) {
    log.error('DB Error:', workspaces.error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }

  return NextResponse.json({ organizations: orgs.data, workspaces: workspaces.data })
})

// PATCH /api/admin/budget — Budget-Limit setzen
// Body: { type: 'organization' | 'workspace', id: string, budget_limit: number | null }
// Org-Admin darf nur die eigene Org / Workspaces der eigenen Org ändern; Superadmin alles.
export const PATCH = withOrgAdmin(async (req: NextRequest, { auth }) => {
  try {
    const { type, id, budget_limit } = await req.json()

    if (!type || !id || !['organization', 'workspace'].includes(type)) {
      return NextResponse.json(
        { error: 'type muss "organization" oder "workspace" sein' },
        { status: 400 }
      )
    }

    const table = type === 'organization' ? 'organizations' : 'workspaces'

    // Org-Scope für Nicht-Superadmins: Ziel muss zur eigenen Org gehören.
    if (auth.role !== 'superadmin') {
      if (type === 'organization') {
        if (id !== auth.organization_id) {
          return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
        }
      } else {
        const { data: ws } = await supabaseAdmin
          .from('workspaces')
          .select('id')
          .eq('id', id)
          .eq('organization_id', auth.organization_id)
          .maybeSingle()
        if (!ws) {
          return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ budget_limit: budget_limit ?? null })
      .eq('id', id)
      .select('id, name, budget_limit')
      .single()

    if (error) {
      log.error('DB Error:', error)
      return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err)
  }
})
