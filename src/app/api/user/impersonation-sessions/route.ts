import { apiError } from '@/lib/api-error'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/auth/route-guards'

// GET: Current user's impersonation session history + support_access_enabled
export const GET = withAuth(async (_req, { auth }) => {
  const [{ data: sessions }, { data: prefs }] = await Promise.all([
    supabaseAdmin
      .from('impersonation_sessions')
      .select('id, ticket_ref, duration_minutes, started_at, ended_at')
      .eq('target_user_id', auth.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('user_preferences')
      .select('support_access_enabled')
      .eq('user_id', auth.id)
      .maybeSingle(),
  ])

  return NextResponse.json({
    sessions: sessions ?? [],
    supportAccessEnabled: prefs?.support_access_enabled ?? true,
  })
})

// PATCH: Toggle support_access_enabled
export const PATCH = withAuth(async (req, { auth }) => {
  try {
    const { supportAccessEnabled } = await req.json()
    await supabaseAdmin
      .from('user_preferences')
      .update({ support_access_enabled: supportAccessEnabled })
      .eq('user_id', auth.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
})
