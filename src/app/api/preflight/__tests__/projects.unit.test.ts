import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
vi.mock('@/lib/api/projects', () => ({ getAuthUser: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { GET } from '../projects/route'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'

const mockAuth = vi.mocked(getAuthUser)
const mockAdmin = vi.mocked(supabaseAdmin)
const USER = { id: 'u1', organization_id: 'org1', role: 'member' }

function mockList(rows: unknown[]) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: null })
  const isNull = vi.fn().mockReturnValue({ order })
  const eq = vi.fn().mockReturnValue({ is: isNull })
  const select = vi.fn().mockReturnValue({ eq })
  mockAdmin.from = vi.fn().mockReturnValue({ select }) as unknown as typeof mockAdmin.from
}

const makeReq = () => new NextRequest('http://localhost/api/preflight/projects')

describe('GET /api/preflight/projects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('401 ohne Auth', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeReq(), {} as never)
    expect(res.status).toBe(401)
  })

  it('mappt Zeilen auf Listen-Items', async () => {
    mockAuth.mockResolvedValue(USER)
    mockList([
      { id: 'p1', name: 'LMS', pivots: { stack: 'Next.js' }, red_count: 17, updated_at: '2026-06-06T10:00:00Z' },
    ])
    const res = await GET(makeReq(), {} as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data[0]).toEqual({ id: 'p1', name: 'LMS', stack: 'Next.js', redCount: 17, updatedAt: '2026-06-06T10:00:00Z' })
  })
})
