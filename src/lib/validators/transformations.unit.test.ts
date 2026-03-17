import { describe, it, expect } from 'vitest'
import { analyzeSchema, createTransformationSchema, executeTransformationSchema } from './transformations'

const UUID = '550e8400-e29b-41d4-a716-446655440001'

describe('analyzeSchema', () => {
  it('accepts valid project input', () => {
    const r = analyzeSchema.safeParse({ source_type: 'project', source_id: UUID })
    expect(r.success).toBe(true)
  })
  it('accepts valid workspace input', () => {
    const r = analyzeSchema.safeParse({ source_type: 'workspace', source_id: UUID })
    expect(r.success).toBe(true)
  })
  it('rejects invalid source_type', () => {
    const r = analyzeSchema.safeParse({ source_type: 'agent', source_id: UUID })
    expect(r.success).toBe(false)
  })
  it('rejects non-uuid source_id', () => {
    const r = analyzeSchema.safeParse({ source_type: 'project', source_id: 'not-a-uuid' })
    expect(r.success).toBe(false)
  })
})

describe('createTransformationSchema', () => {
  it('accepts workspace target', () => {
    const r = createTransformationSchema.safeParse({
      source_type: 'project', source_id: UUID, target_type: 'workspace',
    })
    expect(r.success).toBe(true)
  })
  it('accepts feed target', () => {
    const r = createTransformationSchema.safeParse({
      source_type: 'project', source_id: UUID, target_type: 'feed',
    })
    expect(r.success).toBe(true)
  })
  it('accepts optional suggested_meta', () => {
    const r = createTransformationSchema.safeParse({
      source_type: 'project', source_id: UUID, target_type: 'workspace',
      suggested_meta: { title: 'Test', goal: 'Ein Ziel' },
    })
    expect(r.success).toBe(true)
  })
  it('rejects agent target (not implemented)', () => {
    const r = createTransformationSchema.safeParse({
      source_type: 'project', source_id: UUID, target_type: 'agent',
    })
    expect(r.success).toBe(false)
  })
})

describe('executeTransformationSchema', () => {
  it('accepts execute action', () => {
    const r = executeTransformationSchema.safeParse({ action: 'execute' })
    expect(r.success).toBe(true)
  })
  it('rejects wrong action', () => {
    const r = executeTransformationSchema.safeParse({ action: 'delete' })
    expect(r.success).toBe(false)
  })
})
