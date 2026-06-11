import { apiError } from '@/lib/api-error'
import { createLogger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withOrgAdmin } from '@/lib/auth/route-guards'
const log = createLogger('admin/models/id')

// PATCH /api/admin/models/[id] — Modell aktualisieren (Preise, is_active)
export const PATCH = withOrgAdmin<{ id: string }>(async (req: NextRequest, { params }) => {
  try {
    const { id } = params
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
      log.error('DB Error:', error)
      return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err)
  }
})

// DELETE /api/admin/models/[id]
export const DELETE = withOrgAdmin<{ id: string }>(async (_req: NextRequest, { params }) => {
  const { id } = params

  const { error } = await supabaseAdmin.from('model_catalog').delete().eq('id', id)

  if (error) {
    log.error('DB Error:', error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
})
