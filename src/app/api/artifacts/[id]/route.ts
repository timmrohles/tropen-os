import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import { withAuth } from '@/lib/auth/route-guards'

export const PATCH = withAuth<{ id: string }>(async (req: NextRequest, { params, auth }) => {
  try {
    const { id } = params
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
      .eq('id', auth.id)
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
  } catch (err) {
    return apiError(err)
  }
})

export const DELETE = withAuth<{ id: string }>(async (_req: NextRequest, { params, auth }) => {
  const { id } = params

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
    .eq('id', auth.id)
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
})
