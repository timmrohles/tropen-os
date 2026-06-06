import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/lib/api/projects', () => ({ getAuthUser: vi.fn() }))
vi.mock('@/lib/api/preflight', () => ({ getPreflightProjectForUser: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { GET, PATCH, DELETE } from '../projects/[id]/route'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { supabaseAdmin } from '@/lib/supabase-admin'

const mockAuth = vi.mocked(getAuthUser)
const mockAccess = vi.mocked(getPreflightProjectForUser)
const mockAdmin = vi.mocked(supabaseAdmin)
const USER = { id: 'u1', organization_id: 'org1', role: 'member' }
const PROJECT = { id: 'p1', organization_id: 'org1', name: 'LMS', pivots: { stack: 'Next.js' }, latest_run_id: 'run1' }
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

function req(body?: unknown) {
  return new Request('http://localhost/api/preflight/projects/p1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('preflight project [id] route', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET 404 wenn kein Zugriff', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue(null)
    const res = await GET(req(), ctx('p1'))
    expect(res.status).toBe(404)
  })

  it('GET liefert Projekt + result des latest run', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue(PROJECT)
    const single = vi.fn().mockResolvedValue({ data: { result: { summary: { projectLabel: 'LMS', headline: 'x' }, gaps: {}, startpaket: {} }, input_text: 'mein konzept' }, error: null })
    mockAdmin.from = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single }) }) }) as unknown as typeof mockAdmin.from
    const res = await GET(req(), ctx('p1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ id: 'p1', name: 'LMS', input: 'mein konzept' })
    expect(body.result.summary.projectLabel).toBe('LMS')
  })

  it('PATCH benennt um', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue(PROJECT)
    const single = vi.fn().mockResolvedValue({ data: { id: 'p1', name: 'Neu' }, error: null })
    mockAdmin.from = vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }) }) }) as unknown as typeof mockAdmin.from
    const res = await PATCH(req({ name: 'Neu' }), ctx('p1'))
    expect(res.status).toBe(200)
    expect((await res.json()).name).toBe('Neu')
  })

  it('PATCH 400 bei leerem name', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue(PROJECT)
    const res = await PATCH(req({ name: '   ' }), ctx('p1'))
    expect(res.status).toBe(400)
  })

  it('DELETE soft-deletes', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue(PROJECT)
    const eq = vi.fn().mockResolvedValue({ data: null, error: null })
    mockAdmin.from = vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) }) as unknown as typeof mockAdmin.from
    const res = await DELETE(req(), ctx('p1'))
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
  })
})
