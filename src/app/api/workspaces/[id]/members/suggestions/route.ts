// GET /api/workspaces/[id]/members/suggestions?q=...
// Returns active org users for the member invite picker.
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withWorkspaceAccess } from '@/lib/auth/route-guards'

export const GET = withWorkspaceAccess<{ id: string }>(async (req, { auth: me }) => {
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  const like = q ? `%${q}%` : '%'

  const { data } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email')
    .eq('organization_id', me.organization_id)
    .eq('is_active', true)
    .neq('id', me.id)
    .or(`full_name.ilike.${like},email.ilike.${like}`)
    .order('full_name', { ascending: true })
    .limit(20)

  return NextResponse.json(data ?? [])
}, { write: true })
