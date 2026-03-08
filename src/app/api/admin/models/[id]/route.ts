import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getAdminUser() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: me } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!me || !['owner', 'admin'].includes(me.role)) return null
  return me as { organization_id: string; role: string }
}

// PATCH /api/admin/models/[id] — Modell aktualisieren (Preise, is_active)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const allowed = ['is_active', 'cost_per_1k_input', 'cost_per_1k_output', 'description']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Keine gültigen Felder' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('model_catalog')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('DB Error:', error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
  return NextResponse.json(data)
}

// DELETE /api/admin/models/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const { id } = await params

  const { error } = await supabaseAdmin.from('model_catalog').delete().eq('id', id)

  if (error) {
    console.error('DB Error:', error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}
