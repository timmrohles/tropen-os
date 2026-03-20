'use server'
// src/actions/feeds.ts
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'
import {
  createFeedSourceSchema, updateFeedSourceSchema,
  createFeedSchemaSchema,
  createDistributionSchema,
} from '@/lib/validators/feeds'
import { recordNotRelevant } from '@/lib/feeds/feedback'
import { processItem } from '@/lib/feeds/pipeline'
import { fetchRss } from '@/lib/feeds/fetchers/rss'
import { fetchUrl } from '@/lib/feeds/fetchers/url'
import { fetchApi } from '@/lib/feeds/fetchers/api'
import { createLogger } from '@/lib/logger'
import type { FeedSource, FeedItem, FeedDistribution } from '@/types/feeds'

const log = createLogger('actions:feeds')

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapSource(r: Record<string, unknown>): FeedSource {
  return {
    id: r.id as string,
    organizationId: r.organization_id as string,
    userId: (r.user_id as string) ?? null,
    name: r.name as string,
    type: r.type as FeedSource['type'],
    url: (r.url as string) ?? null,
    config: (r.config as Record<string, unknown>) ?? {},
    keywordsInclude: (r.keywords_include as string[]) ?? [],
    keywordsExclude: (r.keywords_exclude as string[]) ?? [],
    domainsAllow: (r.domains_allow as string[]) ?? [],
    minScore: r.min_score as number,
    schemaId: (r.schema_id as string) ?? null,
    status: ((r.status as string) ?? 'active') as FeedSource['status'],
    isActive: r.is_active as boolean,
    pausedAt: (r.paused_at as string) ?? null,
    pausedBy: (r.paused_by as string) ?? null,
    pauseReason: (r.pause_reason as string) ?? null,
    lastFetchedAt: (r.last_fetched_at as string) ?? null,
    errorCount: r.error_count as number,
    lastError: (r.last_error as string) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }
}

function mapItem(r: Record<string, unknown>): FeedItem {
  return {
    id: r.id as string,
    sourceId: r.source_id as string,
    organizationId: r.organization_id as string,
    title: r.title as string,
    content: (r.content as string) ?? null,
    summary: (r.summary as string) ?? null,
    keyFacts: (r.key_facts as string[]) ?? null,
    url: (r.url as string) ?? null,
    author: (r.author as string) ?? null,
    publishedAt: (r.published_at as string) ?? null,
    fetchedAt: r.fetched_at as string,
    stage: r.stage as 1 | 2 | 3,
    score: (r.score as number) ?? null,
    scoreReason: (r.score_reason as string) ?? null,
    status: r.status as FeedItem['status'],
    isSaved: r.is_saved as boolean,
    contentHash: (r.content_hash as string) ?? null,
    expiresAt: (r.expires_at as string) ?? null,
    archivedSummary: (r.archived_summary as string) ?? null,
    dismissedAt: (r.dismissed_at as string) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.created_at as string,
  }
}

function mapDistribution(r: Record<string, unknown>): FeedDistribution {
  return {
    id: r.id as string,
    sourceId: r.source_id as string,
    targetType: r.target_type as FeedDistribution['targetType'],
    targetId: r.target_id as string,
    autoInject: r.auto_inject as boolean,
    minScore: r.min_score as number,
    createdAt: r.created_at as string,
  }
}

// ---------------------------------------------------------------------------
// Feed Sources
// ---------------------------------------------------------------------------

export async function listFeedSources(): Promise<FeedSource[]> {
  const me = await getAuthUser()
  if (!me) return []
  const { data } = await supabaseAdmin
    .from('feed_sources')
    .select('*')
    .eq('organization_id', me.organization_id)
    .order('created_at', { ascending: false })
  return (data ?? []).map((r: Record<string, unknown>) => mapSource(r))
}

export async function createFeedSource(formData: FormData | Record<string, unknown>) {
  const me = await getAuthUser()
  if (!me) return { error: 'Nicht autorisiert' }
  const input = typeof formData === 'object' && !(formData instanceof FormData)
    ? formData : Object.fromEntries((formData as FormData).entries())
  const parsed = createFeedSourceSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.message }
  const b = parsed.data

  const config: Record<string, unknown> = b.config ?? {}
  if (b.type === 'email' && !config.inbound_address) {
    const { randomUUID } = await import('crypto')
    config.inbound_address = `feed-${randomUUID()}@inbound.tropen.os`
    config.provider = 'resend'
  }

  const { data, error } = await supabaseAdmin
    .from('feed_sources')
    .insert({
      organization_id: me.organization_id,
      user_id: me.id,
      name: b.name,
      type: b.type,
      url: b.url ?? null,
      config,
      keywords_include: b.keywordsInclude,
      keywords_exclude: b.keywordsExclude,
      domains_allow: b.domainsAllow,
      min_score: b.minScore,
      schema_id: b.schemaId ?? null,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  return { source: mapSource(data as Record<string, unknown>) }
}

export async function updateFeedSource(id: string, input: Record<string, unknown>) {
  const me = await getAuthUser()
  if (!me) return { error: 'Nicht autorisiert' }
  const parsed = updateFeedSourceSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.message }
  const b = parsed.data
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (b.name !== undefined) updates.name = b.name
  if (b.url !== undefined) updates.url = b.url
  if (b.isActive !== undefined) updates.is_active = b.isActive
  if (b.minScore !== undefined) updates.min_score = b.minScore
  if (b.keywordsInclude !== undefined) updates.keywords_include = b.keywordsInclude
  if (b.keywordsExclude !== undefined) updates.keywords_exclude = b.keywordsExclude
  if (b.domainsAllow !== undefined) updates.domains_allow = b.domainsAllow
  if (b.config !== undefined) updates.config = b.config
  const { data, error } = await supabaseAdmin
    .from('feed_sources')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', me.organization_id)
    .select().single()
  if (error) return { error: error.message }
  return { source: mapSource(data as Record<string, unknown>) }
}

