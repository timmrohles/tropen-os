import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/auth/route-guards'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

// POST /api/conversations/[id]/share → Token generieren (idempotent)
export const POST = withAuth<{ id: string }>(async (_req, { auth, params }) => {
  const { id } = params

  // Ownership prüfen
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, user_id, share_token')
    .eq('id', id)
    .eq('user_id', auth.id)
    .is('deleted_at', null)
    .single()

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Idempotent: schon geteilt → bestehenden Token zurückgeben
  if (conv.share_token) {
    return NextResponse.json({ share_token: conv.share_token })
  }

  const token = crypto.randomUUID().replace(/-/g, '')

  const { error } = await supabaseAdmin
    .from('conversations')
    .update({
      share_token: token,
      shared_at: new Date().toISOString(),
      share_scope: 'org',
    })
    .eq('id', id)
    .eq('user_id', auth.id)

  if (error) return apiError(error)

  return NextResponse.json({ share_token: token })
})

// DELETE /api/conversations/[id]/share → Share widerrufen
export const DELETE = withAuth<{ id: string }>(async (_req, { auth, params }) => {
  const { id } = params

  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', auth.id)
    .is('deleted_at', null)
    .single()

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error: revokeError } = await supabaseAdmin
    .from('conversations')
    .update({ share_token: null, shared_at: null, share_scope: null })
    .eq('id', id)
    .eq('user_id', auth.id)

  if (revokeError) return apiError(revokeError)

  return NextResponse.json({ ok: true })
})
