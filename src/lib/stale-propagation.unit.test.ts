import { describe, it, expect, vi, beforeEach } from 'vitest'
import { markDirectDepsStale } from './stale-propagation'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

import { supabaseAdmin } from '@/lib/supabase-admin'

describe('markDirectDepsStale', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('marks direct dependent cards as stale', async () => {
    const mockConnections = [
      { target_card_id: 'card-b' },
      { target_card_id: 'card-c' },
    ]

    let callCount = 0
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'connections' && callCount === 0) {
        callCount++
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: mockConnections, error: null }),
            }),
          }),
        }
      }
      if (table === 'cards') {
        return {
          update: () => ({
            in: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          }),
        }
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }
    })

    await markDirectDepsStale('workspace-1', 'card-a', 'Karte "Marktanalyse" wurde geändert')

    expect(supabaseAdmin.from).toHaveBeenCalledWith('connections')
    expect(supabaseAdmin.from).toHaveBeenCalledWith('cards')
  })

  it('does nothing if no dependent cards exist', async () => {
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }))

    await expect(
      markDirectDepsStale('workspace-1', 'card-a', 'reason')
    ).resolves.not.toThrow()

    // Should only call 'connections', NOT 'cards' (nothing to update)
    const calls = (supabaseAdmin.from as ReturnType<typeof vi.fn>).mock.calls
    expect(calls.some((c: unknown[]) => c[0] === 'cards')).toBe(false)
  })
})
