// POST /api/messages/[id]/flag
// Art. 14 EU AI Act: Nutzer markiert KI-Antwort als falsch/unpassend (Human Override)

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-error'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

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
  if (conv.user_id !== user.id) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('messages')
    .update({
      flagged: true,
      flag_reason: reason || null,
      flagged_at: new Date().toISOString(),
      flagged_by: user.id,
    })
    .eq('id', id)

  if (error) return apiError(error)

  return NextResponse.json({ ok: true })
}
