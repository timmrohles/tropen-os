#!/usr/bin/env tsx
// Verifikations-Script für ADR-027 Schritt 9a — DomainActivation-Skip-Logik
// Zählt Regeln die je nach Profil übersprungen werden.
// Kein echter Audit-Run — nur Regel-Zählung per Simulation.

import { AUDIT_RULES } from '../lib/audit/rule-registry'
import { getDomainActivation } from '../lib/audit/project-profiles'
import type { ScanProjectProfile } from '../lib/audit/project-profiles'
import type { AuditDomain } from '../lib/audit/types'

const UNIVERSAL_DOMAINS = new Set(['code-quality', 'performance', 'security', 'documentation'])

// Muss synchron mit index.ts RULE_DOMAIN_TO_ACTIVATION bleiben (Sprint 9b ergänzt)
const RULE_DOMAIN_TO_ACTIVATION: Record<string, string> = {
  'dsgvo':          'privacy',
  'ki-act':         'ai',
  'accessibility':  'accessibility',
  'oss':            'oss',
  'marketing':      'marketing',
  'platform':       'platform',
  'infrastructure': 'infrastructure',
}

function simulateRuleFilter(domainActivation: Record<string, string> | null) {
  let active = 0, skipped = 0, lazy = 0
  const skippedDomains = new Map<string, number>()

  for (const rule of AUDIT_RULES) {
    if (!rule.automatable) continue // manuelle Regeln zählen wir nicht

    const ruleDomain = rule.domain as string
    if (!domainActivation || UNIVERSAL_DOMAINS.has(ruleDomain)) {
      active++
      continue
    }

    const activationKey = RULE_DOMAIN_TO_ACTIVATION[ruleDomain]
    const activation = activationKey ? domainActivation[activationKey] : undefined
    if (activation === 'inactive') {
      skipped++
      skippedDomains.set(ruleDomain, (skippedDomains.get(ruleDomain) ?? 0) + 1)
    } else if (activation === 'lazy') {
      lazy++
      active++ // lazy = heute active
    } else {
      active++
    }
  }

  return { active, skipped, lazy, skippedDomains }
}

function makeProfile(profileType: string): ScanProjectProfile {
  return {
    id: 'test',
    scan_project_id: 'test',
    profile_type: profileType as ScanProjectProfile['profile_type'],
    geo_scope: 'eu',
    has_user_data: profileType !== 'solo',
    has_ai: null,
    has_ecommerce: null,
    changed_by: null,
    created_at: new Date().toISOString(),
  }
}

const profiles = ['solo', 'internal', 'public', 'b2c', 'b2b_regulated']
const totalAutomatable = AUDIT_RULES.filter(r => r.automatable).length
console.log(`\nTotal automatable rules: ${totalAutomatable}`)
console.log('─'.repeat(70))
console.log('Profile'.padEnd(20), 'Active'.padStart(8), 'Skipped'.padStart(9), 'Lazy(=active)'.padStart(15))
console.log('─'.repeat(70))

for (const profileType of profiles) {
  const profile = makeProfile(profileType)
  const activation = getDomainActivation(profile) as unknown as Record<string, string>
  const result = simulateRuleFilter(activation)
  console.log(
    profileType.padEnd(20),
    (result.active).toString().padStart(8),
    result.skipped.toString().padStart(9),
    result.lazy.toString().padStart(15),
  )
}

console.log('─'.repeat(70))
console.log('\nNo profile (run all):')
const noProfile = simulateRuleFilter(null)
console.log('  Active:', noProfile.active, '(all automatable rules)')

// Detail für Solo: welche Domänen werden übersprungen?
console.log('\n─'.repeat(70))
console.log('Solo — übersprungene Domänen:')
const soloProfile = makeProfile('solo')
const soloActivation = getDomainActivation(soloProfile) as unknown as Record<string, string>
const soloResult = simulateRuleFilter(soloActivation)
for (const [domain, count] of soloResult.skippedDomains.entries()) {
  console.log(`  ${domain.padEnd(20)} ${count} rules skipped`)
}

console.log('\nB2C — übersprungene Domänen:')
const b2cProfile = makeProfile('b2c')
const b2cActivation = getDomainActivation(b2cProfile) as unknown as Record<string, string>
const b2cResult = simulateRuleFilter(b2cActivation)
if (b2cResult.skippedDomains.size === 0) {
  console.log('  (keine — alle Domänen aktiv für B2C)')
} else {
  for (const [domain, count] of b2cResult.skippedDomains.entries()) {
    console.log(`  ${domain.padEnd(20)} ${count} rules skipped`)
  }
}

// Verifiziere: DSGVO aktiv für B2C, inaktiv für Solo
const b2cDsgvoActive = b2cActivation['privacy'] !== 'inactive'
const soloDsgvoInactive = soloActivation['privacy'] === 'inactive'
console.log('\n─'.repeat(70))
console.log('Checks:')
console.log(b2cDsgvoActive ? '✅' : '❌', 'B2C: DSGVO aktiv (erwartet: ja)')
console.log(soloDsgvoInactive ? '✅' : '❌', 'Solo: DSGVO inaktiv (erwartet: ja)')
