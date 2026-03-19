// GET /api/library/org-settings — org library configuration
// PATCH /api/library/org-settings — update single entity setting
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { orgSettingsUpdateSchema } from '@/lib/validators/library'

export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin.from('org_library_settings')
    .select('*').eq('organization_id', me.organization_id)

  return NextResponse.json({ settings: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['superadmin','owner','admin'].includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const validated = await validateBody(req, orgSettingsUpdateSchema)
  if (validated.error) return validated.error

  const { entity_type, entity_id, ...updates } = validated.data
  await supabaseAdmin.from('org_library_settings').upsert({
    organization_id: me.organization_id, entity_type, entity_id,
    ...updates, updated_by: me.id, updated_at: new Date().toISOString(),
  }, { onConflict: 'organization_id,entity_type,entity_id' })

  return NextResponse.json({ ok: true })
}
