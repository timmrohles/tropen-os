import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/capability-resolver', () => ({
  resolveWorkflow: vi.fn(),
}))

import { supabaseAdmin } from '@/lib/supabase-admin'
import { resolveWorkflow } from '@/lib/capability-resolver'
import {
  scoreKeywords,
  buildWorkflowPrompt,
  detectWorkflow,
  resolveOption,
} from './guided-workflow-engine'

const WF_ID   = '00000000-0000-0000-0000-000000000001'
const OPT_ID  = '00000000-0000-0000-0000-000000000002'
const USER_ID = '00000000-0000-0000-0000-000000000003'
const ORG_ID  = '00000000-0000-0000-0000-000000000004'
const NEXT_WF = '00000000-0000-0000-0000-000000000005'
const CAP_ID  = '00000000-0000-0000-0000-000000000006'
const OUT_ID  = '00000000-0000-0000-0000-000000000007'

const fromMock = supabaseAdmin.from as ReturnType<typeof vi.fn>

// ── scoreKeywords ─────────────────────────────────────────────────────────────

describe('scoreKeywords', () => {
  it('returns 0 for empty keyword list', () => {
    expect(scoreKeywords('ich brauche hilfe', [])).toBe(0)
  })

  it('returns 0 when no keyword matches', () => {
    expect(scoreKeywords('ich brauche hilfe', ['marketing', 'strategie'])).toBe(0)
  })

  it('returns 1 for a single keyword match', () => {
    expect(scoreKeywords('ich brauche hilfe bei meinem marketing', ['marketing'])).toBe(1)
  })

  it('returns count of all matched keywords (case-insensitive)', () => {
    expect(scoreKeywords('Ich brauche Marketing Hilfe für meine Strategie', [
      'marketing', 'strategie', 'inhalt',
    ])).toBe(2)
  })
})

// ── buildWorkflowPrompt ───────────────────────────────────────────────────────

describe('buildWorkflowPrompt', () => {
  it('joins non-null parts with double newline', () => {
    const result = buildWorkflowPrompt({
      workflowSystemPrompt: 'Workflow-Prompt.',
      capabilityInjection:  'Capability-Injection.',
      outcomeInjection:     'Outcome-Injection.',
      previousSelections:   [],
    })
    expect(result).toContain('Capability-Injection.')
    expect(result).toContain('Workflow-Prompt.')
    expect(result).toContain('Outcome-Injection.')
    // Order: capability → workflow → outcome
    expect(result.indexOf('Capability-Injection.')).toBeLessThan(result.indexOf('Workflow-Prompt.'))
    expect(result.indexOf('Workflow-Prompt.')).toBeLessThan(result.indexOf('Outcome-Injection.'))
  })

  it('appends previous selections context when present', () => {
    const result = buildWorkflowPrompt({
      workflowSystemPrompt: null,
      capabilityInjection:  null,
      outcomeInjection:     null,
      previousSelections:   ['Marketing', 'Strategie'],
    })
    expect(result).toContain('Marketing')
    expect(result).toContain('Strategie')
    expect(result).toContain('Kontext aus Benutzerauswahl')
  })

  it('returns empty string when all inputs are null and no selections', () => {
    const result = buildWorkflowPrompt({
      workflowSystemPrompt: null,
      capabilityInjection:  null,
      outcomeInjection:     null,
      previousSelections:   [],
    })
    expect(result).toBe('')
  })
})

// ── detectWorkflow ────────────────────────────────────────────────────────────

describe('detectWorkflow', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns null when guided_enabled is false', async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({
        data: { guided_enabled: false, auto_trigger: true, new_project_trigger: true },
        error: null,
      }) }) }),
    })

    const result = await detectWorkflow({
      message: 'Ich weiß nicht wo ich anfangen soll',
      context: 'new_chat',
      userId:  USER_ID,
    })

    expect(result).toBeNull()
  })

  it('returns null when no workflows match', async () => {
    fromMock
      // settings
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({
          data: { guided_enabled: true, auto_trigger: true, new_project_trigger: true },
          error: null,
        }) }) }),
      })
      // workflows — empty list
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ in: () => ({ order: () => Promise.resolve({
          data: [],
          error: null,
        }) }) }) }),
      })

    const result = await detectWorkflow({
      message: 'Ich weiß nicht wo ich anfangen soll',
      context: 'new_chat',
      userId:  USER_ID,
    })

    expect(result).toBeNull()
  })

  it('returns workflow with options for explicit context (first match wins)', async () => {
    const mockWf = {
      id: WF_ID,
      title: 'Gesprächseinstieg',
      subtitle: 'Wie kann ich helfen?',
      trigger_keywords: [],
      trigger_contexts: ['explicit'],
      scope: 'system',
      is_active: true,
    }
    const mockOptions = [
      { id: OPT_ID, label: 'Option A', description: null, emoji: null,
        capability_id: null, outcome_id: null, next_workflow_id: null,
        system_prompt: null, sort_order: 0, is_custom: false },
    ]

    fromMock
      // settings
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({
          data: { guided_enabled: true, auto_trigger: true, new_project_trigger: true },
          error: null,
        }) }) }),
      })
      // workflows
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ in: () => ({ order: () => Promise.resolve({
          data: [mockWf],
          error: null,
        }) }) }) }),
      })
      // options
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ order: () => Promise.resolve({
          data: mockOptions,
          error: null,
        }) }) }),
      })

    const result = await detectWorkflow({
      message: 'Hallo',
      context: 'explicit',
      userId:  USER_ID,
    })

    expect(result).not.toBeNull()
    expect(result!.id).toBe(WF_ID)
    expect(result!.title).toBe('Gesprächseinstieg')
    expect(result!.options).toHaveLength(1)
  })
})

