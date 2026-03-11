import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'superadmin') return null
  return user
}

// End impersonation session
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperadmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await supabaseAdmin
    .from('impersonation_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', id)
    .eq('superadmin_id', admin.id)

  return NextResponse.json({ ok: true })
}

// Fetch session info (used by ImpersonationBanner on first load)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('impersonation_sessions')
    .select('id, target_email, ticket_ref, duration_minutes, started_at, ended_at')
    .eq('id', id)
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
}
