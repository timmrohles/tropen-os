// Integration test: fix prompt export pipeline (no LLM — deterministic)
import { describe, it, expect } from 'vitest'
import { buildFixPrompt, buildGroupFixPrompt } from '../prompt-export/index'
import type { PromptFinding } from '../prompt-export/types'

const SAMPLE_FINDING: PromptFinding = {
  ruleId: 'cat-1-rule-4',
  severity: 'high',
  message: 'File size violation: src/lib/service.ts has 550 lines (limit: 500)',
  filePath: 'src/lib/service.ts',
  line: null,
  suggestion: 'Split into smaller focused modules',
  fixType: 'refactoring',
}

const SECURITY_FINDING: PromptFinding = {
  ruleId: 'cat-3-rule-2',
  severity: 'high',
  message: 'Missing input validation in API route',
  filePath: 'src/app/api/users/route.ts',
  suggestion: 'Add Zod schema validation before business logic',
  fixType: 'code-fix',
}

describe('Integration: fix prompt export pipeline', () => {
  it('generates a non-empty cursor prompt for a finding', () => {
    const prompt = buildFixPrompt(SAMPLE_FINDING, 'cursor')
    expect(prompt.content).toBeTruthy()
    expect(prompt.content.length).toBeGreaterThan(100)
    expect(prompt.tool).toBe('cursor')
    expect(typeof prompt.title).toBe('string')
  })

  it('generates a claude-code prompt with different tone than cursor', () => {
    const cursorPrompt = buildFixPrompt(SAMPLE_FINDING, 'cursor')
    const claudePrompt = buildFixPrompt(SAMPLE_FINDING, 'claude-code')
    expect(claudePrompt.content).toBeTruthy()
    // Both should reference the file
    expect(cursorPrompt.content).toContain('src/lib/service.ts')
    expect(claudePrompt.content).toContain('src/lib/service.ts')
  })

  it('includes the file path in fileRefs', () => {
    const prompt = buildFixPrompt(SAMPLE_FINDING, 'cursor')
    expect(prompt.fileRefs).toContain('src/lib/service.ts')
  })

  it('generates valid prompt for security finding', () => {
    const prompt = buildFixPrompt(SECURITY_FINDING, 'claude-code')
    expect(prompt.content).toBeTruthy()
    expect(prompt.content).toContain('src/app/api/users/route.ts')
  })

  it('generates group prompt for multiple related findings', () => {
    const affectedFiles = ['src/lib/service.ts', 'src/lib/other.ts']
    const prompt = buildGroupFixPrompt('cat-1-rule-4', 'Large files in lib/', affectedFiles, 'cursor')
    expect(prompt.content).toBeTruthy()
    expect(prompt.content.length).toBeGreaterThan(50)
  })

  it('produces deterministic output for the same input', () => {
    const p1 = buildFixPrompt(SAMPLE_FINDING, 'cursor')
    const p2 = buildFixPrompt(SAMPLE_FINDING, 'cursor')
    expect(p1.content).toBe(p2.content)
    expect(p1.title).toBe(p2.title)
  })

  it('handles finding without file path gracefully', () => {
    const finding: PromptFinding = { ...SAMPLE_FINDING, filePath: null }
    const prompt = buildFixPrompt(finding, 'generic')
    expect(prompt.content).toBeTruthy()
  })
})
