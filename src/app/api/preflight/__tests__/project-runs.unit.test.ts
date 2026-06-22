import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
vi.mock('@/lib/api/projects', () => ({ getAuthUser: vi.fn() }))
vi.mock('@/lib/api/preflight', () => ({ getPreflightProjectForUser: vi.fn() }))
vi.mock('@/lib/budget', () => ({
  checkBudget: vi.fn(),
  budgetExhaustedResponse: vi.fn(() => new Response(JSON.stringify({ code: 'BUDGET_EXHAUSTED' }), { status: 402 })),
}))
vi.mock('@/lib/preflight/run', () => ({ analyzePreflight: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { POST } from '../projects/[id]/runs/route'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { checkBudget } from '@/lib/budget'
import { analyzePreflight } from '@/lib/preflight/run'
import { supabaseAdmin } from '@/lib/supabase-admin'

const mockAuth = vi.mocked(getAuthUser)
const mockAccess = vi.mocked(getPreflightProjectForUser)
const mockBudget = vi.mocked(checkBudget)
const mockRun = vi.mocked(analyzePreflight)
const mockAdmin = vi.mocked(supabaseAdmin)
const USER = { id: 'u1', organization_id: 'org1', role: 'member' }
const PROJECT = { id: 'p1', organization_id: 'org1', name: 'LMS', pivots: {}, latest_run_id: 'r0' }
const PIVOTS = { buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu', stack: 'Next.js' } as const
const RESULT = { summary: { projectLabel: 'LMS', headline: 'x' }, gaps: { red: [], yellow: [], decidedCount: 0, naCount: 0 }, nodes: [] }
const ctx = { params: Promise.resolve({ id: 'p1' }) }
const req = (b: unknown) => new NextRequest('http://localhost/api/preflight/projects/p1/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })

describe('POST project runs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('404 ohne Zugriff', async () => {
    mockAuth.mockResolvedValue(USER); mockAccess.mockResolvedValue(null)
    expect((await POST(req({ input: 'genug text hier', pivots: PIVOTS }), ctx)).status).toBe(404)
  })

  it('200 + neuer Run, latest_run_id aktualisiert', async () => {
    mockAuth.mockResolvedValue(USER); mockAccess.mockResolvedValue(PROJECT)
    mockBudget.mockResolvedValue({ allowed: true }); mockRun.mockResolvedValue(RESULT)
    const runSingle = vi.fn().mockResolvedValue({ data: { id: 'r1' }, error: null })
    const updateEq = vi.fn().mockResolvedValue({ data: null, error: null })
    mockAdmin.from = vi.fn((t: string) => t === 'preflight_runs'
      ? { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: runSingle }) }) }
      : { update: vi.fn().mockReturnValue({ eq: updateEq }) }
    ) as unknown as typeof mockAdmin.from
    const res = await POST(req({ input: 'ein hinreichend langer text', pivots: PIVOTS }), ctx)
    expect(res.status).toBe(200)
    expect((await res.json()).result.summary.projectLabel).toBe('LMS')
    expect(updateEq).toHaveBeenCalled()
  })
})
