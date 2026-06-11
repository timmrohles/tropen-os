import { apiError } from '@/lib/api-error'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { patchGuidedSettingsSchema } from '@/lib/validators/guided'
import { createLogger } from '@/lib/logger'
import { apiValidationError } from '@/lib/api-error'

const log = createLogger('api/guided/settings')

// PATCH /api/guided/settings
// Upserts guided workflow preferences for the current user.
// Allows toggling guided_enabled, auto_trigger, new_project_trigger.
export const PATCH = withAuth(async (req, { auth }) => {
  try {
    const body = await req.json().catch(() => null)
    const parsed = patchGuidedSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return apiValidationError(parsed.error)
    }
  
    const { data, error } = await supabaseAdmin
      .from('guided_workflow_settings')
      .upsert({ user_id: auth.id, ...parsed.data }, { onConflict: 'user_id' })
      .select()
      .single()
  
    if (error) {
      log.error('upsert guided settings failed', { error })
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err)
  }
})
