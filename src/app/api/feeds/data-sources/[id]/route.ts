// src/app/api/feeds/data-sources/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/auth/route-guards'
import { validateBody } from '@/lib/validators'
import { updateDataSourceSchema } from '@/lib/validators/feeds'
import { createLogger } from '@/lib/logger'
import { isSafeUrl } from '@/lib/feeds/ssrf-guard'
import { apiError } from '@/lib/api-error'

const log = createLogger('api:feeds:data-sources:[id]')

export const PATCH = withAuth<{ id: string }>(async (req, { auth, params }) => {
  const { id } = params
  const { data: body, error: validationError } = await validateBody(req, updateDataSourceSchema)
  if (validationError) return validationError

  if (body.url !== undefined) {
    const { safe, reason } = await isSafeUrl(body.url)
    if (!safe) {
      log.warn('SSRF blocked on data source update', { url: body.url, reason })
      return NextResponse.json({ error: `URL nicht erlaubt: ${reason}` }, { status: 422 })
    }
  }

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
    .eq('user_id', auth.id)
    .select()
    .single()

  if (error) {
    log.error('update data source failed', { id, error: error.message })
    return apiError(error)
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(data)
})

export const DELETE = withAuth<{ id: string }>(async (_req, { auth, params }) => {
  const { id } = params

  const { error } = await supabaseAdmin
    .from('feed_data_sources')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.id)

  if (error) {
    log.error('delete data source failed', { id, error: error.message })
    return apiError(error)
  }

  return NextResponse.json({ ok: true })
})
