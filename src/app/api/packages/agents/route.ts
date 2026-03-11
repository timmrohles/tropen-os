import { NextResponse } from 'next/server'
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

  if (!profile?.organization_id) return NextResponse.json([])

  const { data: orgPkgs } = await supabaseAdmin
    .from('org_packages')
    .select('package_id')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)

  if (!orgPkgs?.length) return NextResponse.json([])

  const packageIds = orgPkgs.map(p => p.package_id)

  const { data, error } = await supabaseAdmin
    .from('package_agents')
    .select('id, name, description, system_prompt, quick_chips, display_order, package_id, packages(slug, name, icon)')
    .in('package_id', packageIds)
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
