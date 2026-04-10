// src/lib/audit/agent-applicability.ts
// Relevanz-Profiling: Welche Agenten gelten für welches Projekt?
//
// Wird vom Audit-Runner und vom /audit/scan Onboarding verwendet,
// um nur relevante Agenten laufen zu lassen → fairer, spezifischer Score.

import type { PackageJson } from './types'

// ── Projekt-Profil (aus Onboarding oder Auto-Detect) ──────────────────────────

export type ProjectType = 'saas' | 'landing-page' | 'e-commerce' | 'internal' | 'api' | 'mobile'
export type Audience    = 'b2b' | 'b2c' | 'internal'
export type Region      = 'eu' | 'us' | 'global'
export type Feature     =
  | 'has-auth'
  | 'has-ai'
  | 'has-payments'
  | 'has-public-api'
  | 'has-i18n'
  | 'has-pwa'
  | 'has-uploads'

export interface ProjectProfile {
  /** Welcher Projekttyp? */
  projectTypes: ProjectType[]
  /** Wer sind die Nutzer? */
  audiences: Audience[]
  /** Geografischer Fokus (beeinflusst regulatorische Pflichten) */
  regions: Region[]
  /** Detektierte Features */
  features: Feature[]
  /** Bereits manuell bestätigte compliance-Bereiche */
  compliance?: ('dsgvo' | 'bfsg' | 'ai-act' | 'hipaa' | 'pci-dss')[]
}

// ── Applicability-Definition pro Agent ───────────────────────────────────────

export type WhenNotApplicable = 'skip' | 'info-only' | 'reduced-weight'

export interface AgentApplicability {
  /** Bedingungen unter denen der Agent relevant ist */
  conditions: {
    /** Immer anwenden — ignoriert alle anderen Bedingungen */
    always?: true
    /** Mindestens einer dieser Projekttypen muss vorhanden sein */
    projectTypes?: ProjectType[]
    /** Mindestens eine dieser Zielgruppen muss vorhanden sein */
    audiences?: Audience[]
    /** Region muss in dieser Liste sein */
    regions?: Region[]
    /** Mindestens eine dieser Dependencies muss in package.json vorhanden sein */
    requiredDeps?: string[]
    /** Mindestens eines dieser Features muss vorhanden sein */
    requiredFeatures?: Feature[]
    /** Mindestens eine dieser Compliance-Anforderungen muss bestätigt sein */
    requiredCompliance?: ('dsgvo' | 'bfsg' | 'ai-act' | 'hipaa' | 'pci-dss')[]
  }
  /** Was passiert wenn der Agent nicht relevant ist */
  whenNotApplicable: WhenNotApplicable
  /** Erklärung warum der Agent (nicht) gilt */
  rationale: string
}

// ── KI-Dependency-Marker ─────────────────────────────────────────────────────

export const AI_DEPS = [
  '@anthropic-ai/sdk',
  'openai',
  '@google/generative-ai',
  '@mistralai/mistralai',
  'ai',
  '@ai-sdk/anthropic',
  '@ai-sdk/openai',
  '@ai-sdk/google',
] as const

// ── Mapping: AgentSource → Applicability ─────────────────────────────────────

