// src/app/api/feeds/data-sources/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { updateDataSourceSchema } from '@/lib/validators/feeds'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:feeds:data-sources:[id]')

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabaseAdmin
    .from('users').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id as string }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: body, error: validationError } = await validateBody(req, updateDataSourceSchema)
  if (validationError) return validationError

  // Build update payload (only defined fields)
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name           !== undefined) update.name            = body.name
  if (body.description    !== undefined) update.description     = body.description
  if (body.url            !== undefined) update.url             = body.url
  if (body.method         !== undefined) update.method          = body.method
  if (body.auth_type      !== undefined) update.auth_type       = body.auth_type
  if (body.auth_config    !== undefined) update.auth_config     = body.auth_config
  if (body.request_headers !== undefined) update.request_headers = body.request_headers
  if (body.request_body   !== undefined) update.request_body    = body.request_body
  if (body.fetch_interval !== undefined) update.fetch_interval  = body.fetch_interval
  if (body.schema_path    !== undefined) update.schema_path     = body.schema_path
  if (body.is_active      !== undefined) update.is_active       = body.is_active

  const { data, error } = await supabaseAdmin
    .from('feed_data_sources')
    .update(update)
    .eq('id', id)
    .eq('user_id', me.id)
    .select()
    .single()

  if (error) {
    log.error('update data source failed', { id, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { error } = await supabaseAdmin
    .from('feed_data_sources')
    .delete()
    .eq('id', id)
    .eq('user_id', me.id)

  if (error) {
    log.error('delete data source failed', { id, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
