import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'
import { apiError } from '@/lib/api-error'
import { withAuth } from '@/lib/auth/route-guards'

const patchSchema = z.object({
  avatar_id:  z.string().uuid(),
  is_pinned:  z.boolean().optional(),
  sort_order: z.number().int().optional(),
})

// GET /api/perspectives/settings
export const GET = withAuth(async (_req, { auth }) => {
  const { data: settings } = await supabaseAdmin
    .from('perspective_user_settings')
    .select('*')
    .eq('user_id', auth.id)

  return NextResponse.json({ settings: settings ?? [] })
})

// PATCH /api/perspectives/settings
// Upsert a single avatar's pin/sort setting for the current user
export const PATCH = withAuth(async (req, { auth }) => {
  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = patchSchema.safeParse(rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })

  const { avatar_id, is_pinned, sort_order } = parsed.data

  const { error } = await supabaseAdmin
    .from('perspective_user_settings')
    .upsert({ user_id: auth.id, avatar_id, is_pinned, sort_order }, { onConflict: 'user_id,avatar_id' })

  if (error) return apiError(error)
  return NextResponse.json({ ok: true })
})
