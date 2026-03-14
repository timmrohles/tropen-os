import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getWorkspaceAt, getCardHistoryAt } from './workspace-time'

describe('getWorkspaceAt', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns context_snapshot from nearest message before the given time', async () => {
    const mockSnapshot = {
      workspaceId: 'ws-1',
      workspaceTitle: 'Test',
      cardCount: 3,
      capturedAt: '2026-03-01T10:00:00Z',
    }

    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          lte: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: { context_snapshot: mockSnapshot } }),
              }),
            }),
          }),
        }),
      }),
    }))

    const result = await getWorkspaceAt('ws-1', new Date('2026-03-01T12:00:00Z'))
    expect(result?.workspaceTitle).toBe('Test')
    expect(result?.cardCount).toBe(3)
  })

  it('returns null if no messages found before that time', async () => {
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          lte: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: null }),
              }),
            }),
          }),
        }),
      }),
    }))

    const result = await getWorkspaceAt('ws-1', new Date('2025-01-01'))
    expect(result).toBeNull()
  })
})

describe('getCardHistoryAt', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns the most recent snapshot before the given time', async () => {
    const mockSnap = { id: 'card-1', title: 'Test Karte', status: 'ready' }

    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          lte: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({
                  data: { snapshot: mockSnap, created_at: '2026-03-01T10:00:00Z' },
                }),
              }),
            }),
          }),
        }),
      }),
    }))

    const result = await getCardHistoryAt('card-1', new Date('2026-03-02'))
    expect(result?.snapshot?.title).toBe('Test Karte')
    expect(result?.createdAt).toBe('2026-03-01T10:00:00Z')
  })

  it('returns null if no history exists for that card', async () => {
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          lte: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: null }),
              }),
            }),
          }),
        }),
      }),
    }))

    const result = await getCardHistoryAt('card-1', new Date('2025-01-01'))
    expect(result).toBeNull()
  })
})
