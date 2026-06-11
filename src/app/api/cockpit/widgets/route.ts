import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { VALID_WIDGET_TYPES, WIDGET_CATALOG } from '@/lib/cockpit/widgetCatalog'
import { withAuth } from '@/lib/auth/route-guards'

const log = createLogger('api:cockpit:widgets')

export const GET = withAuth(async (_req, { auth }) => {
  try {
    const [widgetsRes, profileRes, prefsRes] = await Promise.all([
      supabaseAdmin
        .from('cockpit_widgets')
        .select('id, widget_type, position, size, config, is_visible')
        .eq('user_id', auth.id)
        .eq('is_visible', true)
        .order('position', { ascending: true }),

      supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', auth.id)
        .maybeSingle(),

      supabaseAdmin
        .from('user_preferences')
        .select('cockpit_setup_done')
        .eq('user_id', auth.id)
        .maybeSingle(),
    ])

    const role = profileRes.data?.role ?? ''
    const isAdmin = ['admin', 'owner', 'superadmin'].includes(role)
    const setupDone = prefsRes.data?.cockpit_setup_done ?? false

    return NextResponse.json({
      widgets: widgetsRes.data ?? [],
      setupDone,
      isAdmin,
    })
  } catch (err) {
    log.error('GET widgets error', { error: String(err) })
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
})

export const POST = withAuth(async (req, { auth }) => {
  let body: { widget_type?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
  }

  const { widget_type } = body
  if (!widget_type || !VALID_WIDGET_TYPES.has(widget_type)) {
    return NextResponse.json({ error: 'Ungültiger widget_type' }, { status: 400 })
  }

  try {
    const profileRes = await supabaseAdmin
      .from('users')
      .select('organization_id, role')
      .eq('id', auth.id)
      .maybeSingle()

    const orgId = profileRes.data?.organization_id
    const role = profileRes.data?.role ?? ''
    const isAdmin = ['admin', 'owner', 'superadmin'].includes(role)

    const meta = WIDGET_CATALOG.find(w => w.type === widget_type)
    if (meta?.adminOnly && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Next position
    const { data: existing } = await supabaseAdmin
      .from('cockpit_widgets')
      .select('position')
      .eq('user_id', auth.id)
      .order('position', { ascending: false })
      .limit(1)

    const nextPos = (existing?.[0]?.position ?? -1) + 1
    const size = meta?.size ?? 'medium'

    const { data, error } = await supabaseAdmin
      .from('cockpit_widgets')
      .insert({
        user_id: auth.id,
        organization_id: orgId,
        widget_type,
        position: nextPos,
        size,
      })
      .select('id, widget_type, position, size, config, is_visible')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Widget bereits vorhanden' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ widget: data })
  } catch (err) {
    log.error('POST widget error', { error: String(err) })
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
})
