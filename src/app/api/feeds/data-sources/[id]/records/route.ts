// src/app/api/feeds/data-sources/[id]/records/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/auth/route-guards'
import { createLogger } from '@/lib/logger'
import type { FeedDataRecord } from '@/types/feeds'
import { apiError } from '@/lib/api-error'

const log = createLogger('api:feeds:data-sources:records')

function mapRecord(r: Record<string, unknown>): FeedDataRecord {
  return {
    id: r.id as string,
    sourceId: r.source_id as string,
    userId: r.user_id as string,
    organizationId: r.organization_id as string,
    fetchedAt: r.fetched_at as string,
    data: r.data,
    recordCount: (r.record_count as number) ?? null,
    fetchDurationMs: (r.fetch_duration_ms as number) ?? null,
    httpStatus: (r.http_status as number) ?? null,
    error: (r.error as string) ?? null,
    linkedProjectId: (r.linked_project_id as string) ?? null,
    linkedWorkspaceId: (r.linked_workspace_id as string) ?? null,
  }
}

export const GET = withAuth<{ id: string }>(async (req, { auth, params }) => {
  const { id } = params
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)

  // Verify source ownership before returning records
  const { data: source } = await supabaseAdmin
    .from('feed_data_sources')
    .select('id')
    .eq('id', id)
    .eq('user_id', auth.id)
    .single()

  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('feed_data_records')
    .select('*')
    .eq('source_id', id)
    .order('fetched_at', { ascending: false })
    .limit(limit)

  if (error) {
    log.error('list records failed', { id, error: error.message })
    return apiError(error)
  }

  return NextResponse.json((data ?? []).map((r) => mapRecord(r as Record<string, unknown>)))
})
