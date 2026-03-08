import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'superadmin') return null
  return user
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireSuperadmin()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: orgId } = await params
  const { email, role } = await req.json()

  if (!email || !role) {
    return NextResponse.json({ error: 'email und role erforderlich' }, { status: 400 })
  }

  // Auth-User per Email suchen
  const { data: authList, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })

  const authUser = authList.users.find((u) => u.email === email)
  if (!authUser) {
    return NextResponse.json({ error: `Kein Auth-User mit Email ${email} gefunden. Erst in Supabase Dashboard anlegen.` }, { status: 404 })
  }

  // Ersten Workspace der Org laden
  const { data: ws } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  // public.users anlegen / aktualisieren
  const { error: userErr } = await supabaseAdmin.from('users').upsert(
    { id: authUser.id, email, organization_id: orgId, role, full_name: email.split('@')[0] },
    { onConflict: 'id' }
  )
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

  // user_preferences – Onboarding abgeschlossen
  await supabaseAdmin.from('user_preferences').upsert(
    {
      user_id: authUser.id,
      onboarding_completed: true,
      ai_act_acknowledged: true,
      ai_act_acknowledged_at: new Date().toISOString(),
      chat_style: 'structured',
      model_preference: 'auto',
    },
    { onConflict: 'user_id' }
  )

  // workspace_members – falls Workspace vorhanden
  if (ws) {
    await supabaseAdmin.from('workspace_members').upsert(
      { workspace_id: ws.id, user_id: authUser.id, role },
      { onConflict: 'workspace_id,user_id' }
    )
  }

  return NextResponse.json({ success: true, user_id: authUser.id })
}
