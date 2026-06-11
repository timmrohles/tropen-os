import { createLogger } from '@/lib/logger'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { withOrgAdmin } from '@/lib/auth/route-guards'
const log = createLogger('admin/branding')

export const GET = withOrgAdmin(async (_req, { auth: me }) => {
  const { data } = await supabaseAdmin
    .from('organization_settings')
    .select('logo_url, primary_color, organization_display_name, ai_guide_name, ai_guide_description, members_see_models, ai_assistant_image_url')
    .eq('organization_id', me.organization_id)
    .maybeSingle()

  return NextResponse.json(data ?? {
    logo_url: null,
    primary_color: 'var(--accent)',
    organization_display_name: null,
    ai_guide_name: 'Toro',
    ai_guide_description: 'Dein KI-Guide durch den Informationsdschungel',
    ai_assistant_image_url: null,
  })
})

export const PATCH = withOrgAdmin(async (request, { auth: me }) => {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 })
  }

  const allowed = ['logo_url', 'primary_color', 'organization_display_name', 'ai_guide_name', 'ai_guide_description', 'members_see_models', 'ai_assistant_image_url']
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
    log.error('Branding PATCH error:', error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
})
