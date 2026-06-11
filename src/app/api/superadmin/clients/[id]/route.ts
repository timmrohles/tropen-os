import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import { withSuperadmin } from '@/lib/auth/route-guards'

export const PATCH = withSuperadmin<{ id: string }>(async (req: NextRequest, { params }) => {
  try {
    const { id } = params
    const body = await req.json()
    const { org_name, plan, org_budget_limit, workspace_name, workspace_budget_limit, owner_email } = body
  
    // Update organization
    const { error: orgError } = await supabaseAdmin
      .from('organizations')
      .update({
        name: org_name,
        plan,
        budget_limit: org_budget_limit ?? null,
      })
      .eq('id', id)
  
    if (orgError) {
      return apiError(orgError)
    }
  
    // Update first workspace
    if (workspace_name !== undefined) {
      const { data: ws } = await supabaseAdmin
        .from('departments')
        .select('id')
        .eq('organization_id', id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
  
      if (ws) {
        await supabaseAdmin
          .from('departments')
          .update({
            name: workspace_name,
            budget_limit: workspace_budget_limit ?? null,
          })
          .eq('id', ws.id)
      }
    }
  
    // Update owner email
    if (owner_email) {
      const { data: ownerRow } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('organization_id', id)
        .eq('role', 'owner')
        .maybeSingle()
  
      if (ownerRow) {
        await supabaseAdmin.auth.admin.updateUserById(ownerRow.id, { email: owner_email })
        await supabaseAdmin.from('users').update({ email: owner_email }).eq('id', ownerRow.id)
      }
    }
  
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err)
  }
})

export const DELETE = withSuperadmin<{ id: string }>(async (_req: NextRequest, { params }) => {
  const { id } = params

  // Superadmin-Org ist unlöschbar
  const { data: superadminUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('organization_id', id)
    .eq('role', 'superadmin')
    .maybeSingle()

  if (superadminUser) {
    return NextResponse.json({ error: 'Diese Organisation kann nicht gelöscht werden.' }, { status: 403 })
  }

  // Delete in order: settings → workspaces → users → org
  await supabaseAdmin.from('organization_settings').delete().eq('organization_id', id)
  await supabaseAdmin.from('departments').delete().eq('organization_id', id)
  await supabaseAdmin.from('users').delete().eq('organization_id', id)

  const { error } = await supabaseAdmin.from('organizations').delete().eq('id', id)
  if (error) return apiError(error)

  return NextResponse.json({ success: true })
})
