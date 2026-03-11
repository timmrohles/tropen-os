import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logRoutingDecision } from './routing-logger'
import { createServiceClient } from '@/lib/supabase/server'

// createServiceClient ist bereits in setup.ts gemockt

describe('logRoutingDecision', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ist synchron und blockiert nicht (gibt void zurück)', () => {
    const result = logRoutingDecision({
      taskType: 'chat',
      modelSelected: 'gpt-4o-mini',
      routingReason: 'complexity:low',
      latencyMs: 250,
      status: 'success',
    })
    expect(result).toBeUndefined()
  })

  it('ruft createServiceClient auf', async () => {
    logRoutingDecision({
      taskType: 'chat',
      modelSelected: 'gpt-4o-mini',
      routingReason: 'complexity:low',
      latencyMs: 250,
      status: 'success',
    })
    await new Promise(r => setTimeout(r, 10))
    expect(createServiceClient).toHaveBeenCalledOnce()
  })

  it('wirft keinen Fehler wenn Supabase fehlschlägt', async () => {
    vi.mocked(createServiceClient).mockImplementationOnce(() => ({
      from: vi.fn(() => ({
        insert: vi.fn().mockRejectedValue(new Error('DB down')),
      })),
    } as unknown as ReturnType<typeof createServiceClient>))

    expect(() => logRoutingDecision({
      taskType: 'chat',
      modelSelected: 'gpt-4o-mini',
      routingReason: 'direct',
      latencyMs: 100,
      status: 'success',
    })).not.toThrow()

    await new Promise(r => setTimeout(r, 10))
  })

  it('hasht userId wenn angegeben — Klartext wird nicht gespeichert', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: [], error: null })
    vi.mocked(createServiceClient).mockImplementationOnce(() => ({
      from: vi.fn(() => ({ insert: mockInsert })),
    } as unknown as ReturnType<typeof createServiceClient>))

    logRoutingDecision({
      taskType: 'chat',
      modelSelected: 'gpt-4o-mini',
      routingReason: 'direct',
      latencyMs: 100,
      status: 'success',
      userId: 'user-123-plaintext',
    })

    await new Promise(r => setTimeout(r, 10))

    const insertArg = mockInsert.mock.calls[0][0] as Record<string, unknown>
    expect(insertArg.user_id).not.toContain('user-123-plaintext')
    expect(insertArg.user_id).toMatch(/^[a-f0-9]{16}$/)
  })

  it('speichert null als user_id wenn kein userId angegeben', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: [], error: null })
    vi.mocked(createServiceClient).mockImplementationOnce(() => ({
      from: vi.fn(() => ({ insert: mockInsert })),
    } as unknown as ReturnType<typeof createServiceClient>))

    logRoutingDecision({
      taskType: 'chat',
      modelSelected: 'gpt-4o-mini',
      routingReason: 'direct',
      latencyMs: 100,
      status: 'success',
    })

    await new Promise(r => setTimeout(r, 10))
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: null })
    )
  })

  it('übergibt errorMessage bei status error', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: [], error: null })
    vi.mocked(createServiceClient).mockImplementationOnce(() => ({
      from: vi.fn(() => ({ insert: mockInsert })),
    } as unknown as ReturnType<typeof createServiceClient>))

    logRoutingDecision({
      taskType: 'chat',
      modelSelected: 'gpt-4o-mini',
      routingReason: 'direct',
      latencyMs: null,
      status: 'error',
      errorMessage: 'Rate limit exceeded',
    })

    await new Promise(r => setTimeout(r, 10))
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error_message: 'Rate limit exceeded',
      })
    )
  })

  it('übergibt null als error_message wenn kein errorMessage angegeben', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: [], error: null })
    vi.mocked(createServiceClient).mockImplementationOnce(() => ({
      from: vi.fn(() => ({ insert: mockInsert })),
    } as unknown as ReturnType<typeof createServiceClient>))

    logRoutingDecision({
      taskType: 'chat',
      modelSelected: 'gpt-4o-mini',
      routingReason: 'direct',
      latencyMs: 200,
      status: 'success',
    })

    await new Promise(r => setTimeout(r, 10))
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ error_message: null })
    )
  })
})
