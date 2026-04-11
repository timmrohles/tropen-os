import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

// POST /api/conversations/reply — neue Konversation als Antwort auf geteilten Chat
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { shared_from_id: string; title?: string }
  if (!body.shared_from_id) {
    return NextResponse.json({ error: 'shared_from_id fehlt' }, { status: 400 })
  }

  // shared_from_id muss existieren und geteilt sein
  const { data: source } = await supabaseAdmin
    .from('conversations')
    .select('id, user_id, share_token')
    .eq('id', body.shared_from_id)
    .not('share_token', 'is', null)
    .single()

  if (!source) return NextResponse.json({ error: 'Geteilter Chat nicht gefunden' }, { status: 404 })

  // Gleiche Org prüfen
  const { data: ownerProfile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', source.user_id)
    .single()

  if (!ownerProfile || user.organization_id !== ownerProfile.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Replying user's department ermitteln
  const { data: membership } = await supabaseAdmin
    .from('department_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  // Neue Konversation in der eigenen Department des Replyers anlegen
  const { data: newConv, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      workspace_id: membership?.workspace_id ?? null,
      user_id: user.id,
      title: body.title ?? 'Antwort auf geteilten Chat',
      conversation_type: 'chat',
      shared_from_id: source.id,
    })
    .select('id')
    .single()

  if (error) return apiError(error)

  return NextResponse.json(newConv)
}
