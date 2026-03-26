// src/lib/feeds/fetchers/url.ts
import * as cheerio from 'cheerio'
import type { RawFeedItem } from '@/types/feeds'
import { createLogger } from '@/lib/logger'
import { isSafeUrl } from '@/lib/feeds/ssrf-guard'

const log = createLogger('feeds:fetchers:url')

async function isScrapingAllowed(url: string): Promise<boolean> {
  try {
    const { origin } = new URL(url)
    const robotsRes = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(5000) })
    if (!robotsRes.ok) return true  // no robots.txt → assume allowed

    const text = await robotsRes.text()
    const lines = text.split('\n').map((l) => l.trim())

    let inRelevantBlock = false
    for (const line of lines) {
      if (line.toLowerCase().startsWith('user-agent:')) {
        const agent = line.split(':')[1].trim()
        inRelevantBlock = agent === '*' || agent.toLowerCase().includes('tropenbot')
      }
      if (inRelevantBlock && line.toLowerCase().startsWith('disallow:')) {
        const path = line.split(':')[1].trim()
        if (path === '/' || path === '') return false
        const urlPath = new URL(url).pathname
        if (urlPath.startsWith(path)) return false
      }
    }
    return true
  } catch {
    return true  // on error, optimistically allow
  }
}

export async function fetchUrl(
  sourceId: string,
  url: string,
  selector?: string,
): Promise<{ items: RawFeedItem[]; robotsBlocked: boolean }> {
  // SSRF-Check vor jedem externen Request
  const { safe, reason } = await isSafeUrl(url)
  if (!safe) {
    log.warn('[url fetcher] SSRF-Check fehlgeschlagen', { url, reason })
    return { items: [], robotsBlocked: false }
  }

  const allowed = await isScrapingAllowed(url)
  if (!allowed) {
    log.warn('[url fetcher] robots.txt disallows scraping', { url })
    return { items: [], robotsBlocked: true }
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TropenBot/1.0 (feed aggregator)' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return { items: [], robotsBlocked: false }

    const html = await res.text()
    const $ = cheerio.load(html)
    const items: RawFeedItem[] = []

    if (selector) {
      $(selector).each((_, el) => {
        const title = $(el).find('h1,h2,h3,h4').first().text().trim()
          || $(el).attr('title')
          || $(el).text().trim().slice(0, 80)
        const href = $(el).find('a').first().attr('href')
        const itemUrl = href ? new URL(href, url).toString() : url
        const content = $(el).text().trim().slice(0, 2000) || undefined
        if (title && title.length > 5) {
          items.push({ sourceId, title, content, url: itemUrl })
        }
      })
    } else {
      // Fallback: find all article/h2+link combinations
      $('article, .post, .entry').each((_, el) => {
        const title = $(el).find('h1,h2,h3').first().text().trim()
        const href = $(el).find('a').first().attr('href')
        const itemUrl = href ? new URL(href, url).toString() : url
        const content = $(el).text().trim().slice(0, 2000)
        if (title && title.length > 5) {
          items.push({ sourceId, title, content, url: itemUrl })
        }
      })
    }

    return { items: items.slice(0, 30), robotsBlocked: false }
  } catch (err) {
    log.error('[url fetcher] fetch failed', { url, error: String(err) })
    return { items: [], robotsBlocked: false }
  }
}
