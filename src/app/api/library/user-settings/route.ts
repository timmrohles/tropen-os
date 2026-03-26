// GET /api/library/user-settings — user library preferences
// PATCH /api/library/user-settings — update pin/last_used
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { userSettingsUpdateSchema } from '@/lib/validators/library'

export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabaseAdmin.from('user_library_settings')
    .select('*').eq('user_id', me.id)
  return NextResponse.json({ settings: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const validated = await validateBody(req, userSettingsUpdateSchema)
  if (validated.error) return validated.error

  const { entity_type, entity_id, ...updates } = validated.data
  await supabaseAdmin.from('user_library_settings').upsert({
    user_id: me.id, entity_type, entity_id, ...updates,
    last_used_at: new Date().toISOString(),
  }, { onConflict: 'user_id,entity_type,entity_id' })

  return NextResponse.json({ ok: true })
}
