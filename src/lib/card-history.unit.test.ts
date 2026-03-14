import { describe, it, expect, vi, beforeEach } from 'vitest'
import { writeCardSnapshot, mapCardHistory } from './card-history'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

import { supabaseAdmin } from '@/lib/supabase-admin'

const mockRow = {
  id: 'hist-1',
  card_id: 'card-1',
  workspace_id: 'ws-1',
  snapshot: { id: 'card-1', title: 'Test', workspace_id: 'ws-1' },
  changed_by: 'user-1',
  change_reason: 'Karte aktualisiert',
  created_at: '2026-03-14T10:00:00Z',
}

describe('writeCardSnapshot', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('inserts a history row with correct fields (APPEND ONLY — no update/delete)', async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: () => ({ single: () => Promise.resolve({ data: mockRow, error: null }) }),
    })
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({
      insert: insertMock,
    })

    const card = { id: 'card-1', workspace_id: 'ws-1', title: 'Test', status: 'ready' }
    const result = await writeCardSnapshot(card, 'Karte aktualisiert', 'user-1')

    // Must use insert — never update or delete
    expect(insertMock).toHaveBeenCalledOnce()
    const insertedPayload = insertMock.mock.calls[0][0]
    expect(insertedPayload.card_id).toBe('card-1')
    expect(insertedPayload.workspace_id).toBe('ws-1')
    expect(insertedPayload.snapshot).toEqual(card)
    expect(insertedPayload.change_reason).toBe('Karte aktualisiert')
    expect(insertedPayload.changed_by).toBe('user-1')

    // Result maps correctly
    expect(result.cardId).toBe('card-1')
    expect(result.workspaceId).toBe('ws-1')
    expect(result.changeReason).toBe('Karte aktualisiert')

    // Verify no update/delete was called
    const fromMock = supabaseAdmin.from as ReturnType<typeof vi.fn>
    const returnedObj = fromMock.mock.results[0].value
    expect(returnedObj.update).toBeUndefined()
    expect(returnedObj.delete).toBeUndefined()
  })

  it('throws on Supabase error', async () => {
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'DB failure' } }),
        }),
      }),
    })

    await expect(
      writeCardSnapshot({ id: 'card-1', workspace_id: 'ws-1' }, 'reason')
    ).rejects.toThrow('writeCardSnapshot failed: DB failure')
  })
})

describe('mapCardHistory', () => {
  it('maps snake_case DB row to CardHistoryEntry', () => {
    const result = mapCardHistory(mockRow as unknown as Record<string, unknown>)
    expect(result.id).toBe('hist-1')
    expect(result.cardId).toBe('card-1')
    expect(result.workspaceId).toBe('ws-1')
    expect(result.changedBy).toBe('user-1')
    expect(result.changeReason).toBe('Karte aktualisiert')
    expect(result.snapshot).toEqual(mockRow.snapshot)
  })
})
