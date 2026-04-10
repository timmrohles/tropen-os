// PATCH /api/scan-projects/[id] — rename a scan_project
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:scan-projects')

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

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
    .eq('organization_id', profile.organization_id) // tenant isolation

  if (error) {
    log.error('Failed to rename scan project', { id, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  log.info('Scan project renamed', { id, name })
  return NextResponse.json({ id, name })
}
