import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'

export const runtime = 'nodejs'

// POST /api/conversations/[id]/share → Token generieren (idempotent)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Ownership prüfen
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, user_id, share_token')
    .eq('id', id)
    .eq('user_id', user.id)
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ share_token: token })
}

// DELETE /api/conversations/[id]/share → Share widerrufen
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabaseAdmin
    .from('conversations')
    .update({ share_token: null, shared_at: null, share_scope: null })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
