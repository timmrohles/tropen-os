// Wiederverwendbare Supabase Mock-Factory für individuelle Tests
import { vi } from 'vitest'
import type { createServiceClient } from '@/lib/supabase/server'

export function createMockSupabaseClient(overrides?: Record<string, unknown>) {
  const mockChain = {
    insert:      vi.fn().mockResolvedValue({ data: [], error: null }),
    select:      vi.fn().mockReturnThis(),
    update:      vi.fn().mockReturnThis(),
    delete:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    neq:         vi.fn().mockReturnThis(),
    gte:         vi.fn().mockReturnThis(),
    lte:         vi.fn().mockReturnThis(),
    in:          vi.fn().mockReturnThis(),
    order:       vi.fn().mockReturnThis(),
    limit:       vi.fn().mockReturnThis(),
    range:       vi.fn().mockReturnThis(),
    single:      vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  }

  return {
    from: vi.fn(() => mockChain),
    _chain: mockChain, // Direktzugriff für Assertions
  } as unknown as ReturnType<typeof createServiceClient> & { _chain: typeof mockChain }
}
