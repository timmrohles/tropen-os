import Parser from 'rss-parser'
import type { RawFeedItem } from '@/types/feeds'
import { isSafeUrl } from '@/lib/feeds/ssrf-guard'
import { createLogger } from '@/lib/logger'

const parser = new Parser()
const log = createLogger('feeds:fetchers:rss')

export async function fetchRss(sourceId: string, url: string): Promise<RawFeedItem[]> {
  const { safe, reason } = await isSafeUrl(url)
  if (!safe) {
    log.warn('[rss fetcher] SSRF-Check fehlgeschlagen', { url, reason })
    return []
  }

  try {
    const feed = await parser.parseURL(url)
    const items = feed.items.slice(0, 50)

    return items
      .filter((item) => item.title && item.link)
      .map((item): RawFeedItem => ({
        sourceId,
        title: item.title!,
        content: item.content || item.contentSnippet || undefined,
        url: item.link!,
        publishedAt: item.isoDate ? new Date(item.isoDate) : undefined,
      }))
  } catch {
    return []
  }
}
