import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { patchSettingsInputSchema } from '@/lib/validators/capabilities'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/capabilities/settings')

// PATCH /api/capabilities/settings
// Upserts per-user capability settings (model preference, outcome preference, pin state).
export async function PATCH(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const validated = await validateBody(req, patchSettingsInputSchema)
  if (validated.error) return validated.error

  const { capability_id, ...rest } = validated.data

  const { data, error } = await supabaseAdmin
    .from('user_capability_settings')
    .upsert(
      { user_id: me.id, capability_id, ...rest },
      { onConflict: 'user_id,capability_id' }
    )
    .select()
    .single()

  if (error) {
    log.error('upsert user_capability_settings failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(data)
}
