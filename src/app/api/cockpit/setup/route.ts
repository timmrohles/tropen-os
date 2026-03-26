import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { ROLE_PRESET_WIDGETS, WIDGET_CATALOG } from '@/lib/cockpit/widgetCatalog'

const log = createLogger('api:cockpit:setup')

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { role?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
  }

  const role = body.role ?? 'custom'
  const widgetTypes = ROLE_PRESET_WIDGETS[role] ?? []

  try {
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    const orgId = profile?.organization_id

    // Clear existing widgets for this user
    await supabaseAdmin
      .from('cockpit_widgets')
      .delete()
      .eq('user_id', user.id)

    // Insert preset widgets
    let widgets: unknown[] = []
    if (widgetTypes.length > 0) {
      const rows = widgetTypes.map((type, idx) => {
        const meta = WIDGET_CATALOG.find(w => w.type === type)
        return {
          user_id: user.id,
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
        { user_id: user.id, cockpit_setup_done: true },
        { onConflict: 'user_id' }
      )

    return NextResponse.json({ widgets })
  } catch (err) {
    log.error('setup error', { error: String(err) })
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
