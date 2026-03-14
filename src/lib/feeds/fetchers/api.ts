// src/lib/feeds/fetchers/api.ts
import type { RawFeedItem, FeedSource } from '@/types/feeds'
import { createLogger } from '@/lib/logger'

const log = createLogger('feeds:fetchers:api')

function extractByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce((cur: unknown, key) => {
    if (cur == null) return undefined
    return (cur as Record<string, unknown>)[key]
  }, obj)
}

export function applyMapping(item: Record<string, unknown>, mapping: Record<string, string>, sourceId: string): RawFeedItem | null {
  const title = extractByPath(item, mapping.title ?? '') as string
  const url = extractByPath(item, mapping.url ?? '') as string
  if (!title || !url) return null

  const content = mapping.content ? extractByPath(item, mapping.content) as string : undefined
  const dateStr = mapping.date ? extractByPath(item, mapping.date) as string : undefined

  return {
    sourceId,
    title,
    url,
    content: content || undefined,
    publishedAt: dateStr ? new Date(dateStr) : undefined,
    author: mapping.author ? extractByPath(item, mapping.author) as string : undefined,
  }
}

export async function fetchApi(source: FeedSource, mapping?: Record<string, string>): Promise<RawFeedItem[]> {
  const config = source.config as Record<string, unknown>
  if (!source.url) return []

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(config.headers as Record<string, string> ?? {}),
  }

  // Auth
  if (config.auth_type === 'bearer') {
    headers['Authorization'] = `Bearer ${config.auth_value}`
  } else if (config.auth_type === 'api_key') {
    headers[(config.auth_header as string) ?? 'X-API-Key'] = config.auth_value as string
  } else if (config.auth_type === 'basic') {
    headers['Authorization'] = `Basic ${Buffer.from(config.auth_value as string).toString('base64')}`
  }

  try {
    const res = await fetch(source.url, {
      method: (config.method as string) ?? 'GET',
      headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      log.warn('[api fetcher] non-OK response', { sourceId: source.id, status: res.status })
      return []
    }

    const json = await res.json()

    const responsePath = config.response_path as string ?? ''
    const itemsRaw = responsePath ? extractByPath(json, responsePath) : json
    if (!Array.isArray(itemsRaw)) return []

    if (!mapping) return []

    return itemsRaw
      .map((item) => applyMapping(item as Record<string, unknown>, mapping, source.id))
      .filter((item): item is RawFeedItem => item !== null)
  } catch (err) {
    log.error('[api fetcher] failed', { sourceId: source.id, error: String(err) })
    return []
  }
}
