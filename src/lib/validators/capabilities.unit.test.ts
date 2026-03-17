import { describe, it, expect } from 'vitest'
import { resolveWorkflowInputSchema, patchSettingsInputSchema } from './capabilities'

describe('resolveWorkflowInputSchema', () => {
  it('accepts valid input', () => {
    const result = resolveWorkflowInputSchema.safeParse({
      capability_id: '550e8400-e29b-41d4-a716-446655440001',
      outcome_id:    '550e8400-e29b-41d4-a716-446655440002',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing capability_id', () => {
    const result = resolveWorkflowInputSchema.safeParse({ outcome_id: 'abc' })
    expect(result.success).toBe(false)
  })

  it('accepts optional conversation_id', () => {
    const result = resolveWorkflowInputSchema.safeParse({
      capability_id:   '550e8400-e29b-41d4-a716-446655440001',
      outcome_id:      '550e8400-e29b-41d4-a716-446655440002',
      conversation_id: '550e8400-e29b-41d4-a716-446655440003',
    })
    expect(result.success).toBe(true)
  })
})

describe('patchSettingsInputSchema', () => {
  it('accepts partial input', () => {
    const result = patchSettingsInputSchema.safeParse({
      capability_id: '550e8400-e29b-41d4-a716-446655440001',
      is_pinned: true,
    })
    expect(result.success).toBe(true)
  })
})