export const AGENT_APPLICABILITY: Record<string, AgentApplicability> = {
  // ── Immer relevant ────────────────────────────────────────────────────────
  'architecture': {
    conditions: { always: true },
    whenNotApplicable: 'skip',
    rationale: 'Architektur-Entscheidungen sind für jedes Projekt kritisch.',
  },
  'code-style': {
    conditions: { always: true },
    whenNotApplicable: 'skip',
    rationale: 'Code-Qualität gilt für jedes Projekt.',
  },
  'security': {
    conditions: { always: true },
    whenNotApplicable: 'skip',
    rationale: 'Sicherheit ist nicht optional.',
  },
  'security-scan': {
    conditions: { always: true },
    whenNotApplicable: 'skip',
    rationale: 'OWASP Top 10 gilt für jede Web-App.',
  },
  'error-handling': {
    conditions: { always: true },
    whenNotApplicable: 'skip',
    rationale: 'Fehlerbehandlung ist fundamentales Engineering.',
  },
  'testing': {
    conditions: { always: true },
    whenNotApplicable: 'skip',
    rationale: 'Tests sind für jedes Projekt relevant.',
  },
  'dependencies': {
    conditions: { always: true },
    whenNotApplicable: 'skip',
    rationale: 'Supply-Chain-Security gilt immer.',
  },
  'platform': {
    conditions: { always: true },
    whenNotApplicable: 'skip',
    rationale: 'CI/CD und Deployment-Practices gelten immer.',
  },
  'git-governance': {
    conditions: { always: true },
    whenNotApplicable: 'skip',
    rationale: 'Git-Workflows gelten für jedes Projekt mit Versionierung.',
  },
  'documentation': {
    conditions: { always: true },
    whenNotApplicable: 'skip',
    rationale: 'Dokumentation ist für jedes Projekt relevant.',
  },

  // ── Regulatorisch: EU-Region + Zielgruppe ─────────────────────────────────
  'dsgvo': {
    conditions: {
      regions: ['eu', 'global'],
      audiences: ['b2b', 'b2c'],
    },
    whenNotApplicable: 'info-only',
    rationale: 'DSGVO gilt für alle Projekte die EU-Bürgerdaten verarbeiten. info-only wenn Region unklar.',
  },
  'bfsg': {
    conditions: {
      regions: ['eu', 'global'],
      audiences: ['b2c'],
      projectTypes: ['saas', 'e-commerce', 'landing-page'],
    },
    whenNotApplicable: 'skip',
    rationale: 'BFSG gilt seit 28.06.2025 nur für B2C-Produkte (SaaS, E-Commerce) in der EU.',
  },
  'ai-act': {
    conditions: {
      regions: ['eu', 'global'],
      requiredDeps: [...AI_DEPS],
    },
    whenNotApplicable: 'skip',
    rationale: 'EU AI Act gilt nur wenn KI-Dependencies vorhanden sind.',
  },

  // ── Bedingt relevant ──────────────────────────────────────────────────────
  'legal': {
    conditions: {
      audiences: ['b2b', 'b2c'],
    },
    whenNotApplicable: 'info-only',
    rationale: 'Legal-Checks nur für externe Produkte (nicht rein interne Tools).',
  },
  'accessibility': {
    conditions: {
      projectTypes: ['saas', 'e-commerce', 'landing-page'],
    },
    whenNotApplicable: 'reduced-weight',
    rationale: 'Accessibility ist für öffentliche UIs wichtiger als für interne Tools.',
  },
  'observability': {
    conditions: {
      projectTypes: ['saas', 'e-commerce', 'api'],
    },
    whenNotApplicable: 'reduced-weight',
    rationale: 'Observability ist für Produktions-SaaS kritisch, für Landing Pages weniger.',
  },
  'cost-awareness': {
    conditions: {
      projectTypes: ['saas', 'api'],
      audiences: ['b2b', 'b2c'],
    },
    whenNotApplicable: 'reduced-weight',
    rationale: 'Kosten-Kontrolle ist für kostenpflichtige SaaS-Produkte wichtig.',
  },
  'backup-dr': {
    conditions: {
      projectTypes: ['saas', 'e-commerce', 'api'],
    },
    whenNotApplicable: 'reduced-weight',
    rationale: 'Disaster Recovery ist für Produktions-Systeme mit Nutzerdaten kritisch.',
  },
  'database': {
    conditions: {
      projectTypes: ['saas', 'e-commerce', 'api', 'internal'],
    },
    whenNotApplicable: 'skip',
    rationale: 'Nur relevant wenn eine Datenbank genutzt wird.',
  },
  'api': {
    conditions: {
      projectTypes: ['saas', 'e-commerce', 'api'],
    },
    whenNotApplicable: 'reduced-weight',
    rationale: 'API-Design nur relevant wenn öffentliche oder interne APIs vorhanden.',
  },
  'performance': {
    conditions: {
      projectTypes: ['saas', 'e-commerce', 'landing-page'],
    },
    whenNotApplicable: 'reduced-weight',
    rationale: 'Performance-Metriken (CWV) sind für öffentliche Web-Apps relevant.',
  },
  'scalability': {
    conditions: {
      projectTypes: ['saas', 'e-commerce', 'api'],
      audiences: ['b2b', 'b2c'],
    },
    whenNotApplicable: 'reduced-weight',
    rationale: 'Skalierbarkeit ist für Produkte mit vielen Nutzern wichtig.',
  },
  'design-system': {
    conditions: {
      projectTypes: ['saas', 'e-commerce', 'landing-page', 'internal'],
    },
    whenNotApplicable: 'reduced-weight',
    rationale: 'Design-System-Konsistenz ist für alle UI-Projekte relevant.',
  },

  // ── Feature-abhängig ──────────────────────────────────────────────────────
  'ai-integration': {
    conditions: {
      requiredDeps: [...AI_DEPS],
    },
    whenNotApplicable: 'skip',
    rationale: 'AI-Integration-Checks nur wenn KI-Dependencies vorhanden.',
  },
  'content': {
    conditions: {
      requiredFeatures: ['has-i18n'],
    },
    whenNotApplicable: 'skip',
    rationale: 'i18n und Content-Checks nur wenn Internationalisierung aktiv ist.',
  },
  'analytics': {
    conditions: {
      projectTypes: ['saas', 'e-commerce', 'landing-page'],
      audiences: ['b2b', 'b2c'],
    },
    whenNotApplicable: 'skip',
    rationale: 'Analytics-Checks nur für öffentliche Produkte mit Tracking.',
  },
}

