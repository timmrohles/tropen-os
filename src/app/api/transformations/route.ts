import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { createTransformationSchema } from '@/lib/validators/transformations'
import { apiError } from '@/lib/api-error'
import { withAuth } from '@/lib/auth/route-guards'

// GET /api/transformations?source_type=project&source_id=...
export const GET = withAuth(async (request, { auth }) => {
  const { searchParams } = new URL(request.url)
  const source_type = searchParams.get('source_type')
  const source_id   = searchParams.get('source_id')

  if (!source_type || !source_id) {
    return NextResponse.json({ error: 'source_type und source_id erforderlich' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('transformations')
    .select('*')
    .eq('source_type', source_type)
    .eq('source_id', source_id)
    .eq('created_by', auth.id)
    .order('created_at', { ascending: false })

  if (error) return apiError(error)
  return NextResponse.json({ data: data ?? [] })
})

// POST /api/transformations — create pending transformation (preview)
export const POST = withAuth(async (request, { auth }) => {
  const { data: body, error: valErr } = await validateBody(request, createTransformationSchema)
  if (valErr) return valErr

  const { data, error } = await supabaseAdmin
    .from('transformations')
    .insert({
      source_type: body.source_type,
      source_id:   body.source_id,
      target_type: body.target_type,
      status:      'pending',
      meta:        body.suggested_meta ?? {},
      created_by:  auth.id,
    })
    .select()
    .single()

  if (error) return apiError(error)
  return NextResponse.json(data, { status: 201 })
})
