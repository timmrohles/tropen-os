// POST /api/beta/onboarding-complete — auth required
// Sets user_preferences.beta_onboarding_done = true
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { error } = await supabaseAdmin
    .from('user_preferences')
    .upsert(
      { user_id: user.id, beta_onboarding_done: true },
      { onConflict: 'user_id' },
    )

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
