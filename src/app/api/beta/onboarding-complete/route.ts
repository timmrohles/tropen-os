import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:beta:onboarding-complete')

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from('user_preferences')
    .upsert(
      { user_id: user.id, beta_onboarding_done: true },
      { onConflict: 'user_id' }
    )

  if (error) {
    log.error('beta onboarding upsert failed', { userId: user.id, error: error.message })
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