// ── resolveOption ─────────────────────────────────────────────────────────────

describe('resolveOption', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns custom_input for is_custom option', async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({
        data: { id: OPT_ID, is_custom: true, label: 'Eigene Eingabe',
                next_workflow_id: null, capability_id: null, outcome_id: null,
                system_prompt: null },
        error: null,
      }) }) }) }),
    })

    const result = await resolveOption(WF_ID, OPT_ID, USER_ID, ORG_ID)
    expect(result.type).toBe('custom_input')
  })

  it('returns save_artifact for "In Wissenbasis speichern" label', async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({
        data: { id: OPT_ID, is_custom: false, label: 'In Wissenbasis speichern',
                next_workflow_id: null, capability_id: null, outcome_id: null,
                system_prompt: null },
        error: null,
      }) }) }) }),
    })

    const result = await resolveOption(WF_ID, OPT_ID, USER_ID, ORG_ID)
    expect(result.type).toBe('save_artifact')
  })

  it('returns next_workflow when next_workflow_id is set', async () => {
    const mockNextWf = {
      id: NEXT_WF,
      title: 'Entscheidungs-Sub',
      subtitle: null,
      trigger_contexts: ['explicit'],
    }
    const mockNextOptions = [
      { id: OPT_ID, label: 'Sub-Option', description: null, emoji: null,
        capability_id: null, outcome_id: null, next_workflow_id: null,
        system_prompt: null, sort_order: 0, is_custom: false },
    ]

    fromMock
      // load option
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({
          data: { id: OPT_ID, is_custom: false, label: 'Weiter',
                  next_workflow_id: NEXT_WF, capability_id: null, outcome_id: null,
                  system_prompt: null },
          error: null,
        }) }) }) }),
      })
      // load next workflow
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({
          data: mockNextWf,
          error: null,
        }) }) }),
      })
      // load next workflow options
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ order: () => Promise.resolve({
          data: mockNextOptions,
          error: null,
        }) }) }),
      })

    const result = await resolveOption(WF_ID, OPT_ID, USER_ID, ORG_ID)
    expect(result.type).toBe('next_workflow')
    if (result.type === 'next_workflow') {
      expect(result.workflow.id).toBe(NEXT_WF)
      expect(result.workflow.options).toHaveLength(1)
    }
  })

  it('returns capability_plan when capability_id + outcome_id are set', async () => {
    const mockPlan = {
      available: true,
      model_id: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
      system_prompt: 'Du bist Experte.',
      tools: [],
      card_type: 'text',
      estimated_cost_per_1k: 0.003,
      budget_ok: true,
      capability_id: CAP_ID,
      outcome_id: OUT_ID,
      resolved_model_uuid: '00000000-0000-0000-0000-000000000009',
    }
    ;(resolveWorkflow as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockPlan)

    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({
        data: { id: OPT_ID, is_custom: false, label: 'Analyse',
                next_workflow_id: null, capability_id: CAP_ID, outcome_id: OUT_ID,
                system_prompt: null },
        error: null,
      }) }) }) }),
    })

    const result = await resolveOption(WF_ID, OPT_ID, USER_ID, ORG_ID)
    expect(result.type).toBe('capability_plan')
    if (result.type === 'capability_plan') {
      expect(result.plan.available).toBe(true)
      expect(result.plan.model_id).toBe('claude-sonnet-4-20250514')
    }
  })

  it('throws when option not found', async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({
        data: null,
        error: { message: 'not found' },
      }) }) }) }),
    })

    await expect(resolveOption(WF_ID, OPT_ID, USER_ID, ORG_ID))
      .rejects.toThrow('Option not found')
  })
})
