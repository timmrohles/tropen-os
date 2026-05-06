// src/lib/audit/project-profiles-shared.ts
// Pure types and constants — safe for client and server imports.
// Server-only functions (supabaseAdmin queries) live in project-profiles.ts.

// ── Typen ──────────────────────────────────────────────────────────────────────

export type ProfileType = 'solo' | 'internal' | 'public' | 'b2c' | 'b2b_regulated'
export type GeoScope = 'eu' | 'non_eu' | 'global' | 'none'

export interface ScanProjectProfile {
  id: string
  scan_project_id: string
  profile_type: ProfileType
  geo_scope: GeoScope
  has_user_data: boolean
  has_ai: boolean | null
  has_ecommerce: boolean | null
  changed_by: string | null
  created_at: string
}

export interface CreateProfileInput {
  scanProjectId: string
  profileType: ProfileType
  geoScope: GeoScope
  hasUserData: boolean
  hasAi: boolean | null
  hasEcommerce: boolean | null
  changedBy?: string
}

// ── Domänen-Aktivierung ────────────────────────────────────────────────────────

export type ActivationLevel = 'active' | 'lazy' | 'inactive'

export interface DomainActivation {
  privacy: ActivationLevel
  ai: ActivationLevel
  commerce: ActivationLevel
  industry: ActivationLevel
  accessibility: ActivationLevel
  marketing: ActivationLevel
  platform: ActivationLevel
  infrastructure: ActivationLevel
  oss: ActivationLevel
}

export function getDomainActivation(profile: ScanProjectProfile): DomainActivation {
  const base = getBaseActivation(profile.profile_type)

  if (profile.has_ai === false && base.ai === 'lazy') {
    base.ai = 'inactive'
  }
  if (profile.has_ecommerce === false && base.commerce === 'active') {
    base.commerce = 'lazy'
  }
  if (profile.has_ecommerce === false && base.commerce === 'lazy') {
    base.commerce = 'inactive'
  }

  return base
}

function getBaseActivation(profileType: ProfileType): DomainActivation {
  switch (profileType) {
    case 'solo':
      return {
        privacy:        'inactive',
        ai:             'inactive',
        commerce:       'inactive',
        industry:       'inactive',
        accessibility:  'inactive',
        marketing:      'inactive',
        platform:       'inactive',
        infrastructure: 'inactive',
        oss:            'lazy',
      }
    case 'internal':
      return {
        privacy:        'active',
        ai:             'inactive',
        commerce:       'inactive',
        industry:       'lazy',
        accessibility:  'inactive',
        marketing:      'inactive',
        platform:       'inactive',
        infrastructure: 'active',
        oss:            'lazy',
      }
    case 'public':
      return {
        privacy:        'inactive',
        ai:             'lazy',
        commerce:       'lazy',
        industry:       'inactive',
        accessibility:  'active',
        marketing:      'lazy',
        platform:       'active',
        infrastructure: 'active',
        oss:            'lazy',
      }
    case 'b2c':
      return {
        privacy:        'active',
        ai:             'lazy',
        commerce:       'active',
        industry:       'lazy',
        accessibility:  'active',
        marketing:      'active',
        platform:       'active',
        infrastructure: 'active',
        oss:            'lazy',
      }
    case 'b2b_regulated':
      return {
        privacy:        'active',
        ai:             'active',
        commerce:       'active',
        industry:       'active',
        accessibility:  'active',
        marketing:      'lazy',
        platform:       'active',
        infrastructure: 'active',
        oss:            'active',
      }
  }
}

// ── Profile-Labels ─────────────────────────────────────────────────────────────

export const PROFILE_LABELS: Record<ProfileType, { name: string; description: string; examples: string }> = {
  solo: {
    name: 'Solo-Projekt',
    description: 'Nur ich, kein Login, keine echten User',
    examples: 'Lovable-Experiment, persönliches Showcase',
  },
  internal: {
    name: 'Internes Tool',
    description: 'Mein Team nutzt es, niemand von außen',
    examples: 'Team-Dashboard, interne Automation',
  },
  public: {
    name: 'Public App ohne Login',
    description: 'Jeder kann die App nutzen, aber niemand muss sich anmelden',
    examples: 'Calculator, Content-Site, Landing Page',
  },
  b2c: {
    name: 'B2C-App mit Accounts',
    description: 'User registrieren sich und speichern Daten',
    examples: 'SaaS, Community-Plattform, App mit Login',
  },
  b2b_regulated: {
    name: 'Regulierte B2B-App',
    description: 'Compliance ist wichtig — Health, Finance, oder Behörden-Kunden',
    examples: 'Health-Tech, Finance-App, Behörden-Portal',
  },
}

export const GEO_SCOPE_LABELS: Record<GeoScope, { label: string; flag: string }> = {
  eu:     { label: 'EU / EWR', flag: '🇪🇺' },
  global: { label: 'Global', flag: '🌍' },
  non_eu: { label: 'Außerhalb EU (USA, UK, etc.)', flag: '🌐' },
  none:   { label: 'Weiß ich nicht / spielt keine Rolle', flag: '❓' },
}

export const DEFAULT_PROFILE: Pick<CreateProfileInput, 'profileType' | 'geoScope' | 'hasUserData' | 'hasAi' | 'hasEcommerce'> = {
  profileType: 'b2c',
  geoScope: 'eu',
  hasUserData: true,
  hasAi: null,
  hasEcommerce: null,
}
