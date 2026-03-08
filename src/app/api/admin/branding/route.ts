import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  if (!me || !['owner', 'admin'].includes(me.role)) return null
  return me as { organization_id: string; role: string }
}

export async function GET() {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const { data } = await supabaseAdmin
    .from('organization_settings')
    .select('logo_url, primary_color, organization_display_name, ai_guide_name, ai_guide_description')
    .eq('organization_id', me.organization_id)
    .maybeSingle()

  return NextResponse.json(data ?? {
    logo_url: null,
    primary_color: '#14b8a6',
    organization_display_name: null,
    ai_guide_name: 'Toro',
    ai_guide_description: 'Dein KI-Guide durch den Informationsdschungel',
  })
}

export async function PATCH(request: Request) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 })
  }

  const allowed = ['logo_url', 'primary_color', 'organization_display_name', 'ai_guide_name', 'ai_guide_description']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { error } = await supabaseAdmin
    .from('organization_settings')
    .upsert(
      { organization_id: me.organization_id, ...update },
      { onConflict: 'organization_id' }
    )

  if (error) {
    console.error('Branding PATCH error:', error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
