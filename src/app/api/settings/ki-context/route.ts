import { apiError } from '@/lib/api-error'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/auth/route-guards'

export const GET = withAuth(async (_req: NextRequest, { auth }) => {
  const { data } = await supabaseAdmin
    .from('user_preferences')
    .select('ki_context, ki_role, communication_style')
    .eq('user_id', auth.id)
    .maybeSingle()

  return NextResponse.json(data ?? {})
})

export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json() as Record<string, string>

    await supabaseAdmin
      .from('user_preferences')
      .upsert({
        user_id: auth.id,
        ...(body.ki_context !== undefined && { ki_context: body.ki_context }),
        ...(body.ki_role !== undefined && { ki_role: body.ki_role }),
        ...(body.communication_style !== undefined && { communication_style: body.communication_style }),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
})
