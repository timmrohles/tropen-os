import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  resolveWorkflow,
  getValidOutcomes,
  getDefaultOutcome,
  resolveCardType,
} from './capability-resolver'

const CAP_ID   = '00000000-0000-0000-0000-000000000001'
const OUT_ID   = '00000000-0000-0000-0000-000000000002'
const USER_ID  = '00000000-0000-0000-0000-000000000003'
const ORG_ID   = '00000000-0000-0000-0000-000000000004'
const MODEL_ID = '00000000-0000-0000-0000-000000000005'

const mockCapability = {
  id: CAP_ID,
  capability_type: 'search',
  label: 'Recherche',
  system_prompt_injection: 'Du bist Recherche-Experte.',
  tools: ['web_search'],
  default_model_id: MODEL_ID,
}

const mockOutcome = {
  id: OUT_ID,
  output_type: 'text',
  card_type: 'text',
  system_prompt_injection: 'Antworte als Fließtext.',
}

const mockModel = {
  id: MODEL_ID,
  name: 'claude-sonnet-4-5',
  api_model_id: 'claude-sonnet-4-20250514',
  provider: 'anthropic',
  cost_per_1k_input: 0.003,
  cost_per_1k_output: 0.015,
  context_window: 200000,
}

const fromMock = supabaseAdmin.from as ReturnType<typeof vi.fn>

describe('resolveCardType', () => {
  it('returns text for text output_type', () => {
    expect(resolveCardType('text')).toBe('text')
  })
  it('returns kanban for action_plan', () => {
    expect(resolveCardType('action_plan')).toBe('kanban')
  })
  it('returns code for code', () => {
    expect(resolveCardType('code')).toBe('code')
  })
  it('falls back to text for unknown type', () => {
    expect(resolveCardType('unknown')).toBe('text')
  })
})

describe('resolveWorkflow', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns correct plan for basic capability + outcome (no org/user overrides)', async () => {
    fromMock
      // capabilities
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockCapability, error: null }) }) }),
      })
      // outcomes
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockOutcome, error: null }) }) }),
      })
      // capability_org_settings (no override)
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
      })
      // user_capability_settings (no override)
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
      })
      // model_catalog
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockModel, error: null }) }) }),
      })

    const plan = await resolveWorkflow(CAP_ID, OUT_ID, USER_ID, ORG_ID)

    expect(plan.available).toBe(true)
    expect(plan.model_id).toBe('claude-sonnet-4-20250514')
    expect(plan.provider).toBe('anthropic')
    expect(plan.tools).toContain('web_search')
    expect(plan.system_prompt).toContain('Du bist Recherche-Experte.')
    expect(plan.system_prompt).toContain('Antworte als Fließtext.')
    expect(plan.card_type).toBe('text')
    expect(plan.budget_ok).toBe(true)
    expect(plan.capability_id).toBe(CAP_ID)
    expect(plan.outcome_id).toBe(OUT_ID)
  })

  it('returns unavailable plan when capability has no model (e.g. Confidential)', async () => {
    const capNoModel = { ...mockCapability, default_model_id: null }

    fromMock
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: capNoModel, error: null }) }) }),
      })
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockOutcome, error: null }) }) }),
      })
      // org settings — no override either
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
      })
      // user settings
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
      })

    const plan = await resolveWorkflow(CAP_ID, OUT_ID, USER_ID, ORG_ID)

    expect(plan.available).toBe(false)
    expect(plan.unavailable_reason).toBe('no_eu_model')
    expect(plan.model_id).toBe('')
  })

  it('throws when capability not found', async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'not found' } }) }) }),
    })

    await expect(resolveWorkflow(CAP_ID, OUT_ID, USER_ID, ORG_ID))
      .rejects.toThrow('Capability not found')
  })
})

describe('getValidOutcomes', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns outcomes for a capability', async () => {
    const mockRows = [
      { outcome_id: OUT_ID, is_default: true, sort_order: 0, outcomes: mockOutcome },
    ]
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: mockRows, error: null }) }) }),
    })

    const result = await getValidOutcomes(CAP_ID)
    expect(result).toHaveLength(1)
    expect(result[0].outcome_id).toBe(OUT_ID)
  })

  it('throws on DB error', async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: null, error: { message: 'db error' } }) }) }),
    })

    await expect(getValidOutcomes(CAP_ID)).rejects.toThrow('Failed to load valid outcomes')
  })
})

describe('getDefaultOutcome', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns default outcome', async () => {
    const mockRow = { outcome_id: OUT_ID, outcomes: mockOutcome }
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockRow, error: null }) }) }) }),
    })

    const result = await getDefaultOutcome(CAP_ID)
    expect(result?.outcome_id).toBe(OUT_ID)
  })

  it('returns null when no default outcome found', async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }) }) }) }),
    })

    const result = await getDefaultOutcome(CAP_ID)
    expect(result).toBeNull()
  })
})
