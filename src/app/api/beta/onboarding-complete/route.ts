import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  await supabaseAdmin
    .from('user_preferences')
    .upsert(
      { user_id: user.id, beta_onboarding_done: true },
      { onConflict: 'user_id' }
    )

  return NextResponse.json({ ok: true })
}
