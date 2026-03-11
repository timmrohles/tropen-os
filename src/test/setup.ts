import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { server } from './mocks/server'

// MSW Mock Server
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Supabase Service Client mocken — nie echte DB in Unit Tests
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert:      vi.fn().mockResolvedValue({ data: [], error: null }),
      select:      vi.fn().mockReturnThis(),
      update:      vi.fn().mockReturnThis(),
      delete:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      gte:         vi.fn().mockReturnThis(),
      in:          vi.fn().mockReturnThis(),
      order:       vi.fn().mockReturnThis(),
      limit:       vi.fn().mockReturnThis(),
      range:       vi.fn().mockReturnThis(),
      single:      vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

// Supabase Auth Client mocken (next/headers-Abhängigkeit vermeiden)
// Wird von isSuperadmin() in API-Routes verwendet
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'superadmin-user-id' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      single:      vi.fn().mockResolvedValue({ data: { role: 'superadmin' }, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'superadmin' }, error: null }),
    })),
  }),
}))

// next/headers mocken (cookies() wird in Utils/Supabase-Server aufgerufen)
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}))

// node:crypto wird direkt von Node.js aufgelöst — kein Mock nötig

// LangSmith in Tests immer deaktivieren — keine externen Calls
process.env.LANGSMITH_TRACING = 'false'
process.env.LANGSMITH_API_KEY = ''
