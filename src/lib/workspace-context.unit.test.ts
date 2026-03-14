import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildCardContext } from './workspace-context'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildWorkspaceContext, buildContextSnapshot } from './workspace-context'

const mockWorkspace = {
  id: 'ws-1',
  title: 'Q2 Kampagne',
  goal: 'Kampagnenplan erstellen',
  domain: 'marketing',
  status: 'draft',
}
const mockCards = [
  { id: 'card-1', title: 'Zielgruppe', role: 'input', status: 'ready', content: { text: 'B2B SaaS' }, content_type: 'text', stale_reason: null },
  { id: 'card-2', title: 'Analyse', role: 'process', status: 'stale', content: null, content_type: 'text', stale_reason: 'changed' },
]

function makeMock() {
  ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
    if (table === 'workspaces') {
      return {
        select: () => ({
          eq: () => ({
            is: () => ({
              maybeSingle: () => Promise.resolve({ data: mockWorkspace }),
            }),
          }),
        }),
      }
    }
    if (table === 'cards') {
      return {
        select: () => ({
          eq: () => ({
            is: () => ({
              order: () => Promise.resolve({ data: mockCards }),
            }),
          }),
        }),
      }
    }
    if (table === 'connections') {
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: [] }),
        }),
      }
    }
    return {
      select: () => ({
        eq: () => Promise.resolve({ data: [] }),
      }),
    }
  })
}

describe('buildWorkspaceContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    makeMock()
  })

  it('includes workspace goal in output', async () => {
    const ctx = await buildWorkspaceContext('ws-1')
    expect(ctx).toContain('Kampagnenplan erstellen')
  })

  it('includes card titles in output', async () => {
    const ctx = await buildWorkspaceContext('ws-1')
    expect(ctx).toContain('Zielgruppe')
    expect(ctx).toContain('Analyse')
  })

  it('marks stale cards in context', async () => {
    const ctx = await buildWorkspaceContext('ws-1')
    expect(ctx.toLowerCase()).toContain('veraltet')
  })
})

describe('buildContextSnapshot', () => {
  it('returns a serializable snapshot object', () => {
    const snap = buildContextSnapshot(
      'ws-1',
      { title: 'Test', goal: 'Ziel', status: 'draft' },
      [
        { id: 'c1', title: 'Card 1', role: 'input' as const, status: 'ready' as const },
        { id: 'c2', title: 'Card 2', role: 'output' as const, status: 'stale' as const },
      ]
    )
    expect(snap.workspaceId).toBe('ws-1')
    expect(snap.cardCount).toBe(2)
    expect(typeof snap.capturedAt).toBe('string')
  })
})

describe('buildCardContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('includes card title in output', async () => {
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'cards') {
        return {
          select: () => ({
            eq: () => ({
              is: () => ({
                maybeSingle: () => Promise.resolve({
                  data: {
                    id: 'card-1',
                    title: 'Marktanalyse',
                    role: 'process',
                    content_type: 'text',
                    content: { text: 'Analyse der Märkte' },
                  },
                }),
              }),
              in: () => Promise.resolve({ data: [] }),
            }),
          }),
        }
      }
      if (table === 'card_history') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: [] }),
              }),
            }),
          }),
        }
      }
      if (table === 'connections') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [] }),
          }),
        }
      }
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: [] }),
        }),
      }
    })

    const result = await buildCardContext('card-1')
    expect(result).toContain('Marktanalyse')
  })
})
