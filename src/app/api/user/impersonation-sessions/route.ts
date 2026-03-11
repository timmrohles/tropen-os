import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET: Current user's impersonation session history + support_access_enabled
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: sessions }, { data: prefs }] = await Promise.all([
    supabaseAdmin
      .from('impersonation_sessions')
      .select('id, ticket_ref, duration_minutes, started_at, ended_at')
      .eq('target_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('user_preferences')
      .select('support_access_enabled')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  return NextResponse.json({
    sessions: sessions ?? [],
    supportAccessEnabled: prefs?.support_access_enabled ?? true,
  })
}

// PATCH: Toggle support_access_enabled
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { supportAccessEnabled } = await req.json()
  await supabaseAdmin
    .from('user_preferences')
    .update({ support_access_enabled: supportAccessEnabled })
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
