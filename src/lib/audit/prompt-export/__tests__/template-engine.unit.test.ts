import { describe, it, expect } from 'vitest'
import { buildFixPrompt, buildGroupFixPrompt } from '../template-engine'
import type { PromptFinding } from '../types'

function makeFinding(overrides: Partial<PromptFinding> = {}): PromptFinding {
  return {
    ruleId: 'cat-1-rule-4',
    severity: 'high',
    message: 'Datei überschreitet 500 Zeilen',
    filePath: 'src/components/BigComponent.tsx',
    line: 1,
    suggestion: 'Teile die Datei in kleinere Einheiten auf.',
    ...overrides,
  }
}

describe('buildFixPrompt', () => {
  it('includes the finding message in the output', () => {
    const result = buildFixPrompt(makeFinding(), 'generic')
    expect(result.content).toContain('Datei überschreitet 500 Zeilen')
  })

  it('includes the file path in output', () => {
    const result = buildFixPrompt(makeFinding(), 'generic')
    expect(result.content).toContain('src/components/BigComponent.tsx')
  })

  it('cursor variant uses @-style file references', () => {
    const result = buildFixPrompt(makeFinding(), 'cursor')
    expect(result.content).toContain('@src/components/BigComponent.tsx')
  })

  it('claude-code variant mentions CLAUDE.md and Read-Tool', () => {
    const result = buildFixPrompt(makeFinding(), 'claude-code')
    expect(result.content).toContain('CLAUDE.md')
    expect(result.content).toContain('Read-Tool')
  })

  it('generic variant is self-contained (no @-refs)', () => {
    const result = buildFixPrompt(makeFinding(), 'generic')
    expect(result.content).not.toMatch(/@src\//)
  })

  it('includes structured sections', () => {
    const result = buildFixPrompt(makeFinding(), 'generic')
    expect(result.content).toContain('## Problem')
    expect(result.content).toContain('## Wo')
    expect(result.content).toContain('## Was zu tun ist')
    expect(result.content).toContain('## Validierung')
  })

  it('includes recommendation strategy for known rule IDs', () => {
    const result = buildFixPrompt(makeFinding({ ruleId: 'cat-1-rule-4' }), 'generic')
    // cat-1-rule-4 has a known recommendation about file size
    expect(result.content).toContain('Erster Schritt')
  })

  it('returns fileRefs with affected files', () => {
    const finding = makeFinding({
      affectedFiles: ['src/a.ts', 'src/b.ts'],
    })
    const result = buildFixPrompt(finding, 'generic')
    expect(result.fileRefs).toContain('src/components/BigComponent.tsx')
    expect(result.fileRefs).toContain('src/a.ts')
    expect(result.fileRefs).toContain('src/b.ts')
  })

  it('handles finding without file path (project-wide finding)', () => {
    const finding = makeFinding({ filePath: null, line: null })
    const result = buildFixPrompt(finding, 'generic')
    expect(result.content).toContain('projektübergreifend')
  })

  it('shows fixHint when provided', () => {
    const finding = makeFinding({ fixHint: 'Check all migration files' })
    const result = buildFixPrompt(finding, 'generic')
    expect(result.content).toContain('Check all migration files')
  })

  it('includes security validation check for security findings', () => {
    const finding = makeFinding({ agentSource: 'security', ruleId: 'cat-3-rule-15' })
    const result = buildFixPrompt(finding, 'generic')
    expect(result.content).toContain('Security-relevant')
  })

  it('returns a non-empty title', () => {
    const result = buildFixPrompt(makeFinding(), 'generic')
    expect(result.title.length).toBeGreaterThan(0)
  })
})

describe('buildGroupFixPrompt', () => {
  it('produces a prompt mentioning all affected files', () => {
    const result = buildGroupFixPrompt(
      'cat-1-rule-4',
      'Datei zu lang',
      ['src/a.ts', 'src/b.ts', 'src/c.ts'],
      'generic',
    )
    expect(result.content).toContain('src/a.ts')
    expect(result.content).toContain('src/b.ts')
  })
})
