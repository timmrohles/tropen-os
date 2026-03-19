export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'

// PATCH — toggle is_active or update fields
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.role ?? null

  // Check ownership
  const { data: ann } = await supabaseAdmin
    .from('announcements')
    .select('created_by, organization_id')
    .eq('id', id)
    .maybeSingle()

  if (!ann) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = ann.created_by === user.id
  const isSuperadmin = role === 'superadmin'
  const isOrgAdmin = ['org_admin', 'owner'].includes(role ?? '')

  if (!isOwner && !isSuperadmin && !isOrgAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { is_active } = body

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('announcements')
    .update({ is_active })
    .eq('id', id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json(updated)
}

// DELETE — remove announcement
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.role ?? null

  const { data: ann } = await supabaseAdmin
    .from('announcements')
    .select('created_by')
    .eq('id', id)
    .maybeSingle()

  if (!ann) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = ann.created_by === user.id
  const isSuperadmin = role === 'superadmin'
  const isOrgAdmin = ['org_admin', 'owner'].includes(role ?? '')

  if (!isOwner && !isSuperadmin && !isOrgAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error: deleteError } = await supabaseAdmin
    .from('announcements')
    .delete()
    .eq('id', id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
