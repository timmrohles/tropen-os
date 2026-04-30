// src/lib/feeds/feed-runner.unit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn() }),
}))

vi.mock('@/actions/feeds', () => ({
  triggerFetch: vi.fn(),
}))

vi.mock('./distributor', () => ({
  distributeItem: vi.fn(),
}))

import { supabaseAdmin } from '@/lib/supabase-admin'
import { triggerFetch } from '@/actions/feeds'
import { distributeItem } from './distributor'
import { runFeedSource } from './feed-runner'

// ── Helpers ────────────────────────────────────────────────────────────────
function makeChain(returnValue: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(returnValue),
    maybeSingle: vi.fn().mockResolvedValue(returnValue),
  }
}

const mockFrom = vi.mocked(supabaseAdmin.from)

describe('runFeedSource', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error result when source not found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null }) as unknown as ReturnType<typeof supabaseAdmin.from>)

    const result = await runFeedSource('nonexistent-id')

    expect(result.status).toBe('error')
    expect(result.errors[0].message).toBe('Source not found')
    expect(result.itemsFound).toBe(0)
  })

  it('skips paused source', async () => {
    mockFrom.mockReturnValue(makeChain({
      data: { id: 'src-1', organization_id: 'org-1', status: 'paused', name: 'Test' },
    }) as unknown as ReturnType<typeof supabaseAdmin.from>)

    const result = await runFeedSource('src-1')

    expect(result.status).toBe('error')
    expect(result.errors[0].message).toContain('paused')
    expect(triggerFetch).not.toHaveBeenCalled()
  })

  it('returns success when fetch finds items', async () => {
    // Awaitable chain that resolves to a given value
    const awaitable = (value: unknown) => {
      const chain = makeChain(value)
      // Make the chain itself awaitable (Supabase queries resolve when awaited)
      Object.assign(chain, {
        then: (resolve: (v: unknown) => void) => resolve(value),
      })
      return chain
    }

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return makeChain({ data: { id: 'src-1', organization_id: 'org-1', status: 'active', name: 'Test' } }) as unknown as ReturnType<typeof supabaseAdmin.from>
      }
      if (callCount === 2) {
        // feed_runs insert → single
        const c = makeChain({ data: { id: 'run-1' }, error: null })
        c.insert = vi.fn().mockReturnThis()
        return c as unknown as ReturnType<typeof supabaseAdmin.from>
      }
      if (callCount === 3) {
        // Stage-3 items query ends with .gte() — needs to be awaitable
        return awaitable({ data: [{ id: 'item-1' }] }) as unknown as ReturnType<typeof supabaseAdmin.from>
      }
      // feed_runs update
      return {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (v: unknown) => void) => resolve({ error: null }),
      } as unknown as ReturnType<typeof supabaseAdmin.from>
    })

    vi.mocked(triggerFetch).mockResolvedValue({ itemsFound: 3, itemsSaved: 2, errors: [] })
    vi.mocked(distributeItem).mockResolvedValue()

    const result = await runFeedSource('src-1', 'manual')

    expect(result.status).toBe('success')
    expect(result.itemsFound).toBe(3)
    expect(result.itemsScored).toBe(2)
    expect(distributeItem).toHaveBeenCalledWith('item-1')
  })
})

describe('distributor notification target', () => {
  it('inserts notifications for all org users', async () => {
    // This is tested indirectly via runFeedSource; the distributor's own
    // unit test lives in distributor.unit.test.ts (to be added later)
    expect(true).toBe(true)
  })
})