export async function deleteFeedSource(id: string) {
  const me = await getAuthUser()
  if (!me) return { error: 'Nicht autorisiert' }
  const { error } = await supabaseAdmin
    .from('feed_sources')
    .delete()
    .eq('id', id)
    .eq('organization_id', me.organization_id)
  if (error) return { error: error.message }
  return { ok: true }
}

export async function copyFeedSource(id: string) {
  const me = await getAuthUser()
  if (!me) return { error: 'Nicht autorisiert' }
  const { data: src, error: fetchErr } = await supabaseAdmin
    .from('feed_sources')
    .select('*')
    .eq('id', id)
    .eq('organization_id', me.organization_id)
    .single()
  if (fetchErr || !src) return { error: 'Quelle nicht gefunden' }
  const { data, error } = await supabaseAdmin
    .from('feed_sources')
    .insert({
      organization_id: me.organization_id,
      user_id: me.id,
      name: `${src.name} (Kopie)`,
      type: src.type,
      url: src.url,
      config: src.config ?? {},
      keywords_include: src.keywords_include ?? [],
      keywords_exclude: src.keywords_exclude ?? [],
      domains_allow: src.domains_allow ?? [],
      min_score: src.min_score,
      schema_id: src.schema_id ?? null,
      is_active: false,
    })
    .select().single()
  if (error) return { error: error.message }
  return { source: mapSource(data as Record<string, unknown>) }
}

// ---------------------------------------------------------------------------
// Feed Items
// ---------------------------------------------------------------------------

export async function listFeedItems(opts: {
  sourceId?: string
  topicId?: string
  status?: string
  isSaved?: boolean
  dismissed?: boolean
  search?: string
  limit?: number
  offset?: number
} = {}): Promise<{ items: FeedItem[]; total: number }> {
  const me = await getAuthUser()
  if (!me) return { items: [], total: 0 }
  const limit = Math.min(opts.limit ?? 30, 100)
  const offset = opts.offset ?? 0

  // Topic filter: resolve source IDs from feed_topic_sources
  let topicSourceIds: string[] | null = null
  if (opts.topicId) {
    const { data: ts } = await supabaseAdmin
      .from('feed_topic_sources')
      .select('source_id')
      .eq('topic_id', opts.topicId)
    topicSourceIds = (ts ?? []).map((r: Record<string, unknown>) => r.source_id as string)
    if (topicSourceIds.length === 0) return { items: [], total: 0 }
  }

  let q = supabaseAdmin
    .from('feed_items')
    .select('*', { count: 'exact' })
    .eq('organization_id', me.organization_id)
    .neq('status', 'deleted')
    .order('fetched_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (opts.dismissed) {
    // Dismissed tab: show items dismissed in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
    q = q.not('dismissed_at', 'is', null).gte('dismissed_at', thirtyDaysAgo)
  } else {
    // Normal views: hide dismissed items
    q = q.is('dismissed_at', null)
  }

  if (opts.sourceId) q = q.eq('source_id', opts.sourceId)
  if (topicSourceIds) q = q.in('source_id', topicSourceIds)
  if (opts.status) q = q.eq('status', opts.status)
  if (opts.isSaved) q = q.eq('is_saved', true)
  if (opts.search && opts.search.length > 2)
    q = q.or(`title.ilike.%${opts.search}%,summary.ilike.%${opts.search}%`)

  const { data, count } = await q
  return { items: (data ?? []).map((r: Record<string, unknown>) => mapItem(r)), total: count ?? 0 }
}

export async function markItemRead(id: string) {
  const me = await getAuthUser()
  if (!me) return
  await supabaseAdmin.from('feed_items').update({ status: 'read' }).eq('id', id)
    .eq('organization_id', me.organization_id).eq('status', 'unread')
}

export async function toggleItemSaved(id: string, saved: boolean) {
  const me = await getAuthUser()
  if (!me) return
  await supabaseAdmin.from('feed_items').update({ is_saved: saved, status: saved ? 'saved' : 'read' })
    .eq('id', id).eq('organization_id', me.organization_id)
}

export async function markItemNotRelevant(id: string) {
  const me = await getAuthUser()
  if (!me) return
  await recordNotRelevant(id)
}

