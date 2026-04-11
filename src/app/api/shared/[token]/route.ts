import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { apiError } from '@/lib/api-error'

const log = createLogger('api:shared:[token]')
type Params = { params: Promise<{ token: string }> }

// Public endpoint — no auth required; returns workspace + items if share_active
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params

  const { data: workspace, error } = await supabaseAdmin
    .from('workspaces')
    .select('id, title, description, emoji, share_role, share_active, created_at')
    .eq('share_token', token)
    .eq('share_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    log.error('[shared] GET failed', { error: error.message })
    return apiError(error)
  }
  if (!workspace) {
    return NextResponse.json({ error: 'Nicht gefunden oder Freigabe deaktiviert' }, { status: 404 })
  }

  const { data: items } = await supabaseAdmin
    .from('workspace_items')
    .select('id, item_type, item_id, title, description, meta, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  const { data: comments } = await supabaseAdmin
    .from('workspace_comments')
    .select('id, content, item_id, parent_id, user_id, guest_name, created_at')
    .eq('workspace_id', workspace.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return NextResponse.json({ workspace, items: items ?? [], comments: comments ?? [] })
}
