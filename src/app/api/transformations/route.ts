import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'
import { validateBody } from '@/lib/validators'
import { createTransformationSchema } from '@/lib/validators/transformations'
import { apiError } from '@/lib/api-error'

// GET /api/transformations?source_type=project&source_id=...
export async function GET(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

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
    .eq('created_by', me.id)
    .order('created_at', { ascending: false })

  if (error) return apiError(error)
  return NextResponse.json({ data: data ?? [] })
}

// POST /api/transformations — create pending transformation (preview)
export async function POST(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

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
      created_by:  me.id,
    })
    .select()
    .single()

  if (error) return apiError(error)
  return NextResponse.json(data, { status: 201 })
}
