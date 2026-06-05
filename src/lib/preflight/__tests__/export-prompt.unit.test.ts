// src/lib/preflight/__tests__/export-prompt.unit.test.ts
import { describe, it, expect } from 'vitest'
import { buildDecisionPrompt } from '../export-prompt'
import type { PreflightResult } from '../types'

const RESULT: PreflightResult = {
  summary: {
    projectLabel: 'Next.js-LMS mit Supabase',
    headline: 'Du hast 2 offene Blocker und 3 geparkte Entscheidungen.',
  },
  gaps: {
    red: [
      {
        id: 'U1',
        domain: 'Auth',
        frage: 'Wie werden Nutzer authentifiziert?',
        warum: 'Ohne Auth-Strategie kein sicheres Login.',
        default: 'Supabase Auth mit Magic Link',
        kosten: 'red',
        plain: 'Du hast noch keine Auth-Methode festgelegt.',
        action: 'Entscheide dich für Supabase Auth mit Magic Link oder OAuth.',
      },
    ],
    yellow: [
      {
        id: 'P1',
        domain: 'Performance',
        frage: 'Welche Caching-Strategie verwendest du?',
        warum: 'Ohne Caching werden Serverkosten hoch.',
        default: 'ISR mit 60s revalidation',
        kosten: 'yellow',
      },
    ],
    decidedCount: 3,
    naCount: 1,
  },
  startpaket: {
    decisionLog: '# Decision Log\n...',
    conventions: { filename: 'CLAUDE.md', content: '# CLAUDE.md\n...' },
    envExample: 'NEXT_PUBLIC_SUPABASE_URL=\n',
  },
}

describe('buildDecisionPrompt', () => {
  it('enthält den projectLabel', () => {
    const prompt = buildDecisionPrompt(RESULT)
    expect(prompt).toContain('Next.js-LMS mit Supabase')
  })

  it('enthält den "Zuerst entscheiden"-Header', () => {
    const prompt = buildDecisionPrompt(RESULT)
    expect(prompt).toContain('## Zuerst entscheiden')
  })

  it('enthält die frage des roten Gaps', () => {
    const prompt = buildDecisionPrompt(RESULT)
    expect(prompt).toContain('Wie werden Nutzer authentifiziert?')
  })

  it('enthält das plain-Feld des roten Gaps', () => {
    const prompt = buildDecisionPrompt(RESULT)
    expect(prompt).toContain('Du hast noch keine Auth-Methode festgelegt.')
  })

  it('enthält die action des roten Gaps', () => {
    const prompt = buildDecisionPrompt(RESULT)
    expect(prompt).toContain('Entscheide dich für Supabase Auth mit Magic Link oder OAuth.')
  })

  it('enthält den "Kann später"-Abschnitt wenn yellow-Gaps vorhanden', () => {
    const prompt = buildDecisionPrompt(RESULT)
    expect(prompt).toContain('## Kann später')
    expect(prompt).toContain('Welche Caching-Strategie verwendest du?')
  })

  it('lässt "Kann später" weg wenn keine yellow-Gaps', () => {
    const noYellow: PreflightResult = {
      ...RESULT,
      gaps: { ...RESULT.gaps, yellow: [] },
    }
    const prompt = buildDecisionPrompt(noYellow)
    expect(prompt).not.toContain('## Kann später')
  })

  it('lässt "Zuerst entscheiden" weg wenn keine red-Gaps', () => {
    const noRed: PreflightResult = {
      ...RESULT,
      gaps: { ...RESULT.gaps, red: [] },
    }
    const prompt = buildDecisionPrompt(noRed)
    expect(prompt).not.toContain('## Zuerst entscheiden')
  })

  it('fällt bei fehlendem plain auf warum zurück', () => {
    const withoutPlain: PreflightResult = {
      ...RESULT,
      gaps: {
        ...RESULT.gaps,
        red: [{ ...RESULT.gaps.red[0], plain: undefined }],
      },
    }
    const prompt = buildDecisionPrompt(withoutPlain)
    expect(prompt).toContain('Ohne Auth-Strategie kein sicheres Login.')
  })

  it('fällt bei fehlender action auf default zurück', () => {
    const withoutAction: PreflightResult = {
      ...RESULT,
      gaps: {
        ...RESULT.gaps,
        red: [{ ...RESULT.gaps.red[0], action: undefined }],
      },
    }
    const prompt = buildDecisionPrompt(withoutAction)
    expect(prompt).toContain('Supabase Auth mit Magic Link')
  })
})
