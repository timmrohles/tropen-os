import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { ROLE_PRESET_WIDGETS, WIDGET_CATALOG } from '@/lib/cockpit/widgetCatalog'
import { withAuth } from '@/lib/auth/route-guards'

const log = createLogger('api:cockpit:setup')

export const POST = withAuth(async (req, { auth }) => {
  let body: { role?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
  }

  const role = body.role ?? 'custom'
  const widgetTypes = ROLE_PRESET_WIDGETS[role] ?? []

  try {
    const orgId = auth.organization_id

    // Clear existing widgets for this user
    await supabaseAdmin
      .from('cockpit_widgets')
      .delete()
      .eq('user_id', auth.id)

    // Insert preset widgets
    let widgets: unknown[] = []
    if (widgetTypes.length > 0) {
      const rows = widgetTypes.map((type, idx) => {
        const meta = WIDGET_CATALOG.find(w => w.type === type)
        return {
          user_id: auth.id,
          organization_id: orgId,
          widget_type: type,
          position: idx,
          size: meta?.size ?? 'medium',
        }
      })

      const { data, error } = await supabaseAdmin
        .from('cockpit_widgets')
        .insert(rows)
        .select('id, widget_type, position, size, config, is_visible')

      if (error) throw error
      widgets = data ?? []
    }

    // Mark setup as done
    await supabaseAdmin
      .from('user_preferences')
      .upsert(
        { user_id: auth.id, cockpit_setup_done: true },
        { onConflict: 'user_id' }
      )

    return NextResponse.json({ widgets })
  } catch (err) {
    log.error('setup error', { error: String(err) })
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
})
