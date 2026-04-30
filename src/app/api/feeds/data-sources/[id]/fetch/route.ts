// src/app/api/feeds/data-sources/[id]/fetch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:feeds:data-sources:fetch')
const FETCH_TIMEOUT_MS = 15_000

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabaseAdmin
    .from('users').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id as string }
}

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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Load source — user ownership check
  const { data: source, error: sourceError } = await supabaseAdmin
    .from('feed_data_sources')
    .select('*')
    .eq('id', id)
    .eq('user_id', me.id)
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
  }
  if (authType === 'bearer' && authConfig.token) {
    headers['Authorization'] = `Bearer ${authConfig.token}`
  } else if (authType === 'api_key' && authConfig.header && authConfig.key) {
    headers[authConfig.header] = authConfig.key
  } else if (authType === 'basic' && authConfig.username && authConfig.password) {
    headers['Authorization'] = `Basic ${Buffer.from(`${authConfig.username}:${authConfig.password}`).toString('base64')}`
  }

  const startMs = Date.now()
  let httpStatus: number | null = null
  let fetchError: string | null = null
  let rawData: unknown = null
  let recordCount: number | null = null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(src.url as string, {
      method: src.method as string,
      headers,
      body: src.method === 'POST' && src.request_body ? src.request_body as string : undefined,
      signal: controller.signal,
    })
    clearTimeout(timeout)
    httpStatus = response.status

    if (response.ok) {
      const json = await response.json()
      rawData = src.schema_path ? applyJsonPath(json, src.schema_path as string) : json
      if (Array.isArray(rawData)) {
        recordCount = rawData.length
      } else if (rawData !== null && typeof rawData === 'object') {
        recordCount = 1
      }
    } else {
      fetchError = `HTTP ${response.status} ${response.statusText}`
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    fetchError = msg.includes('aborted') ? 'Timeout nach 15 Sekunden' : 'Abruf fehlgeschlagen'
    log.warn('data source fetch error', { id, error: fetchError })
  }

  const durationMs = Date.now() - startMs

  // Insert record (APPEND ONLY — always insert, even on error)
  await supabaseAdmin.from('feed_data_records').insert({
    source_id: id,
    user_id: me.id,
    organization_id: me.organization_id,
    data: rawData ?? {},
    record_count: recordCount,
    fetch_duration_ms: durationMs,
    http_status: httpStatus,
    error: fetchError,
  })

  // Update source status
  const schemaPreview = rawData && typeof rawData === 'object' && !Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData) && rawData.length > 0
      ? rawData[0]
      : null

  await supabaseAdmin.from('feed_data_sources').update({
    last_fetched_at: new Date().toISOString(),
    last_error: fetchError,
    record_count: recordCount ?? 0,
    schema_preview: schemaPreview,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (fetchError) {
    return NextResponse.json({ error: 'Abruf fehlgeschlagen', httpStatus, durationMs })
  }

  const preview = Array.isArray(rawData) ? rawData.slice(0, 3) : (rawData ? [rawData] : [])
  return NextResponse.json({ recordCount, fetchedAt: new Date().toISOString(), preview, durationMs })
}
