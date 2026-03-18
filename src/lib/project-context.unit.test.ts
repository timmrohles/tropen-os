import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { supabaseAdmin } from '@/lib/supabase-admin'
import { loadProjectContext } from './project-context'

const PROJECT_ID = '00000000-0000-0000-0000-000000000001'
const fromMock = supabaseAdmin.from as ReturnType<typeof vi.fn>

describe('loadProjectContext', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns instructions and memory entries when both exist', async () => {
    fromMock
      // projects query
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ is: () => ({ single: () => Promise.resolve({
          data: { instructions: 'Mache X.' }, error: null,
        }) }) }) }),
      })
      // project_memory query
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({
          data: [
            { type: 'fact',     content: 'Wichtige Info.' },
            { type: 'decision', content: 'Wir nutzen Supabase.' },
          ],
          error: null,
        }) }) }) }),
      })

    const result = await loadProjectContext(PROJECT_ID)

    expect(result.instructions).toBe('Mache X.')
    expect(result.memoryEntries).toContain('[fact] Wichtige Info.')
    expect(result.memoryEntries).toContain('[decision] Wir nutzen Supabase.')
    expect(result.tokenEstimate).toBeGreaterThan(0)
  })

  it('returns nulls when project has no instructions and no memory', async () => {
    fromMock
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ is: () => ({ single: () => Promise.resolve({
          data: { instructions: null }, error: null,
        }) }) }) }),
      })
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({
          data: [], error: null,
        }) }) }) }),
      })

    const result = await loadProjectContext(PROJECT_ID)

    expect(result.instructions).toBeNull()
    expect(result.memoryEntries).toBeNull()
    expect(result.tokenEstimate).toBe(0)
  })

  it('returns instructions without memory when memory is empty', async () => {
    fromMock
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ is: () => ({ single: () => Promise.resolve({
          data: { instructions: 'Fokus auf KMU.' }, error: null,
        }) }) }) }),
      })
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({
          data: [], error: null,
        }) }) }) }),
      })

    const result = await loadProjectContext(PROJECT_ID)

    expect(result.instructions).toBe('Fokus auf KMU.')
    expect(result.memoryEntries).toBeNull()
    expect(result.tokenEstimate).toBeGreaterThan(0)
  })
})
