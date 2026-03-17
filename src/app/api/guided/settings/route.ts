import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { patchGuidedSettingsSchema } from '@/lib/validators/guided'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/guided/settings')

// PATCH /api/guided/settings
// Upserts guided workflow preferences for the current user.
// Allows toggling guided_enabled, auto_trigger, new_project_trigger.
export async function PATCH(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = patchGuidedSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('guided_workflow_settings')
    .upsert({ user_id: me.id, ...parsed.data }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    log.error('upsert guided settings failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(data)
}
