import { describe, it, expect } from 'vitest'
import { buildProjectIntroPrompt } from './project-intro-prompt'

describe('buildProjectIntroPrompt', () => {
  it('includes project title and memory entries', () => {
    const result = buildProjectIntroPrompt({
      projectTitle: 'Buchhandlung Businessplan',
      instructions: 'Fokus auf KMU-Zielgruppe.',
      memoryEntries: '[fact] Zielgruppe: 35-55 Jahre\n[fact] Budget: 50k EUR',
      lastMessages: [],
    })
    expect(result).toContain('Buchhandlung Businessplan')
    expect(result).toContain('Zielgruppe')
  })

  it('mentions last session context when provided', () => {
    const result = buildProjectIntroPrompt({
      projectTitle: 'Test',
      instructions: null,
      memoryEntries: null,
      lastMessages: [
        { role: 'user', content: 'Lass uns die Zielgruppe definieren.' },
        { role: 'assistant', content: 'Die Hauptzielgruppe sind 35-55-Jährige.' },
      ],
    })
    expect(result).toContain('letzte')
  })

  it('handles empty context gracefully', () => {
    const result = buildProjectIntroPrompt({
      projectTitle: 'Neues Projekt',
      instructions: null,
      memoryEntries: null,
      lastMessages: [],
    })
    expect(result.length).toBeGreaterThan(50)
    expect(result).toContain('Neues Projekt')
  })
})
