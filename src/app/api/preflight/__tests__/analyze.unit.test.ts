import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// --- Mocks (must be hoisted before imports of the module under test) ---

vi.mock('@/lib/api/projects', () => ({
  getAuthUser: vi.fn(),
}))

vi.mock('@/lib/budget', () => ({
  checkBudget: vi.fn(),
  budgetExhaustedResponse: vi.fn(() =>
    new Response(JSON.stringify({ error: 'Budget erschöpft', code: 'BUDGET_EXHAUSTED' }), {
      status: 402,
      headers: { 'Content-Type': 'application/json' },
    })
  ),
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/preflight/run', () => ({
  analyzePreflight: vi.fn(),
}))

// --- Import after mocks are registered ---

import { POST } from '../analyze/route'
import { getAuthUser } from '@/lib/api/projects'
import { checkBudget } from '@/lib/budget'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { analyzePreflight } from '@/lib/preflight/run'

// --- Typed mock helpers ---

const mockGetAuthUser  = vi.mocked(getAuthUser)
const mockCheckBudget  = vi.mocked(checkBudget)
const mockAnalyzePreflight = vi.mocked(analyzePreflight)
const mockSupabaseAdmin = vi.mocked(supabaseAdmin)

// Fake user returned by getAuthUser
const FAKE_USER = { id: 'user-123', organization_id: 'org-456', role: 'member' }

const FAKE_PIVOTS = { buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu', stack: 'Next.js + Supabase' } as const

// Default happy-path payload (v2 shape)
const FAKE_RESULT = {
  summary: { projectLabel: 'Test-Projekt', headline: 'Keine Blocker — du kannst loslegen.' },
  gaps: { red: [], yellow: [], decidedCount: 0, naCount: 0 },
  nodes: [],
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/preflight/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Baut einen supabaseAdmin-Mock, der projects.insert→select→single, runs.insert→select→single
// und projects.update→eq auflöst.
function buildProjectRunMocks(projectId = 'proj-1', runId = 'run-1') {
  const projInsertSingle = vi.fn().mockResolvedValue({ data: { id: projectId }, error: null })
  const runInsertSingle  = vi.fn().mockResolvedValue({ data: { id: runId }, error: null })
  const updateEq = vi.fn().mockResolvedValue({ data: null, error: null })

  mockSupabaseAdmin.from = vi.fn((table: string) => {
    if (table === 'preflight_projects') {
      return {
        insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: projInsertSingle }) }),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      }
    }
    // preflight_runs
    return {
      insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: runInsertSingle }) }),
    }
  }) as unknown as typeof mockSupabaseAdmin.from
  return { updateEq }
}

describe('POST /api/preflight/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ------------------------------------------------------------------
  // 401 — no authenticated user
  // ------------------------------------------------------------------
  it('returns 401 when getAuthUser returns null', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const res = await POST(makeRequest({ input: 'some design doc text here', pivots: FAKE_PIVOTS }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty('error', 'Unauthorized')
  })

  // ------------------------------------------------------------------
  // 402 — budget exhausted
  // ------------------------------------------------------------------
  it('returns 402 when budget is exhausted', async () => {
    mockGetAuthUser.mockResolvedValue(FAKE_USER)
    mockCheckBudget.mockResolvedValue({ allowed: false, reason: 'Budget aufgebraucht' })

    const res = await POST(makeRequest({ input: 'some design doc text here', pivots: FAKE_PIVOTS }))
    expect(res.status).toBe(402)
    const body = await res.json()
    expect(body).toHaveProperty('code', 'BUDGET_EXHAUSTED')
  })

  // ------------------------------------------------------------------
  // 400 — validation: missing/empty input field
  // ------------------------------------------------------------------
  it('returns 400 when input field is missing', async () => {
    mockGetAuthUser.mockResolvedValue(FAKE_USER)
    mockCheckBudget.mockResolvedValue({ allowed: true })

    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  it('returns 400 when input is an empty string', async () => {
    mockGetAuthUser.mockResolvedValue(FAKE_USER)
    mockCheckBudget.mockResolvedValue({ allowed: true })

    const res = await POST(makeRequest({ input: '' }))
    expect(res.status).toBe(400)
  })

  // ------------------------------------------------------------------
  // 400 — runPreflight throws (input too short after normalisation)
  // ------------------------------------------------------------------
  it('returns 400 when runPreflight throws due to short input', async () => {
    mockGetAuthUser.mockResolvedValue(FAKE_USER)
    mockCheckBudget.mockResolvedValue({ allowed: true })
    mockAnalyzePreflight.mockRejectedValue(
      new Error('Input zu kurz — gib mehr Detail (mind. ein paar Sätze oder ein Schema).')
    )

    const res = await POST(makeRequest({ input: 'too short', pivots: FAKE_PIVOTS }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/zu kurz/i)
  })

  // ------------------------------------------------------------------
  // 200 — happy path
  // ------------------------------------------------------------------
  it('returns 200 with projectId and result on success', async () => {
    mockGetAuthUser.mockResolvedValue(FAKE_USER)
    mockCheckBudget.mockResolvedValue({ allowed: true })
    mockAnalyzePreflight.mockResolvedValue(FAKE_RESULT)
    buildProjectRunMocks('proj-9', 'run-9')

    const res = await POST(makeRequest({ input: 'This is a sufficiently long design document', pivots: FAKE_PIVOTS }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('projectId', 'proj-9')
    expect(body.result.gaps).toEqual(FAKE_RESULT.gaps)
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('preflight_projects')
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('preflight_runs')
  })

  it('uses projectLabel as name when name is omitted', async () => {
    mockGetAuthUser.mockResolvedValue(FAKE_USER)
    mockCheckBudget.mockResolvedValue({ allowed: true })
    mockAnalyzePreflight.mockResolvedValue(FAKE_RESULT)
    buildProjectRunMocks()
    const res = await POST(makeRequest({ input: 'A design doc with meaningful content here', pivots: FAKE_PIVOTS }))
    expect(res.status).toBe(200)
  })
})
