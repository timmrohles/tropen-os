import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import { withAuth } from '@/lib/auth/route-guards'

export const PATCH = withAuth<{ id: string }>(async (req, { params, auth }) => {
  try {
    const { id } = params

    const { is_shared } = await req.json()

    const { data, error } = await supabaseAdmin
      .from('prompt_templates')
      .update({ is_shared })
      .eq('id', id)
      .eq('user_id', auth.id)
      .select()
      .single()

    if (error) return apiError(error)
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err)
  }
})

export const DELETE = withAuth<{ id: string }>(async (_req, { params, auth }) => {
  const { id } = params

  const { error } = await supabaseAdmin
    .from('prompt_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.id)

  if (error) return apiError(error)
  return NextResponse.json({ ok: true })
})
