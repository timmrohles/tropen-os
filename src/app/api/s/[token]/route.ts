import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'

export const runtime = 'nodejs'

// GET /api/s/[token] — Geteilte Konversation laden (scope=org → Login erforderlich)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Token validieren
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, title, created_at, user_id')
    .eq('share_token', token)
    .is('deleted_at', null)
    .single()

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Auth + gleiche Org prüfen (getAuthUser gibt null wenn kein Org-Profil)
  const viewer = await getAuthUser()
  if (!viewer) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  // Owner-Org ermitteln und mit Viewer-Org vergleichen
  const { data: ownerProfile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', conv.user_id)
    .single()

  if (!ownerProfile || viewer.organization_id !== ownerProfile.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Messages laden
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conv.id)
    .order('created_at')

  return NextResponse.json({
    conversation: { id: conv.id, title: conv.title, created_at: conv.created_at },
    messages: messages ?? [],
  })
}
