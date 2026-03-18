import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { patchOrgSettingsInputSchema } from '@/lib/validators/capabilities'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/capabilities/org-settings')

// GET /api/capabilities/org-settings
// Returns org-level capability settings. Requires owner or admin role.
export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
}

// PATCH /api/capabilities/org-settings
// Upserts org-level capability settings. Requires owner or admin role.
export async function PATCH(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
}
