import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import { withAuth } from '@/lib/auth/route-guards'

export const GET = withAuth(async (_req, { auth }) => {
  const { data: orgPkgs } = await supabaseAdmin
    .from('org_packages')
    .select('package_id')
    .eq('organization_id', auth.organization_id)
    .eq('is_active', true)

  if (!orgPkgs?.length) return NextResponse.json([])

  const packageIds = orgPkgs.map(p => p.package_id)

  const { data, error } = await supabaseAdmin
    .from('package_agents')
    .select('id, name, description, system_prompt, quick_chips, display_order, package_id, packages(slug, name, icon)')
    .in('package_id', packageIds)
    .order('display_order', { ascending: true })

  if (error) return apiError(error)
  return NextResponse.json(data ?? [])
})
