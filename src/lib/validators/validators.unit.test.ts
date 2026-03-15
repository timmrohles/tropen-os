import { describe, it, expect } from 'vitest'
import { createProjectSchema, updateProjectSchema } from './projects'
import { createArtifactSchema } from './artifacts'
import { createPromptTemplateSchema, updatePromptTemplateSchema } from './prompt-templates'

// ── Projects ────────────────────────────────────────────────────────────────

describe('createProjectSchema', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000'

  it('akzeptiert valide Eingabe', () => {
    const result = createProjectSchema.safeParse({ department_id: validId, title: 'Mein Projekt' })
    expect(result.success).toBe(true)
  })

  it('akzeptiert optionale Felder', () => {
    const result = createProjectSchema.safeParse({
      department_id: validId,
      title: 'Projekt',
      goal: 'Ein Ziel',
      instructions: 'Anweisungen',
    })
    expect(result.success).toBe(true)
  })

  it('lehnt leeren Titel ab', () => {
    const result = createProjectSchema.safeParse({ department_id: validId, title: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Titel erforderlich')
  })

  it('lehnt ungültige UUID ab', () => {
    const result = createProjectSchema.safeParse({ department_id: 'nicht-uuid', title: 'Projekt' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('department_id muss eine UUID sein')
  })

  it('lehnt title > 255 Zeichen ab', () => {
    const result = createProjectSchema.safeParse({ department_id: validId, title: 'a'.repeat(256) })
    expect(result.success).toBe(false)
  })

  it('lehnt goal > 2000 Zeichen ab', () => {
    const result = createProjectSchema.safeParse({
      department_id: validId,
      title: 'Projekt',
      goal: 'x'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('lehnt instructions > 5000 Zeichen ab', () => {
    const result = createProjectSchema.safeParse({
      department_id: validId,
      title: 'Projekt',
      instructions: 'x'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })
})

describe('updateProjectSchema', () => {
  it('erlaubt leeres Objekt (alle Felder optional)', () => {
    const result = updateProjectSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('akzeptiert partielles Update', () => {
    const result = updateProjectSchema.safeParse({ title: 'Neuer Titel' })
    expect(result.success).toBe(true)
  })

  it('lehnt leeren title ab', () => {
    const result = updateProjectSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })
})

// ── Artifacts ────────────────────────────────────────────────────────────────

describe('createArtifactSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000'
  const base = {
    conversationId: validUuid,
    organizationId: validUuid,
    name: 'Mein Artefakt',
    type: 'code' as const,
    content: 'console.log("hello")',
  }

  it('akzeptiert valide Eingabe', () => {
    expect(createArtifactSchema.safeParse(base).success).toBe(true)
  })

  it('akzeptiert alle erlaubten Typen', () => {
    const types = ['code', 'document', 'data', 'image', 'other'] as const
    for (const type of types) {
      expect(createArtifactSchema.safeParse({ ...base, type }).success).toBe(true)
    }
  })

  it('lehnt unbekannten Typ ab', () => {
    const result = createArtifactSchema.safeParse({ ...base, type: 'video' })
    expect(result.success).toBe(false)
  })

  it('lehnt leeren content ab', () => {
    expect(createArtifactSchema.safeParse({ ...base, content: '' }).success).toBe(false)
  })

  it('lehnt leeren name ab', () => {
    expect(createArtifactSchema.safeParse({ ...base, name: '' }).success).toBe(false)
  })

  it('lehnt ungültige conversationId UUID ab', () => {
    const result = createArtifactSchema.safeParse({ ...base, conversationId: 'nicht-uuid' })
    expect(result.success).toBe(false)
  })

  it('akzeptiert optionales messageId', () => {
    const result = createArtifactSchema.safeParse({ ...base, messageId: validUuid })
    expect(result.success).toBe(true)
  })

  it('akzeptiert optionale language', () => {
    const result = createArtifactSchema.safeParse({ ...base, language: 'typescript' })
    expect(result.success).toBe(true)
  })
})

// ── Prompt Templates ─────────────────────────────────────────────────────────

describe('createPromptTemplateSchema', () => {
  const base = { name: 'Vorlage 1', content: 'Schreibe einen Text über {{thema}}.' }

  it('akzeptiert valide Eingabe', () => {
    expect(createPromptTemplateSchema.safeParse(base).success).toBe(true)
  })

  it('setzt is_shared standardmäßig auf false', () => {
    const result = createPromptTemplateSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.is_shared).toBe(false)
  })

  it('erlaubt is_shared: true', () => {
    const result = createPromptTemplateSchema.safeParse({ ...base, is_shared: true })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.is_shared).toBe(true)
  })

  it('lehnt leeren name ab', () => {
    expect(createPromptTemplateSchema.safeParse({ ...base, name: '' }).success).toBe(false)
  })

  it('lehnt leeren content ab', () => {
    expect(createPromptTemplateSchema.safeParse({ ...base, content: '' }).success).toBe(false)
  })

  it('lehnt name > 255 Zeichen ab', () => {
    expect(createPromptTemplateSchema.safeParse({ ...base, name: 'x'.repeat(256) }).success).toBe(false)
  })

  it('lehnt content > 10000 Zeichen ab', () => {
    expect(createPromptTemplateSchema.safeParse({ ...base, content: 'x'.repeat(10001) }).success).toBe(false)
  })
})

describe('updatePromptTemplateSchema', () => {
  it('erlaubt leeres Objekt', () => {
    expect(updatePromptTemplateSchema.safeParse({}).success).toBe(true)
  })

  it('akzeptiert partielles Update', () => {
    expect(updatePromptTemplateSchema.safeParse({ name: 'Neu' }).success).toBe(true)
  })
})
