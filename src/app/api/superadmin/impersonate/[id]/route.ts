import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withSuperadmin } from '@/lib/auth/route-guards'

// End impersonation session
export const DELETE = withSuperadmin<{ id: string }>(async (_req, { auth, params }) => {
  const { id } = params
  await supabaseAdmin
    .from('impersonation_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', id)
    .eq('superadmin_id', auth.id)

  return NextResponse.json({ ok: true })
})

// Fetch session info (used by ImpersonationBanner on first load)
export const GET = withSuperadmin<{ id: string }>(async (_req, { auth, params }) => {
  const { id } = params
  const { data, error } = await supabaseAdmin
    .from('impersonation_sessions')
    .select('id, target_email, ticket_ref, duration_minutes, started_at, ended_at')
    .eq('id', id)
    .eq('superadmin_id', auth.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 })
  if (data.ended_at) return NextResponse.json({ error: 'Session beendet' }, { status: 410 })

  const expiresAt = new Date(new Date(data.started_at).getTime() + data.duration_minutes * 60 * 1000).toISOString()
  return NextResponse.json({
    sessionId: data.id,
    targetEmail: data.target_email,
    ticketRef: data.ticket_ref,
    expiresAt,
    durationMinutes: data.duration_minutes,
  })
})
