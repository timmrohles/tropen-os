// PATCH /api/scan-projects/[id] — rename a scan_project
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { withAuth } from '@/lib/auth/route-guards'

const log = createLogger('api:scan-projects')

export const PATCH = withAuth<{ id: string }>(async (request, { params, auth }) => {
  const { id } = params

  let body: { name?: unknown }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const name = typeof body.name === 'string' ? body.name.trim() : null
  if (!name) return NextResponse.json({ error: 'name darf nicht leer sein' }, { status: 400 })
  if (name.length > 200) return NextResponse.json({ error: 'name zu lang' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('scan_projects')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', auth.organization_id) // tenant isolation

  if (error) {
    log.error('Failed to rename scan project', { id, error: error.message })
    return apiError(error)
  }

  log.info('Scan project renamed', { id, name })
  return NextResponse.json({ id, name })
})
