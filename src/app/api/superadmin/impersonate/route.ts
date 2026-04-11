import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'superadmin') return null
  return user
}

export async function POST(req: NextRequest) {
  const admin = await requireSuperadmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { targetUserId, targetEmail, targetOrgId, ticketRef, durationMinutes } = await req.json()
  if (!targetUserId || !targetOrgId) {
    return NextResponse.json({ error: 'targetUserId und targetOrgId erforderlich' }, { status: 400 })
  }

  const dur = durationMinutes ?? 30
  const expiresAt = new Date(Date.now() + dur * 60 * 1000).toISOString()

  const { data: session, error } = await supabaseAdmin
    .from('impersonation_sessions')
    .insert({
      superadmin_id: admin.id,
      target_user_id: targetUserId,
      target_email: targetEmail,
      target_org_id: targetOrgId,
      ticket_ref: ticketRef || null,
      duration_minutes: dur,
    })
    .select('id')
    .single()

  if (error) return apiError(error)

  return NextResponse.json({ sessionId: session.id, targetEmail, ticketRef, expiresAt, durationMinutes: dur })
}
