import { apiError } from '@/lib/api-error'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/auth/route-guards'

export const GET = withAuth(async (_req: NextRequest, { auth }) => {
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', auth.id)
    .maybeSingle()

  if (!profile?.organization_id) return NextResponse.json({ policies: [], connections: [] })

  const [{ data: policies }, { data: connections }] = await Promise.all([
    supabaseAdmin
      .from('org_mcp_policies')
      .select('mcp_id, mcp_name, mcp_icon, status')
      .eq('organization_id', profile.organization_id)
      .order('mcp_name'),
    supabaseAdmin
      .from('user_mcp_connections')
      .select('mcp_id, status, connected_at, requested_at')
      .eq('user_id', auth.id),
  ])

  return NextResponse.json({ policies: policies ?? [], connections: connections ?? [] })
})

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { mcp_id, action } = await req.json() as { mcp_id: string; action: 'connect' | 'disconnect' | 'request' }

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', auth.id)
      .maybeSingle()

    if (!profile?.organization_id) return NextResponse.json({ error: 'Keine Organisation' }, { status: 400 })

    if (action === 'connect') {
      await supabaseAdmin
        .from('user_mcp_connections')
        .upsert({
          user_id: auth.id,
          organization_id: profile.organization_id,
          mcp_id,
          status: 'connected',
          connected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,mcp_id' })
    } else if (action === 'disconnect') {
      await supabaseAdmin
        .from('user_mcp_connections')
        .upsert({
          user_id: auth.id,
          organization_id: profile.organization_id,
          mcp_id,
          status: 'disconnected',
          connected_at: null,
        }, { onConflict: 'user_id,mcp_id' })
    } else if (action === 'request') {
      await supabaseAdmin
        .from('user_mcp_connections')
        .upsert({
          user_id: auth.id,
          organization_id: profile.organization_id,
          mcp_id,
          status: 'pending_approval',
          requested_at: new Date().toISOString(),
        }, { onConflict: 'user_id,mcp_id' })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
})
