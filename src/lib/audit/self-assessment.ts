// src/lib/audit/self-assessment.ts
// Self-assessment questions for aspects that automated checkers cannot verify.

export interface SelfAssessmentQuestion {
  id: string
  question_en: string
  question_de: string
  hint_en: string
  hint_de: string
  ruleIds: string[]
  ifNoSeverity: 'critical' | 'high' | 'medium'
}

export const SELF_ASSESSMENT_QUESTIONS: SelfAssessmentQuestion[] = [
  {
    id: 'has_backups',
    question_en: 'Are automatic database backups enabled?',
    question_de: 'Sind automatische Datenbank-Backups aktiv?',
    hint_en: 'Supabase: Dashboard \u2192 Database \u2192 Backups',
    hint_de: 'Supabase: Dashboard \u2192 Database \u2192 Backups',
    ruleIds: ['cat-13-rule-1', 'cat-13-rule-2'],
    ifNoSeverity: 'high',
  },
  {
    id: 'has_monitoring',
    question_en: 'Do you have error monitoring set up? (Sentry, Bugsnag, etc.)',
    question_de: 'Hast du Error-Monitoring eingerichtet? (Sentry, Bugsnag, etc.)',
    hint_en: 'Sentry is free for small projects',
    hint_de: 'Sentry ist kostenlos f\u00fcr kleine Projekte',
    ruleIds: ['cat-12-rule-10'],
    ifNoSeverity: 'high',
  },
  {
    id: 'has_rate_limiting',
    question_en: 'Are your public API endpoints protected against abuse?',
    question_de: 'Sind deine \u00f6ffentlichen API-Endpunkte vor Missbrauch gesch\u00fctzt?',
    hint_en: 'Rate limiting, e.g. with Upstash or middleware',
    hint_de: 'Rate Limiting, z.B. mit Upstash oder Middleware',
    ruleIds: ['cat-3-rule-5'],
    ifNoSeverity: 'critical',
  },
  {
    id: 'has_rto_rpo',
    question_en: 'Do you know the maximum acceptable downtime for your app?',
    question_de: 'Wei\u00dft du wie lang deine App maximal ausfallen darf?',
    hint_en: 'RTO/RPO: Recovery Time / Recovery Point Objective',
    hint_de: 'RTO/RPO: Recovery Time / Recovery Point Objective',
    ruleIds: ['cat-13-rule-3'],
    ifNoSeverity: 'medium',
  },
  {
    id: 'has_legal_review',
    question_en: 'Has your privacy policy been reviewed by a lawyer?',
    question_de: 'Wurde deine Datenschutzerkl\u00e4rung von einem Anwalt gepr\u00fcft?',
    hint_en: 'Required for DE/EU when processing user data',
    hint_de: 'F\u00fcr DE/EU Pflicht wenn User-Daten verarbeitet werden',
    ruleIds: ['cat-4-rule-4'],
    ifNoSeverity: 'medium',
  },
]
