import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDeepFix } from '@/hooks/useDeepFix'
import type { ConsensusFixData } from '@/hooks/useDeepFix'

const MOCK_FIX: ConsensusFixData = {
  fixId: 'fix-1',
  explanation: 'Replace N+1 query with a JOIN',
  confidence: 'high',
  model: 'claude-opus-4.6',
  costEur: 0.042,
  judgeExplanation: 'All three models agreed on a JOIN-based solution.',
  drafts: [
    { providerId: 'anthropic/claude-sonnet-4.6', explanation: 'Use JOIN', confidence: 'high', costEur: 0.01 },
    { providerId: 'openai/gpt-5.4', explanation: 'Use JOIN', confidence: 'high', costEur: 0.01 },
  ],
  riskLevel: 'safe',
  riskReasons: [],
  status: 'pending',
}

function makeFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_FIX_ENGINE_ENABLED', 'true')
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('useDeepFix', () => {
  it('starts in idle state', () => {
    global.fetch = makeFetch(200, MOCK_FIX)
    const { result } = renderHook(() => useDeepFix('finding-1', 'run-1'))
    expect(result.current.state).toBe('idle')
    expect(result.current.data).toBeNull()
    expect(result.current.expanded).toBe(false)
  })

  it('serves cached fix from GET and moves to ready+expanded', async () => {
    global.fetch = makeFetch(200, MOCK_FIX)

    const { result } = renderHook(() => useDeepFix('finding-1', 'run-1'))

    await act(async () => {
      await result.current.trigger()
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('findingId=finding-1')
    expect(result.current.state).toBe('ready')
    expect(result.current.expanded).toBe(true)
    expect(result.current.data?.fixId).toBe('fix-1')
  })

  it('falls through to POST on 404 and sets ready on success', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(MOCK_FIX) })
    global.fetch = fetchMock

    const { result } = renderHook(() => useDeepFix('finding-2', 'run-1'))

    await act(async () => {
      await result.current.trigger()
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [, postCall] = fetchMock.mock.calls
    expect(postCall[1]?.method).toBe('POST')
    expect(result.current.state).toBe('ready')
    expect(result.current.data?.fixId).toBe('fix-1')
  })

  it('sets error state on non-404 GET failure', async () => {
    global.fetch = makeFetch(500, { error: 'Internal server error' })

    const { result } = renderHook(() => useDeepFix('finding-3', 'run-1'))

    await act(async () => {
      await result.current.trigger()
    })

    expect(result.current.state).toBe('error')
    expect(result.current.errorMessage).toBe('Internal server error')
    expect(result.current.data).toBeNull()
  })

  it('toggles expanded on subsequent trigger when ready, without re-fetching', async () => {
    global.fetch = makeFetch(200, MOCK_FIX)

    const { result } = renderHook(() => useDeepFix('finding-4', 'run-1'))

    await act(async () => {
      await result.current.trigger()
    })

    expect(result.current.expanded).toBe(true)

    await act(async () => {
      await result.current.trigger()
    })

    expect(result.current.expanded).toBe(false)
    // fetch still only called once — no re-fetch on toggle
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
  })
})
