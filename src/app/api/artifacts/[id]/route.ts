import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const name = (body.name as string | undefined)?.trim()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const { data: artifact } = await supabaseAdmin
    .from('artifacts')
    .select('organization_id')
    .eq('id', id)
    .single()

  if (!artifact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: membership } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .eq('organization_id', artifact.organization_id)
    .single()

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('artifacts')
    .update({ name })
    .eq('id', id)
    .select()
    .single()

  if (error) return apiError(error)
  return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Get artifact to check ownership
  const { data: artifact } = await supabaseAdmin
    .from('artifacts')
    .select('organization_id, user_id')
    .eq('id', id)
    .single()

  if (!artifact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verify user belongs to the org
  const { data: membership } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .eq('organization_id', artifact.organization_id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('artifacts')
    .delete()
    .eq('id', id)

  if (error) return apiError(error)

  return NextResponse.json({ success: true })
}