export async function archiveItem(id: string) {
  const me = await getAuthUser()
  if (!me) return
  await supabaseAdmin.from('feed_items').update({ status: 'archived' })
    .eq('id', id).eq('organization_id', me.organization_id)
}

export async function deleteItem(id: string) {
  const me = await getAuthUser()
  if (!me) return
  await supabaseAdmin.from('feed_items').update({ status: 'deleted' })
    .eq('id', id).eq('organization_id', me.organization_id)
}

// ---------------------------------------------------------------------------
// Distributions
// ---------------------------------------------------------------------------

export async function listDistributions(sourceId: string): Promise<FeedDistribution[]> {
  const { data } = await supabaseAdmin
    .from('feed_distributions')
    .select('*')
    .eq('source_id', sourceId)
  return (data ?? []).map((r: Record<string, unknown>) => mapDistribution(r))
}

export async function createDistribution(sourceId: string, input: Record<string, unknown>) {
  const parsed = createDistributionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.message }
  const targetId = parsed.data.target_type === 'notification'
    ? '00000000-0000-0000-0000-000000000000'
    : parsed.data.target_id
  const { data, error } = await supabaseAdmin.from('feed_distributions').insert({
    source_id:   sourceId,
    target_type: parsed.data.target_type,
    target_id:   targetId,
    auto_inject: parsed.data.auto_inject,
    min_score:   parsed.data.min_score,
  }).select().single()
  if (error) return { error: error.message }
  return { distribution: mapDistribution(data as Record<string, unknown>) }
}

export async function deleteDistribution(id: string) {
  const { error } = await supabaseAdmin.from('feed_distributions').delete().eq('id', id)
  if (error) return { error: error.message }
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Send digest (called by cron/feed-digest)
// ---------------------------------------------------------------------------

export async function sendDigestNow(distributionId: string): Promise<{ sent: number }> {
  // TODO: implement digest email sending via Resend
  log.info('[sendDigestNow] stub called', { distributionId })
  return { sent: 0 }
}

// ---------------------------------------------------------------------------
// Trigger fetch (called by cron + manual "sync now")
// ---------------------------------------------------------------------------

export async function triggerFetch(sourceId: string): Promise<{
  itemsFound: number; itemsSaved: number; errors: string[]
}> {
  const { data: src } = await supabaseAdmin
    .from('feed_sources')
    .select('*')
    .eq('id', sourceId)
    .maybeSingle()

  if (!src) return { itemsFound: 0, itemsSaved: 0, errors: ['Source not found'] }
  const source = mapSource(src as Record<string, unknown>)

  let rawItems: import('@/types/feeds').RawFeedItem[] = []
  const errors: string[] = []

  try {
    if (source.type === 'rss') {
      rawItems = await fetchRss(source.id, source.url ?? '')
    } else if (source.type === 'url') {
      const config = source.config as Record<string, unknown>
      const result = await fetchUrl(source.id, source.url ?? '', config.css_selector as string)
      rawItems = result.items
      if (result.robotsBlocked) errors.push('robots.txt disallows scraping for this URL')
    } else if (source.type === 'api') {
      rawItems = await fetchApi(source)
    }
    // email: handled via inbound webhook, not polled
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err))
  }

  // First fetch (last_fetched_at === null): relax age limit to 30 days so new sources
  // immediately show recent content instead of filtering almost everything out.
  const isFirstFetch = !source.lastFetchedAt
  const processOptions = isFirstFetch ? { maxAgeDays: 30 } : undefined

  let saved = 0
  let stage3Count = 0

  for (const item of rawItems) {
    try {
      if (stage3Count >= 10) {
        item.metadata = { ...(item.metadata ?? {}), stage3_skipped: true }
      }
      const id = await processItem(item, source, processOptions)
      if (id) { saved++; stage3Count++ }
    } catch (err) {
      errors.push(`Item "${item.title}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const { error: updateErr } = await supabaseAdmin.from('feed_sources')
    .update({
      last_fetched_at: new Date().toISOString(),
      error_count: errors.length > 0 ? source.errorCount + 1 : 0,
      last_error: errors[0] ?? null,
    })
    .eq('id', sourceId)

  if (updateErr) log.warn('[triggerFetch] failed to update last_fetched_at', { sourceId, error: updateErr.message })

  return { itemsFound: rawItems.length, itemsSaved: saved, errors }
}

// ---------------------------------------------------------------------------
// Dismiss / Restore (Ausblenden — reversible, 30-day TTL)
// ---------------------------------------------------------------------------

export async function dismissItem(id: string) {
  const me = await getAuthUser()
  if (!me) return
  await supabaseAdmin.from('feed_items')
    .update({ dismissed_at: new Date().toISOString(), dismissed_by: me.id })
    .eq('id', id).eq('organization_id', me.organization_id)
}

export async function restoreItem(id: string) {
  const me = await getAuthUser()
  if (!me) return
  await supabaseAdmin.from('feed_items')
    .update({ dismissed_at: null, dismissed_by: null })
    .eq('id', id).eq('organization_id', me.organization_id)
}

// Topics ausgelagert nach: src/actions/feed-topics.ts
