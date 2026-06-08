import { describe, it, expect } from 'vitest'
import { FULL_CORPUS, deriveCorpusTags } from '../render'
import { ALL_TAGS, STACK_TAGS } from '../vocabulary'
import type { ConventionSection } from '../types'
import type { PreflightPivots } from '../../types'

const VALID_SECTIONS: ConventionSection[] = ['code-rules','naming','structure','db','error-handling','testing','git','security','maintenance']

describe('Korpus-Integrität (Hand + generiert)', () => {
  it('IDs eindeutig über den gesamten Korpus', () => {
    const ids = FULL_CORPUS.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('jede Regel-Section ist gültig', () => {
    for (const r of FULL_CORPUS) expect(VALID_SECTIONS).toContain(r.section)
  })
  it('jedes appliesWhen-Tag stammt aus dem Vokabular', () => {
    for (const r of FULL_CORPUS) for (const t of r.appliesWhen ?? []) expect(ALL_TAGS).toContain(t)
  })
  it('jedes Stack-Tag ist von deriveCorpusTags produzierbar', () => {
    const sample: Record<string, string> = {
      'stack:react':'React','stack:next':'Next.js','stack:vue':'Vue','stack:nuxt':'Nuxt','stack:svelte':'SvelteKit',
      'stack:astro':'Astro','stack:remix':'Remix','stack:solid':'SolidJS','stack:angular':'Angular','stack:node':'Express Node.js',
      'stack:python':'Django','stack:rails':'Ruby on Rails','stack:go':'Golang','stack:php':'Laravel','stack:java':'Spring Boot',
      'stack:dotnet':'.NET','stack:react-native':'Expo React Native','stack:flutter':'Flutter','stack:swift':'SwiftUI','stack:kotlin':'Kotlin',
    }
    const base = { buildTool:'cursor', businessModel:'b2c', audienceRegion:'eu', hosting:'eu', platform:'web', commercialModel:'none' } as PreflightPivots
    for (const tag of STACK_TAGS) {
      const tags = deriveCorpusTags({ ...base, stack: sample[tag] ?? '' }, [])
      expect(tags, `${tag} aus „${sample[tag]}"`).toContain(tag)
    }
  })
})
