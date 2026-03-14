import type { RawFeedItem } from '@/types/feeds'

interface WebhookConfig {
  titleField?: string
  contentField?: string
  urlField?: string
}

function pickFirst(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const val = obj[key]
    if (typeof val === 'string' && val) return val
  }
  return undefined
}

function normalizeItem(
  sourceId: string,
  item: unknown,
  config: WebhookConfig,
): RawFeedItem | null {
  if (!item || typeof item !== 'object') return null
  const obj = item as Record<string, unknown>

  const title = (config.titleField && typeof obj[config.titleField] === 'string'
    ? (obj[config.titleField] as string)
    : undefined)
    || pickFirst(obj, ['title', 'name', 'headline', 'subject'])

  const itemUrl = (config.urlField && typeof obj[config.urlField] === 'string'
    ? (obj[config.urlField] as string)
    : undefined)
    || pickFirst(obj, ['url', 'link', 'href'])

  if (!title || !itemUrl) return null

  const content = (config.contentField && typeof obj[config.contentField] === 'string'
    ? (obj[config.contentField] as string)
    : undefined)
    || pickFirst(obj, ['content', 'body', 'description', 'text', 'message'])

  return { sourceId, title, content, url: itemUrl }
}

export function processWebhookPayload(
  sourceId: string,
  payload: unknown,
  config: WebhookConfig = {},
): RawFeedItem[] {
  try {
    if (Array.isArray(payload)) {
      return payload.flatMap((item) => {
        const result = normalizeItem(sourceId, item, config)
        return result ? [result] : []
      })
    }
    const result = normalizeItem(sourceId, payload, config)
    return result ? [result] : []
  } catch {
    return []
  }
}
