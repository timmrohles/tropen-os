import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function guardSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabaseAdmin
    .from('users').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'superadmin') return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

export async function GET(_req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params
  const { user, error } = await guardSuperadmin()
  if (!user) return error!

  const { data, error: dbErr } = await supabaseAdmin
    .from('org_packages')
    .select('id, package_id, is_active, activated_at')
    .eq('organization_id', orgId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params
  const { user, error } = await guardSuperadmin()
  if (!user) return error!

  const { package_id, is_active } = await req.json()

  const { data, error: dbErr } = await supabaseAdmin
    .from('org_packages')
    .upsert({
      organization_id: orgId,
      package_id,
      is_active,
      activated_by: user.id,
      activated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,package_id' })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data)
}
