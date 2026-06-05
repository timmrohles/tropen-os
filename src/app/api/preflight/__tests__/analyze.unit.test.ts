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
  runPreflight: vi.fn(),
}))

// --- Import after mocks are registered ---

import { POST } from '../analyze/route'
import { getAuthUser } from '@/lib/api/projects'
import { checkBudget } from '@/lib/budget'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { runPreflight } from '@/lib/preflight/run'

// --- Typed mock helpers ---

const mockGetAuthUser  = vi.mocked(getAuthUser)
const mockCheckBudget  = vi.mocked(checkBudget)
const mockRunPreflight = vi.mocked(runPreflight)
const mockSupabaseAdmin = vi.mocked(supabaseAdmin)

// Fake user returned by getAuthUser
const FAKE_USER = { id: 'user-123', organization_id: 'org-456', role: 'member' }

const FAKE_PIVOTS = { buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu', stack: 'Next.js + Supabase' } as const

// Default happy-path payload (v2 shape)
const FAKE_RESULT = {
  summary: { projectLabel: 'Test-Projekt', headline: 'Keine Blocker — du kannst loslegen.' },
  gaps: { red: [], yellow: [], decidedCount: 0, naCount: 0 },
  startpaket: {
    decisionLog: '# log',
    conventions: { filename: '.cursorrules', content: '# rules' },
    envExample: 'KEY=',
  },
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/preflight/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Helper: build a chainable supabaseAdmin mock that resolves .single()
function buildInsertMock(returnValue: { data: unknown; error: unknown }) {
  const singleMock  = vi.fn().mockResolvedValue(returnValue)
  const selectMock  = vi.fn().mockReturnValue({ single: singleMock })
  const insertMock  = vi.fn().mockReturnValue({ select: selectMock })
  mockSupabaseAdmin.from = vi.fn().mockReturnValue({ insert: insertMock })
  return { insertMock, selectMock, singleMock }
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
    mockRunPreflight.mockRejectedValue(
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
  it('returns 200 with gaps, startpaket, and runId on success', async () => {
    mockGetAuthUser.mockResolvedValue(FAKE_USER)
    mockCheckBudget.mockResolvedValue({ allowed: true })
    mockRunPreflight.mockResolvedValue(FAKE_RESULT)
    const { insertMock } = buildInsertMock({ data: { id: 'run-789' }, error: null })

    const res = await POST(makeRequest({ input: 'This is a sufficiently long design document', pivots: FAKE_PIVOTS }))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('gaps')
    expect(body).toHaveProperty('startpaket')
    expect(body).toHaveProperty('runId', 'run-789')

    // Verify insert was called with the right table / shape
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('preflight_runs')
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: FAKE_USER.organization_id,
        user_id: FAKE_USER.id,
        input_text: 'This is a sufficiently long design document',
      })
    )
  })

  // ------------------------------------------------------------------
  // gaps / startpaket forwarded verbatim from runPreflight
  // ------------------------------------------------------------------
  it('forwards the exact gaps and startpaket from runPreflight', async () => {
    mockGetAuthUser.mockResolvedValue(FAKE_USER)
    mockCheckBudget.mockResolvedValue({ allowed: true })
    mockRunPreflight.mockResolvedValue(FAKE_RESULT)
    buildInsertMock({ data: { id: 'run-001' }, error: null })

    const res = await POST(makeRequest({ input: 'A design doc with meaningful content here', pivots: FAKE_PIVOTS }))
    const body = await res.json()

    expect(body.gaps).toEqual(FAKE_RESULT.gaps)
    expect(body.startpaket).toEqual(FAKE_RESULT.startpaket)
  })
})
