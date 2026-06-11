import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import { withSuperadmin } from '@/lib/auth/route-guards'

export const POST = withSuperadmin(async (req, { auth }) => {
  try {
    const { targetUserId, targetEmail, targetOrgId, ticketRef, durationMinutes } = await req.json()
    if (!targetUserId || !targetOrgId) {
      return NextResponse.json({ error: 'targetUserId und targetOrgId erforderlich' }, { status: 400 })
    }

    const dur = durationMinutes ?? 30
    const expiresAt = new Date(Date.now() + dur * 60 * 1000).toISOString()

    const { data: session, error } = await supabaseAdmin
      .from('impersonation_sessions')
      .insert({
        superadmin_id: auth.id,
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
  } catch (err) {
    return apiError(err)
  }
})
