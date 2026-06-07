import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/lib/api/projects', () => ({ getAuthUser: vi.fn() }))
vi.mock('@/lib/api/preflight', () => ({ getPreflightProjectForUser: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { PATCH } from '../projects/[id]/decisions/route'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { supabaseAdmin } from '@/lib/supabase-admin'

const mockAuth = vi.mocked(getAuthUser)
const mockAccess = vi.mocked(getPreflightProjectForUser)
const mockAdmin = vi.mocked(supabaseAdmin)
const USER = { id: 'u1', organization_id: 'org1', role: 'member' }
const ctx = { params: Promise.resolve({ id: 'p1' }) }
const req = (b: unknown) => new Request('http://x/api/preflight/projects/p1/decisions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })

describe('PATCH decisions', () => {
  beforeEach(() => vi.clearAllMocks())
  it('404 ohne Zugriff', async () => {
    mockAuth.mockResolvedValue(USER); mockAccess.mockResolvedValue(null)
    expect((await PATCH(req({ nodeId: 'A1', choice: 'default' }), ctx)).status).toBe(404)
  })
  it('setzt Entscheidung + gibt decisions zurück', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue({ id: 'p1', organization_id: 'org1', name: 'x', pivots: {}, latest_run_id: 'r1' } as never)
    const single = vi.fn().mockResolvedValue({ data: { decisions: {} }, error: null })
    const updEq = vi.fn().mockResolvedValue({ data: null, error: null })
    mockAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single }) }),
      update: vi.fn().mockReturnValue({ eq: updEq }),
    }) as never
    const res = await PATCH(req({ nodeId: 'A1', choice: 'custom', value: 'org_id' }), ctx)
    expect(res.status).toBe(200)
    expect((await res.json()).decisions.A1).toEqual({ choice: 'custom', value: 'org_id' })
  })
  it('400 bei ungültiger choice', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue({ id: 'p1', organization_id: 'org1' } as never)
    expect((await PATCH(req({ nodeId: 'A1', choice: 'foo' }), ctx)).status).toBe(400)
  })
})
