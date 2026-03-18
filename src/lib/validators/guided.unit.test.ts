import { describe, it, expect } from 'vitest'
import { detectInputSchema, resolveInputSchema, patchGuidedSettingsSchema } from './guided'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440001'
const VALID_UUID2 = '550e8400-e29b-41d4-a716-446655440002'

describe('detectInputSchema', () => {
  it('accepts valid new_chat context', () => {
    const r = detectInputSchema.safeParse({
      message: 'Ich weiß nicht wo ich anfangen soll',
      context: 'new_chat',
      userId:  VALID_UUID,
    })
    expect(r.success).toBe(true)
  })

  it('rejects short message', () => {
    const r = detectInputSchema.safeParse({
      message: 'hi',
      context: 'new_chat',
      userId:  VALID_UUID,
    })
    expect(r.success).toBe(false)
  })

  it('accepts explicit context', () => {
    const r = detectInputSchema.safeParse({
      message: 'Ich brauche Hilfe bei meinem Projekt',
      context: 'explicit',
      userId:  VALID_UUID,
    })
    expect(r.success).toBe(true)
  })

  it('rejects invalid context', () => {
    const r = detectInputSchema.safeParse({
      message: 'Ich brauche Hilfe bei meinem Projekt',
      context: 'unknown_context',
      userId:  VALID_UUID,
    })
    expect(r.success).toBe(false)
  })
})

describe('resolveInputSchema', () => {
  it('accepts valid input', () => {
    const r = resolveInputSchema.safeParse({
      workflowId: VALID_UUID,
      optionId:   VALID_UUID2,
    })
    expect(r.success).toBe(true)
  })

  it('defaults previousSelections to empty array', () => {
    const r = resolveInputSchema.safeParse({
      workflowId: VALID_UUID,
      optionId:   VALID_UUID2,
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.previousSelections).toEqual([])
  })
})

describe('patchGuidedSettingsSchema', () => {
  it('accepts partial input', () => {
    const r = patchGuidedSettingsSchema.safeParse({ guided_enabled: false })
    expect(r.success).toBe(true)
  })

  it('accepts empty object', () => {
    const r = patchGuidedSettingsSchema.safeParse({})
    expect(r.success).toBe(true)
  })
})
