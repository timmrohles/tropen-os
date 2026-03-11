import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { createServiceClient } from '@/lib/supabase/server'
import { createMockSupabaseClient } from '@/test/mocks/supabase'

// createServiceClient und createClient (isSuperadmin) sind in setup.ts gemockt

describe('GET /api/admin/qa/compliance', () => {
  beforeEach(() => vi.clearAllMocks())

  it('gibt korrekte Response-Shape zurück', async () => {
    const mockClient = createMockSupabaseClient({
      order: vi.fn().mockResolvedValue({
        data: [
          { id: '1', article: 'Art. 50', label: 'KI offenlegen', status: 'fail',  notes: null, open_action: null, deadline: null, last_checked_at: new Date().toISOString() },
          { id: '2', article: 'Art. 13', label: 'Transparenz',  status: 'warn',  notes: null, open_action: null, deadline: null, last_checked_at: new Date().toISOString() },
          { id: '3', article: 'DSGVO',   label: 'Datenschutz',  status: 'pass',  notes: null, open_action: null, deadline: null, last_checked_at: new Date().toISOString() },
        ],
        error: null,
      }),
    })
    vi.mocked(createServiceClient).mockReturnValue(mockClient)

    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty('summary')
    expect(body).toHaveProperty('items')
    expect(body).toHaveProperty('openActions')
    expect(body.summary).toEqual({ pass: 1, warn: 1, fail: 1, total: 3 })
  })

  it('summary.total entspricht Anzahl der items', async () => {
    const mockClient = createMockSupabaseClient({
      order: vi.fn().mockResolvedValue({
        data: Array.from({ length: 10 }, (_, i) => ({
          id: String(i), article: `Art. ${i}`, label: 'Label', status: 'fail',
          notes: null, open_action: null, deadline: null,
          last_checked_at: new Date().toISOString(),
        })),
        error: null,
      }),
    })
    vi.mocked(createServiceClient).mockReturnValue(mockClient)

    const body = await (await GET()).json()
    expect(body.summary.total).toBe(10)
    expect(body.items).toHaveLength(10)
  })

  it('openActions enthält nur Einträge mit open_action-Feld', async () => {
    const mockClient = createMockSupabaseClient({
      order: vi.fn().mockResolvedValue({
        data: [
          { id: '1', article: 'Art. 50', label: 'A', status: 'pass', notes: null, open_action: null,                           deadline: null,        last_checked_at: new Date().toISOString() },
          { id: '2', article: 'Art. 13', label: 'B', status: 'warn', notes: null, open_action: 'Transparenz-Doku erstellen',   deadline: 'vor Launch', last_checked_at: new Date().toISOString() },
          { id: '3', article: 'Art. 9',  label: 'C', status: 'fail', notes: null, open_action: 'Risikoregister anlegen',       deadline: 'KW 14',     last_checked_at: new Date().toISOString() },
        ],
        error: null,
      }),
    })
    vi.mocked(createServiceClient).mockReturnValue(mockClient)

    const body = await (await GET()).json()
    expect(body.openActions).toHaveLength(2)
    expect(body.openActions[0].article).toBe('Art. 13')
    expect(body.openActions[1].article).toBe('Art. 9')
  })

  it('openActions hat korrekte Shape (article, action, deadline)', async () => {
    const mockClient = createMockSupabaseClient({
      order: vi.fn().mockResolvedValue({
        data: [
          { id: '1', article: 'Art. 9', label: 'Risiko', status: 'fail', notes: null,
            open_action: 'Risikoregister anlegen', deadline: 'KW 14',
            last_checked_at: new Date().toISOString() },
        ],
        error: null,
      }),
    })
    vi.mocked(createServiceClient).mockReturnValue(mockClient)

    const body = await (await GET()).json()
    expect(body.openActions[0]).toEqual({
      article: 'Art. 9',
      action: 'Risikoregister anlegen',
      deadline: 'KW 14',
    })
  })

  it('gibt leeres openActions zurück wenn kein open_action gesetzt', async () => {
    const mockClient = createMockSupabaseClient({
      order: vi.fn().mockResolvedValue({
        data: [
          { id: '1', article: 'Art. 50', label: 'A', status: 'fail', notes: null,
            open_action: null, deadline: null, last_checked_at: new Date().toISOString() },
        ],
        error: null,
      }),
    })
    vi.mocked(createServiceClient).mockReturnValue(mockClient)

    const body = await (await GET()).json()
    expect(body.openActions).toHaveLength(0)
  })

  it('gibt 500 zurück wenn Supabase einen Fehler wirft', async () => {
    vi.mocked(createServiceClient).mockImplementationOnce(() => {
      throw new Error('Connection failed')
    })

    const response = await GET()
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body).toHaveProperty('error')
    expect(body).toHaveProperty('code', 'QA_COMPLIANCE_ERROR')
  })
})
