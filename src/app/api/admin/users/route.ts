import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

async function getAdminUser() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
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

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, is_active, created_at')
    .eq('organization_id', me.organization_id)
    .order('created_at')

  return NextResponse.json(users ?? [])
}

export async function POST(request: Request) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const { email, role } = await request.json()
  if (!email || !role)
    return NextResponse.json({ error: 'Email und Rolle erforderlich' }, { status: 400 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { organization_id: me.organization_id, role },
    redirectTo: `${siteUrl}/auth/callback`
  })

  if (error) {
    console.error('Invite Error:', error)
    return NextResponse.json({ error: 'Einladung fehlgeschlagen' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
