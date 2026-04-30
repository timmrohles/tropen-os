// src/lib/feeds/pipeline.unit.test.ts
import { describe, it, expect } from 'vitest'
import { runStage1, computeContentHash } from './pipeline'
import type { RawFeedItem, FeedSource } from '@/types/feeds'

const makeSource = (overrides: Partial<FeedSource> = {}): FeedSource => ({
  id: 'src-1', organizationId: 'org-1', userId: null, name: 'Test',
  type: 'rss', url: 'https://example.com/feed', config: {},
  keywordsInclude: [], keywordsExclude: [], domainsAllow: [],
  minScore: 6, schemaId: null, isActive: true, status: 'active', lastFetchedAt: null,
  pausedAt: null, pausedBy: null, pauseReason: null,
  errorCount: 0, lastError: null,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

const makeItem = (overrides: Partial<RawFeedItem> = {}): RawFeedItem => ({
  sourceId: 'src-1', title: 'AI breakthrough in 2026',
  content: 'Scientists announced a major LLM improvement',
  url: 'https://example.com/article', ...overrides,
})

describe('runStage1', () => {
  it('passes an item with no filters', () => {
    expect(runStage1(makeItem(), makeSource()).passed).toBe(true)
  })

  it('rejects item older than 7 days', () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    const result = runStage1(makeItem({ publishedAt: old }), makeSource())
    expect(result.passed).toBe(false)
    expect(result.reason).toMatch(/old/)
  })

  it('rejects item missing required keyword', () => {
    const result = runStage1(
      makeItem({ title: 'Sports results from the weekend', content: 'Football match highlights' }),
      makeSource({ keywordsInclude: ['AI', 'LLM'] })
    )
    expect(result.passed).toBe(false)
  })

  it('passes item with at least one required keyword', () => {
    const result = runStage1(
      makeItem({ title: 'New LLM model released this week', content: 'Details about the latest AI advancement' }),
      makeSource({ keywordsInclude: ['AI', 'LLM'] })
    )
    expect(result.passed).toBe(true)
  })

  it('rejects item with excluded keyword', () => {
    const result = runStage1(
      makeItem({ title: 'Sponsored AI news' }),
      makeSource({ keywordsExclude: ['sponsored'] })
    )
    expect(result.passed).toBe(false)
  })

  it('rejects item not from allowed domain', () => {
    const result = runStage1(
      makeItem({ url: 'https://other.com/article' }),
      makeSource({ domainsAllow: ['example.com'] })
    )
    expect(result.passed).toBe(false)
  })

  it('passes item from allowed domain', () => {
    const result = runStage1(
      makeItem({ url: 'https://example.com/article' }),
      makeSource({ domainsAllow: ['example.com'] })
    )
    expect(result.passed).toBe(true)
  })

  it('rejects item with content shorter than 50 chars', () => {
    const result = runStage1(makeItem({ title: 'Hi', content: 'Short' }), makeSource())
    expect(result.passed).toBe(false)
  })
})

describe('computeContentHash', () => {
  it('produces stable SHA256 hash from url + title', () => {
    const h1 = computeContentHash('https://example.com', 'Title')
    const h2 = computeContentHash('https://example.com', 'Title')
    expect(h1).toBe(h2)
    expect(h1).toHaveLength(64)
  })

  it('produces different hashes for different urls', () => {
    const h1 = computeContentHash('https://a.com', 'Title')
    const h2 = computeContentHash('https://b.com', 'Title')
    expect(h1).not.toBe(h2)
  })
})
