// src/app/api/feeds/data-sources/[id]/fetch/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/auth/route-guards'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:feeds:data-sources:fetch')
const FETCH_TIMEOUT_MS = 15_000

/** Simple dot-notation JSONPath resolver: "$.data.items" → obj.data.items */
function applyJsonPath(data: unknown, path: string): unknown {
  if (!path || path === '$') return data
  const clean = path.replace(/^\$\.?/, '')
  if (!clean) return data
  const parts = clean.split('.')
  let current: unknown = data
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return null
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function buildAuthHeaders(
  authType: string | null,
  authConfig: Record<string, string>
): Record<string, string> {
  if (authType === 'bearer' && authConfig.token) {
    return { 'Authorization': `Bearer ${authConfig.token}` }
  }
  if (authType === 'api_key' && authConfig.header && authConfig.key) {
    return { [authConfig.header]: authConfig.key }
  }
  if (authType === 'basic' && authConfig.username && authConfig.password) {
    const encoded = Buffer.from(`${authConfig.username}:${authConfig.password}`).toString('base64')
    return { 'Authorization': `Basic ${encoded}` }
  }
  return {}
}

function countRecords(data: unknown): number | null {
  if (Array.isArray(data)) return data.length
  if (data !== null && typeof data === 'object') return 1
  return null
}

function extractSchemaPreview(rawData: unknown): unknown {
  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) return rawData
  if (Array.isArray(rawData) && rawData.length > 0) return rawData[0]
  return null
}

type FetchResult = {
  rawData: unknown
  httpStatus: number | null
  fetchError: string | null
  recordCount: number | null
}

async function fetchDataSource(src: Record<string, unknown>, headers: Record<string, string>): Promise<FetchResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(src.url as string, {
      method: src.method as string,
      headers,
      body: src.method === 'POST' && src.request_body ? src.request_body as string : undefined,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return {
        rawData: null,
        httpStatus: response.status,
        fetchError: `HTTP ${response.status} ${response.statusText}`,
        recordCount: null,
      }
    }

    const json = await response.json()
    const rawData = src.schema_path ? applyJsonPath(json, src.schema_path as string) : json
    return {
      rawData,
      httpStatus: response.status,
      fetchError: null,
      recordCount: countRecords(rawData),
    }
  } catch (err: unknown) {
    clearTimeout(timeout)
    const msg = err instanceof Error ? err.message : String(err)
    const fetchError = msg.includes('aborted') ? 'Timeout nach 15 Sekunden' : 'Abruf fehlgeschlagen'
    return { rawData: null, httpStatus: null, fetchError, recordCount: null }
  }
}

export const POST = withAuth<{ id: string }>(async (_req, { auth, params }) => {
  const { id } = params

  const { data: source, error: sourceError } = await supabaseAdmin
    .from('feed_data_sources')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.id)
    .single()

  if (sourceError || !source) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const src = source as Record<string, unknown>
  const authType = src.auth_type as string | null
  const authConfig = (src.auth_config ?? {}) as Record<string, string>
  const requestHeaders = (src.request_headers ?? {}) as Record<string, string>

  // Build headers — never log authConfig values
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...requestHeaders,
    ...buildAuthHeaders(authType, authConfig),
  }

  const startMs = Date.now()
  const { rawData, httpStatus, fetchError, recordCount } = await fetchDataSource(src, headers)
  const durationMs = Date.now() - startMs

  if (fetchError) {
    log.warn('data source fetch error', { id, error: fetchError })
  }

  // Insert record (APPEND ONLY — always insert, even on error)
  await supabaseAdmin.from('feed_data_records').insert({
    source_id: id,
    user_id: auth.id,
    organization_id: auth.organization_id,
    data: rawData ?? {},
    record_count: recordCount,
    fetch_duration_ms: durationMs,
    http_status: httpStatus,
    error: fetchError,
  })

  await supabaseAdmin.from('feed_data_sources').update({
    last_fetched_at: new Date().toISOString(),
    last_error: fetchError,
    record_count: recordCount ?? 0,
    schema_preview: extractSchemaPreview(rawData),
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (fetchError) {
    return NextResponse.json({ error: 'Abruf fehlgeschlagen', httpStatus, durationMs })
  }

  const preview = Array.isArray(rawData) ? rawData.slice(0, 3) : (rawData ? [rawData] : [])
  return NextResponse.json({ recordCount, fetchedAt: new Date().toISOString(), preview, durationMs })
})