// ── Relevanz-Engine ───────────────────────────────────────────────────────────

export interface RelevanceResult {
  agentId: string
  applicable: boolean
  mode: 'full' | 'info-only' | 'reduced-weight' | 'skip'
  reason: string
}

/**
 * Ermittelt welche Agenten für ein Projekt-Profil relevant sind.
 * Gibt für jeden Agenten einen RelevanceResult zurück.
 */
export function evaluateAgentRelevance(
  profile: ProjectProfile,
  packageJson: PackageJson,
): RelevanceResult[] {
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }
  const installedDeps = Object.keys(allDeps)

  return Object.entries(AGENT_APPLICABILITY).map(([agentId, applicability]) => {
    const { conditions, whenNotApplicable, rationale } = applicability

    // always = immer relevant
    if (conditions.always) {
      return { agentId, applicable: true, mode: 'full', reason: rationale }
    }

    // Prüfe alle Bedingungen (AND-Logik: alle gesetzten Bedingungen müssen erfüllt sein)
    const checks: boolean[] = []

    if (conditions.projectTypes) {
      checks.push(conditions.projectTypes.some((t) => profile.projectTypes.includes(t)))
    }
    if (conditions.audiences) {
      checks.push(conditions.audiences.some((a) => profile.audiences.includes(a)))
    }
    if (conditions.regions) {
      checks.push(conditions.regions.some((r) => profile.regions.includes(r)))
    }
    if (conditions.requiredDeps) {
      checks.push(conditions.requiredDeps.some((dep) => installedDeps.includes(dep)))
    }
    if (conditions.requiredFeatures) {
      checks.push(conditions.requiredFeatures.some((f) => profile.features.includes(f)))
    }
    if (conditions.requiredCompliance) {
      checks.push(
        conditions.requiredCompliance.some((c) => profile.compliance?.includes(c) ?? false),
      )
    }

    const isApplicable = checks.length > 0 && checks.every(Boolean)

    if (isApplicable) {
      return { agentId, applicable: true, mode: 'full', reason: rationale }
    }

    return {
      agentId,
      applicable: whenNotApplicable !== 'skip',
      mode: whenNotApplicable,
      reason: `Not applicable: ${rationale}`,
    }
  })
}

/**
 * Gibt nur die anwendbaren Agenten zurück (full + reduced-weight).
 * 'skip' Agenten sind nicht dabei, 'info-only' mit Kennzeichnung.
 */
export function getApplicableAgents(
  profile: ProjectProfile,
  packageJson: PackageJson,
): RelevanceResult[] {
  return evaluateAgentRelevance(profile, packageJson).filter((r) => r.mode !== 'skip')
}

/**
 * Auto-detektiert Features aus package.json.
 * Wird verwendet wenn kein Onboarding-Profil vorhanden.
 */
export function autoDetectFeatures(packageJson: PackageJson): Feature[] {
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }
  const features: Feature[] = []

  // Auth
  if (
    allDeps['@supabase/auth-helpers-nextjs'] ||
    allDeps['next-auth'] ||
    allDeps['@auth/core'] ||
    allDeps['lucia'] ||
    allDeps['@supabase/ssr']
  ) {
    features.push('has-auth')
  }

  // KI / AI
  if (AI_DEPS.some((dep) => allDeps[dep])) {
    features.push('has-ai')
  }

  // Payments
  if (allDeps['stripe'] || allDeps['@stripe/stripe-js'] || allDeps['paypal']) {
    features.push('has-payments')
  }

  // i18n
  if (
    allDeps['next-intl'] ||
    allDeps['i18next'] ||
    allDeps['react-i18next'] ||
    allDeps['@formatjs/intl']
  ) {
    features.push('has-i18n')
  }

  // PWA
  if (allDeps['next-pwa'] || allDeps['workbox-webpack-plugin'] || allDeps['@vite-pwa/nuxt']) {
    features.push('has-pwa')
  }

  // File uploads
  if (
    allDeps['@uploadthing/react'] ||
    allDeps['uploadthing'] ||
    allDeps['@vercel/blob'] ||
    allDeps['multer'] ||
    allDeps['busboy']
  ) {
    features.push('has-uploads')
  }

  return features
}

/**
 * Standard-Profil für Tropen OS (SaaS, B2B, EU).
 * Wird im internen Audit verwendet wenn kein Scan-Profil vorhanden.
 */
export const TROPEN_OS_PROFILE: ProjectProfile = {
  projectTypes: ['saas'],
  audiences: ['b2b'],
  regions: ['eu'],
  features: ['has-auth', 'has-ai', 'has-uploads'],
  compliance: ['dsgvo', 'ai-act'],
}
