import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { patchSettingsInputSchema } from '@/lib/validators/capabilities'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/capabilities/settings')

// PATCH /api/capabilities/settings
// Upserts per-user capability settings (model preference, outcome preference, pin state).
export const PATCH = withAuth(async (req, { auth: me }) => {
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
})
