import { NextResponse } from 'next/server'
import { withOrgAdmin } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { patchOrgSettingsInputSchema } from '@/lib/validators/capabilities'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/capabilities/org-settings')

// GET /api/capabilities/org-settings
// Returns org-level capability settings. Requires owner or admin role.
export const GET = withOrgAdmin(async (_req, { auth: me }) => {
  const { data, error } = await supabaseAdmin
    .from('capability_org_settings')
    .select(`
      capability_id, is_enabled, allowed_model_ids,
      default_model_id, user_can_override,
      capabilities(id, label, icon, capability_type)
    `)
    .eq('organization_id', me.organization_id)
    .order('capability_id')

  if (error) {
    log.error('org-settings query failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
})

// PATCH /api/capabilities/org-settings
// Upserts org-level capability settings. Requires owner or admin role.
export const PATCH = withOrgAdmin(async (req, { auth: me }) => {
  const validated = await validateBody(req, patchOrgSettingsInputSchema)
  if (validated.error) return validated.error

  const { capability_id, ...rest } = validated.data

  const { data, error } = await supabaseAdmin
    .from('capability_org_settings')
    .upsert(
      { organization_id: me.organization_id, capability_id, ...rest },
      { onConflict: 'organization_id,capability_id' }
    )
    .select()
    .single()

  if (error) {
    log.error('upsert org settings failed', { error })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(data)
})
