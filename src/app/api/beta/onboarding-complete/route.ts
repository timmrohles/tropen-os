import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withAuth } from '@/lib/auth/route-guards'

const log = createLogger('api:beta:onboarding-complete')

export const POST = withAuth(async (_req, { auth }) => {
  const { error } = await supabaseAdmin
    .from('user_preferences')
    .upsert(
      { user_id: auth.id, beta_onboarding_done: true },
      { onConflict: 'user_id' }
    )

  if (error) {
    log.error('beta onboarding upsert failed', { userId: auth.id, error: error.message })
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
})
