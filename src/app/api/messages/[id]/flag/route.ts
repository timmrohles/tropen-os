// POST /api/messages/[id]/flag
// Art. 14 EU AI Act: Nutzer markiert KI-Antwort als falsch/unpassend (Human Override)

import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-error'
import { withAuth } from '@/lib/auth/route-guards'

export const POST = withAuth<{ id: string }>(async (request, { params, auth }) => {
  const { id } = params

  const body = await request.json().catch(() => ({}))
  const reason: string = typeof body.reason === 'string' ? body.reason.slice(0, 500) : ''

  // Sicherstellen dass die Nachricht zur Conversation des Users gehört (IDOR-Schutz)
  const { data: msg } = await supabaseAdmin
    .from('messages')
    .select('id, conversation_id, conversations!inner(user_id)')
    .eq('id', id)
    .single()

  if (!msg) return NextResponse.json({ error: 'Nachricht nicht gefunden' }, { status: 404 })

  const conv = msg.conversations as unknown as { user_id: string }
  if (conv.user_id !== auth.id) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('messages')
    .update({
      flagged: true,
      flag_reason: reason || null,
      flagged_at: new Date().toISOString(),
      flagged_by: auth.id,
    })
    .eq('id', id)

  if (error) return apiError(error)

  return NextResponse.json({ ok: true })
})
