import { describe, it, expect } from 'vitest'
import { deriveCorpusTags, filterCorpus, renderBaseline } from '../render'
import { ALL_TAGS } from '../vocabulary'
import type { PreflightPivots } from '../../types'
import type { ConventionRule } from '../types'

const base: PreflightPivots = {
  buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu',
  stack: '', platform: 'web', commercialModel: 'none',
}

describe('deriveCorpusTags', () => {
  it('Next.js + Supabase → react/next + db + auth', () => {
    const tags = deriveCorpusTags({ ...base, stack: 'Next.js + Supabase' }, [])
    expect(tags).toContain('stack:react')
    expect(tags).toContain('stack:next')
    expect(tags).toContain('db:true')
    expect(tags).toContain('auth:true')
    expect(tags).toContain('platform:web')
  })
  it('native + shop → platform:native + commerce', () => {
    const tags = deriveCorpusTags({ ...base, platform: 'native', commercialModel: 'shop' }, [])
    expect(tags).toContain('platform:native')
    expect(tags).toContain('commerce:true')
  })
  it('leerer Stack → keine stack/db-Tags', () => {
    const tags = deriveCorpusTags(base, [])
    expect(tags.some(t => t.startsWith('stack:'))).toBe(false)
    expect(tags).not.toContain('db:true')
  })
  it('erkennt erweiterte Stacks', () => {
    const t = (stack: string) => deriveCorpusTags({ ...base, stack }, [])
    expect(t('Astro + Tailwind')).toContain('stack:astro')
    expect(t('Django REST')).toContain('stack:python')
    expect(t('Ruby on Rails')).toContain('stack:rails')
    expect(t('Laravel')).toContain('stack:php')
    expect(t('Spring Boot')).toContain('stack:java')
    expect(t('Expo / React Native')).toContain('stack:react-native')
    expect(t('SvelteKit')).toContain('stack:svelte')
  })
  it('gibt nur Tags aus dem Vokabular zurück', () => {
    const tags = deriveCorpusTags({ ...base, stack: 'Next.js + Supabase + Stripe', commercialModel: 'shop' }, [])
    for (const tag of tags) expect(ALL_TAGS).toContain(tag)
  })
})

const RULES: ConventionRule[] = [
  { id: 'u1', section: 'code-rules', rule: 'Universell.', severity: 'must', source: 't' },
  { id: 'r1', section: 'code-rules', rule: 'Nur React.', appliesWhen: ['stack:react'], severity: 'should', source: 't' },
  { id: 'd1', section: 'db', rule: 'Nur DB.', appliesWhen: ['db:true'], severity: 'must', source: 't' },
]

describe('filterCorpus', () => {
  it('universelle Regel immer drin', () => {
    expect(filterCorpus(RULES, []).map(r => r.id)).toContain('u1')
  })
  it('bedingte Regel nur bei passendem Tag', () => {
    const ids = filterCorpus(RULES, ['stack:react']).map(r => r.id)
    expect(ids).toContain('r1'); expect(ids).not.toContain('d1')
  })
  it('kein Tag-Match → bedingte raus, universelle bleibt', () => {
    expect(filterCorpus(RULES, ['stack:vue']).map(r => r.id)).toEqual(['u1'])
  })
})

describe('renderBaseline', () => {
  const rules: ConventionRule[] = [
    { id: 'n1', section: 'naming', rule: 'Komponenten PascalCase.', severity: 'must', source: 't' },
    { id: 'c1', section: 'code-rules', rule: 'Dateien > 300 Zeilen aufteilen.', rationale: 'Lesbarkeit', severity: 'should', source: 't' },
  ]
  it('deterministisch (zweimal identisch)', () => {
    expect(renderBaseline(rules)).toBe(renderBaseline(rules))
  })
  it('enthält Regeltext + must/should-Markierung', () => {
    const md = renderBaseline(rules)
    expect(md).toContain('Dateien > 300 Zeilen aufteilen.')
    expect(md).toContain('Komponenten PascalCase.')
    expect(md).toMatch(/Pflicht|Empfehlung/)
  })
  it('feste Abschnitts-Reihenfolge: code-rules vor naming', () => {
    const md = renderBaseline(rules)
    expect(md.indexOf('Dateien > 300')).toBeLessThan(md.indexOf('Komponenten PascalCase'))
  })
})
