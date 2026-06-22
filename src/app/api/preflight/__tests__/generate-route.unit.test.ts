import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
vi.mock('@/lib/api/projects', () => ({ getAuthUser: vi.fn() }))
vi.mock('@/lib/api/preflight', () => ({ getPreflightProjectForUser: vi.fn() }))
vi.mock('@/lib/budget', () => ({ checkBudget: vi.fn(), budgetExhaustedResponse: vi.fn(() => new Response('{}', { status: 402 })) }))
vi.mock('@/lib/preflight/generate', () => ({ generateStartpaket: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { POST } from '../projects/[id]/generate/route'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { checkBudget } from '@/lib/budget'
import { generateStartpaket } from '@/lib/preflight/generate'
import { supabaseAdmin } from '@/lib/supabase-admin'

const mAuth = vi.mocked(getAuthUser), mAccess = vi.mocked(getPreflightProjectForUser), mBudget = vi.mocked(checkBudget), mGen = vi.mocked(generateStartpaket), mAdmin = vi.mocked(supabaseAdmin)
const USER = { id: 'u1', organization_id: 'org1', role: 'member' }
const ctx = { params: Promise.resolve({ id: 'p1' }) }
const req = () => new NextRequest('http://x', { method: 'POST' })

function wire(decisions: unknown, redIds: string[]) {
  mAccess.mockResolvedValue({ id: 'p1', organization_id: 'org1', latest_run_id: 'r1', pivots: { buildTool: 'cursor' }, decisions } as never)
  const runSingle = vi.fn().mockResolvedValue({ data: { result: { gaps: { red: redIds.map(id => ({ id })), yellow: [], decidedCount: 0, naCount: 0 }, nodes: [] }, input_text: 'konzept' }, error: null })
  const updEq = vi.fn().mockResolvedValue({ data: null, error: null })
  mAdmin.from = vi.fn((t: string) => t === 'preflight_runs'
    ? { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: runSingle }) }) }
    : { update: vi.fn().mockReturnValue({ eq: updEq }) }) as never
  return { updEq }
}

describe('POST generate', () => {
  beforeEach(() => vi.clearAllMocks())
  it('409 wenn Mindeststandard nicht erreicht', async () => {
    mAuth.mockResolvedValue(USER); mBudget.mockResolvedValue({ allowed: true })
    wire({}, ['A1'])
    const res = await POST(req(), ctx)
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('MIN_STANDARD_NOT_MET')
  })
  it('200 + startpaket wenn Gate erreicht', async () => {
    mAuth.mockResolvedValue(USER); mBudget.mockResolvedValue({ allowed: true })
    mGen.mockResolvedValue({ decisionLog: '', conventions: { filename: '.cursorrules', content: '' }, envExample: '' } as never)
    const { updEq } = wire({ A1: { choice: 'default' } }, ['A1'])
    const res = await POST(req(), ctx)
    expect(res.status).toBe(200)
    expect((await res.json()).startpaket).toBeDefined()
    expect(updEq).toHaveBeenCalled()
  })
})
