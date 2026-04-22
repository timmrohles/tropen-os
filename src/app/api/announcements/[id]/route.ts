export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'

type AccessResult =
  | { ann: { created_by: string; organization_id: string }; allowed: true }
  | { ann: null; allowed: false; status: 401 | 403 | 404 | 500; message: string }

async function checkAccess(id: string): Promise<AccessResult> {
  const user = await getAuthUser()
  if (!user) {
    return { ann: null, allowed: false, status: 401, message: 'Unauthorized' }
  }

  const { data: ann, error: annError } = await supabaseAdmin
    .from('announcements')
    .select('created_by, organization_id')
    .eq('id', id)
    .maybeSingle()

  if (annError) {
    return { ann: null, allowed: false, status: 500, message: 'Ein Fehler ist aufgetreten' }
  }

  if (!ann) {
    return { ann: null, allowed: false, status: 404, message: 'Not found' }
  }

  const role = user.role ?? null
  const isOwner = ann.created_by === user.id
  const isSuperadmin = role === 'superadmin'
  const isOrgAdmin =
    ['org_admin', 'owner'].includes(role ?? '') &&
    ann.organization_id === user.organization_id

  if (!isOwner && !isSuperadmin && !isOrgAdmin) {
    return { ann: null, allowed: false, status: 403, message: 'Forbidden' }
  }

  return { ann, allowed: true }
}

// PATCH — toggle is_active or update fields
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const access = await checkAccess(id)
  if (!access.allowed) {
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: access.status })
  }

  let body: { is_active?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 }) }
  const { is_active } = body

  if (typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 })
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('announcements')
    .update({ is_active })
    .eq('id', id)
    .select()
    .single()

  if (updateError) return apiError(updateError)
  return NextResponse.json(updated)
}

// DELETE — remove announcement
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const access = await checkAccess(id)
  if (!access.allowed) {
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: access.status })
  }

  const { error: deleteError } = await supabaseAdmin
    .from('announcements')
    .delete()
    .eq('id', id)

  if (deleteError) return apiError(deleteError)
  return new NextResponse(null, { status: 204 })
}
