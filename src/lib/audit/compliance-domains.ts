// src/lib/audit/compliance-domains.ts
// Static registry of compliance domains and their relevance rules.
// No DB lookups — pure TypeScript config.

export interface ComplianceProfile {
  app_type: 'portfolio' | 'saas' | 'ecommerce' | 'blog' | 'mobile'
  user_location: 'de' | 'eu' | 'global' | 'internal'
  features: ('login' | 'payment' | 'ai' | 'affiliate' | 'ugc')[]
}

export interface ComplianceDomain {
  id: string
  name_de: string
  name_en: string
  emoji: string
  max_fine_text: string
  /** Audit rule IDs that belong to this domain */
  rule_ids: string[]
  /** Returns true if this domain is relevant for the given profile */
  isRelevant: (profile: ComplianceProfile) => boolean
}

export const COMPLIANCE_DOMAINS: ComplianceDomain[] = [
  {
    id: 'impressum',
    name_de: 'Impressum & Recht',
    name_en: 'Legal Pages',
    emoji: '📄',
    max_fine_text: 'Abmahnrisiko',
    rule_ids: ['cat-4-rule-7'],
    isRelevant: () => true, // every public website
  },
  {
    id: 'dsgvo',
    name_de: 'Datenschutz',
    name_en: 'Privacy',
    emoji: '🔒',
    max_fine_text: 'bis 20 Mio. €',
    rule_ids: [
      'cat-4-rule-11', 'cat-4-rule-12', 'cat-4-rule-13',
      'cat-4-rule-14', 'cat-4-rule-15', 'cat-4-rule-16',
      'cat-4-rule-17', 'cat-4-rule-18',
      'cat-4-rule-1',  // PII in Logs
      'cat-4-rule-8',  // VVT
      'cat-4-rule-9',  // Cookie Consent
      'cat-4-rule-10', // Analytics PII
    ],
    isRelevant: (p) =>
      p.user_location !== 'internal' &&
      (p.features.includes('login') || p.app_type !== 'portfolio'),
  },
  {
    id: 'ecommerce',
    name_de: 'Online-Handel',
    name_en: 'E-Commerce',
    emoji: '🛒',
    max_fine_text: 'bis 50.000 €',
    rule_ids: ['cat-4-rule-20', 'cat-4-rule-21', 'cat-4-rule-22'],
    isRelevant: (p) => p.features.includes('payment'),
  },
  {
    id: 'ai-act',
    name_de: 'KI-Transparenz',
    name_en: 'AI Transparency',
    emoji: '🤖',
    max_fine_text: 'bis 35 Mio. €',
    rule_ids: [
      'cat-22-rule-9', 'cat-22-rule-10', 'cat-22-rule-11',
      'cat-22-rule-12', 'cat-22-rule-13',
      'cat-22-rule-14', 'cat-22-rule-15',
    ],
    isRelevant: (p) => p.features.includes('ai'),
  },
  {
    id: 'bfsg',
    name_de: 'Barrierefreiheit',
    name_en: 'Accessibility',
    emoji: '♿',
    max_fine_text: 'bis 100.000 €',
    rule_ids: [
      'cat-16-rule-5', 'cat-16-rule-6', 'cat-16-rule-7',
      'cat-16-rule-8', 'cat-16-rule-9', 'cat-16-rule-10',
    ],
    isRelevant: (p) =>
      p.user_location === 'de' &&
      p.app_type !== 'portfolio' &&
      (p.app_type === 'ecommerce' || p.app_type === 'saas'),
  },
  {
    id: 'affiliate',
    name_de: 'Werbekennzeichnung',
    name_en: 'Ad Disclosure',
    emoji: '📢',
    max_fine_text: 'bis 500.000 €',
    rule_ids: ['cat-5-rule-20'],
    isRelevant: (p) => p.features.includes('affiliate'),
  },
]

/**
 * Returns the list of audit rule IDs that are NOT relevant
 * for the given profile (should be excluded from scoring).
 */
export function getIrrelevantRuleIds(profile: ComplianceProfile): Set<string> {
  const irrelevant = new Set<string>()
  for (const domain of COMPLIANCE_DOMAINS) {
    if (!domain.isRelevant(profile)) {
      for (const ruleId of domain.rule_ids) {
        irrelevant.add(ruleId)
      }
    }
  }
  return irrelevant
}

/**
 * Rules that require a compliance profile to be set.
 * Without profile → these rules are excluded from scoring (no findings, no penalty).
 * This prevents compliance checks from dominating scores when the project
 * hasn't been profiled yet.
 */
export const PROFILE_GATED_RULE_IDS = new Set([
  'cat-4-rule-7',   // Impressum — only relevant for DE/EU market
  'cat-4-rule-11',  // Datenschutzseite — only relevant when login exists
  'cat-4-rule-17',  // Datenexport — only relevant when user accounts exist
  'cat-4-rule-18',  // Account-Löschung — only relevant when user accounts exist
  'cat-4-rule-20',  // AGB — only relevant when payment exists
  'cat-4-rule-21',  // Widerrufsbelehrung — only relevant when payment exists
  'cat-16-rule-5',  // BFSG Barrierefreiheitserklärung — only DE + B2C
  'cat-16-rule-6',  // BFSG Feedback-Mechanismus — only DE + B2C
])

/**
 * Returns domains with their relevance status for a given profile.
 */
export function getDomainStatus(profile: ComplianceProfile): Array<{
  domain: ComplianceDomain
  relevant: boolean
}> {
  return COMPLIANCE_DOMAINS.map((domain) => ({
    domain,
    relevant: domain.isRelevant(profile),
  }))
}
