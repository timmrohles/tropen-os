import Parser from 'rss-parser'
import type { RawFeedItem } from '@/types/feeds'

const parser = new Parser()

export async function fetchRss(sourceId: string, url: string): Promise<RawFeedItem[]> {
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
