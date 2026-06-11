// GET /api/library/user-settings — user library preferences
// PATCH /api/library/user-settings — update pin/last_used
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { userSettingsUpdateSchema } from '@/lib/validators/library'

export const GET = withAuth(async (_req, { auth: me }) => {
  const { data } = await supabaseAdmin.from('user_library_settings')
    .select('*').eq('user_id', me.id)
  return NextResponse.json({ settings: data ?? [] })
})

export const PATCH = withAuth(async (req, { auth: me }) => {
  const validated = await validateBody(req, userSettingsUpdateSchema)
  if (validated.error) return validated.error

  const { entity_type, entity_id, ...updates } = validated.data
  await supabaseAdmin.from('user_library_settings').upsert({
    user_id: me.id, entity_type, entity_id, ...updates,
    last_used_at: new Date().toISOString(),
  }, { onConflict: 'user_id,entity_type,entity_id' })

  return NextResponse.json({ ok: true })
})
