import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
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
      .eq('user_id', user.id),
  ])

  return NextResponse.json({ policies: policies ?? [], connections: connections ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { mcp_id, action } = await req.json() as { mcp_id: string; action: 'connect' | 'disconnect' | 'request' }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.organization_id) return NextResponse.json({ error: 'Keine Organisation' }, { status: 400 })

  if (action === 'connect') {
    await supabaseAdmin
      .from('user_mcp_connections')
      .upsert({
        user_id: user.id,
        organization_id: profile.organization_id,
        mcp_id,
        status: 'connected',
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,mcp_id' })
  } else if (action === 'disconnect') {
    await supabaseAdmin
      .from('user_mcp_connections')
      .upsert({
        user_id: user.id,
        organization_id: profile.organization_id,
        mcp_id,
        status: 'disconnected',
        connected_at: null,
      }, { onConflict: 'user_id,mcp_id' })
  } else if (action === 'request') {
    await supabaseAdmin
      .from('user_mcp_connections')
      .upsert({
        user_id: user.id,
        organization_id: profile.organization_id,
        mcp_id,
        status: 'pending_approval',
        requested_at: new Date().toISOString(),
      }, { onConflict: 'user_id,mcp_id' })
  }

  return NextResponse.json({ ok: true })
}
