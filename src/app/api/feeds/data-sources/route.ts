// src/app/api/feeds/data-sources/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { createDataSourceSchema } from '@/lib/validators/feeds'
import { createLogger } from '@/lib/logger'
import { isSafeUrl } from '@/lib/feeds/ssrf-guard'
import { parsePaginationParams } from '@/lib/api/pagination'
import type { FeedDataSource } from '@/types/feeds'
import { apiError } from '@/lib/api-error'

const log = createLogger('api:feeds:data-sources')

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabaseAdmin
    .from('users').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id as string }
}

function mapSource(r: Record<string, unknown>): FeedDataSource {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    organizationId: r.organization_id as string,
    name: r.name as string,
    description: (r.description as string) ?? null,
    url: r.url as string,
    method: (r.method as 'GET' | 'POST') ?? 'GET',
    authType: (r.auth_type as FeedDataSource['authType']) ?? null,
    authConfig: (r.auth_config as Record<string, string>) ?? {},
    requestHeaders: (r.request_headers as Record<string, string>) ?? {},
    requestBody: (r.request_body as string) ?? null,
    fetchInterval: (r.fetch_interval as number) ?? 3600,
    schemaPath: (r.schema_path as string) ?? null,
    schemaPreview: (r.schema_preview as Record<string, unknown>) ?? null,
    isActive: (r.is_active as boolean) ?? true,
    lastFetchedAt: (r.last_fetched_at as string) ?? null,
    lastError: (r.last_error as string) ?? null,
    recordCount: (r.record_count as number) ?? 0,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }
}

export async function GET(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const { limit, offset } = parsePaginationParams(searchParams)

  const { data, error, count } = await supabaseAdmin
    .from('feed_data_sources')
    .select('*', { count: 'exact' })
    .eq('user_id', me.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    log.error('list data sources failed', { error: error.message })
    return apiError(error)
  }

  return NextResponse.json({
    data: (data ?? []).map((r) => mapSource(r as Record<string, unknown>)),
    total: count ?? 0,
    limit,
    offset,
  })
}

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: body, error: validationError } = await validateBody(req, createDataSourceSchema)
  if (validationError) return validationError

  const { safe, reason } = await isSafeUrl(body.url)
  if (!safe) {
    log.warn('SSRF blocked on data source create', { url: body.url, reason })
    return NextResponse.json({ error: `URL nicht erlaubt: ${reason}` }, { status: 422 })
  }

  const { data, error } = await supabaseAdmin
    .from('feed_data_sources')
    .insert({
      user_id: me.id,
      organization_id: me.organization_id,
      name: body.name,
      description: body.description ?? null,
      url: body.url,
      method: body.method,
      auth_type: body.auth_type ?? null,
      auth_config: body.auth_config,
      request_headers: body.request_headers,
      request_body: body.request_body ?? null,
      fetch_interval: body.fetch_interval,
      schema_path: body.schema_path ?? null,
    })
    .select()
    .single()

  if (error) {
    log.error('create data source failed', { error: error.message })
    return apiError(error)
  }

  return NextResponse.json(mapSource(data as Record<string, unknown>), { status: 201 })
}
