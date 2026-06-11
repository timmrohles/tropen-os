import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import { withSuperadmin } from '@/lib/auth/route-guards'

export const GET = withSuperadmin<{ orgId: string }>(async (_req, { params }) => {
  const { orgId } = params

  const { data, error: dbErr } = await supabaseAdmin
    .from('org_packages')
    .select('id, package_id, is_active, activated_at')
    .eq('organization_id', orgId)

  if (dbErr) return apiError(dbErr)
  return NextResponse.json(data ?? [])
})

export const POST = withSuperadmin<{ orgId: string }>(async (req, { auth, params }) => {
  try {
    const { orgId } = params

    const { package_id, is_active } = await req.json()

    const { data, error: dbErr } = await supabaseAdmin
      .from('org_packages')
      .upsert({
        organization_id: orgId,
        package_id,
        is_active,
        activated_by: auth.id,
        activated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id,package_id' })
      .select()
      .single()

    if (dbErr) return apiError(dbErr)
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err)
  }
})
