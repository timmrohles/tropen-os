import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'

const logger = createLogger('api:perspectives:settings')

const patchSchema = z.object({
  avatar_id:  z.string().uuid(),
  is_pinned:  z.boolean().optional(),
  sort_order: z.number().int().optional(),
})

// GET /api/perspectives/settings
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: settings } = await supabaseAdmin
    .from('perspective_user_settings')
    .select('*')
    .eq('user_id', user.id)

  return NextResponse.json({ settings: settings ?? [] })
}

// PATCH /api/perspectives/settings
// Upsert a single avatar's pin/sort setting for the current user
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = patchSchema.safeParse(rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })

  const { avatar_id, is_pinned, sort_order } = parsed.data

  const { error } = await supabaseAdmin
    .from('perspective_user_settings')
    .upsert({ user_id: user.id, avatar_id, is_pinned, sort_order }, { onConflict: 'user_id,avatar_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
