// Mapping: Compliance-Rules → DSGVO / BFSG / EU AI Act Pflichten.
// Prinzip: konservativ — lieber Lücke als falsche Zuordnung.
// Nicht zugeordnete Compliance-Rules erscheinen nur in der allgemeinen Liste.
// Fernabsatz (AGB, Widerruf), Affiliate, Lizenz: NICHT zugeordnet — zu wenig Abdeckung.

export interface ComplianceDuty {
  id: string
  label: string
  ruleIds: string[]
}

export interface ComplianceFramework {
  id: 'dsgvo' | 'bfsg' | 'ai-act'
  label: string
  tagClass: 'duty-tag--dsgvo' | 'duty-tag--bfsg' | 'duty-tag--ai-act'
  duties: ComplianceDuty[]
}

export const complianceFrameworks: ComplianceFramework[] = [
  {
    id: 'dsgvo',
    label: 'DSGVO',
    tagClass: 'duty-tag--dsgvo',
    duties: [
      {
        id: 'dsgvo-legal-docs',
        label: 'Impressum & Datenschutzerklärung',
        ruleIds: ['cat-4-rule-7'],
      },
      {
        id: 'dsgvo-consent',
        label: 'Cookie Consent & Tracking-Sperre',
        ruleIds: ['cat-4-rule-12', 'cat-4-rule-13'],
      },
      {
        id: 'dsgvo-consent-system',
        label: 'Consent-System DSGVO-konform',
        ruleIds: ['cat-4-rule-2'],
      },
      {
        id: 'dsgvo-rechtsgrundlagen',
        label: 'Rechtsgrundlagen dokumentiert',
        ruleIds: ['cat-4-rule-4'],
      },
      {
        id: 'dsgvo-avv',
        label: 'Auftragsverarbeitung (AVV) mit Drittanbietern',
        ruleIds: ['cat-4-rule-5'],
      },
      {
        id: 'dsgvo-vvt',
        label: 'Verarbeitungsverzeichnis (VVT)',
        ruleIds: ['cat-4-rule-8'],
      },
    ],
  },
  {
    id: 'bfsg',
    label: 'BFSG',
    tagClass: 'duty-tag--bfsg',
    duties: [
      {
        id: 'bfsg-erklaerung',
        label: 'Erklärung zur Barrierefreiheit',
        ruleIds: ['cat-16-rule-5'],
      },
      {
        id: 'bfsg-feedback',
        label: 'Feedback-Mechanismus für Barrierefreiheit',
        ruleIds: ['cat-16-rule-6'],
      },
    ],
  },
  {
    id: 'ai-act',
    label: 'EU AI Act',
    tagClass: 'duty-tag--ai-act',
    duties: [
      {
        id: 'ai-act-klassifizierung',
        label: 'Risikoeinstufung & Klassifizierung',
        ruleIds: ['cat-4-rule-6', 'cat-22-rule-9'],
      },
      {
        id: 'ai-act-transparenz',
        label: 'KI-Transparenz & Kennzeichnung',
        ruleIds: ['cat-22-rule-10', 'cat-22-rule-14', 'cat-22-rule-15'],
      },
      {
        id: 'ai-act-logging',
        label: 'KI-Entscheidungs-Logging',
        ruleIds: ['cat-22-rule-11'],
      },
      {
        id: 'ai-act-zweck',
        label: 'Zweckbeschreibung dokumentiert',
        ruleIds: ['cat-22-rule-12'],
      },
      {
        id: 'ai-act-verbote',
        label: 'Keine verbotenen KI-Praktiken',
        ruleIds: ['cat-22-rule-13'],
      },
    ],
  },
]

// Rule-IDs die keinem Framework zugeordnet sind (erscheinen nur in allgemeiner Liste)
// cat-3-rule-11 (Patch-Management / Security Policy)
// cat-4-rule-20 (AGB) / cat-4-rule-21 (Widerruf) / cat-4-rule-22 (Checkout)
// cat-5-rule-20 (Affiliate-Kennzeichnung)
// cat-20-rule-4 (Lizenz-Compliance)
export const UNMAPPED_COMPLIANCE_RULE_IDS = [
  'cat-3-rule-11',
  'cat-4-rule-20',
  'cat-4-rule-21',
  'cat-4-rule-22',
  'cat-5-rule-20',
  'cat-20-rule-4',
]

type DutyStatus = 'fulfilled' | 'open' | 'not_relevant'

export function getDutyStatus(
  duty: ComplianceDuty,
  findings: Array<Record<string, unknown>>
): DutyStatus {
  const relevant = findings.filter(f =>
    duty.ruleIds.some(id => (f.rule_id as string | null)?.startsWith(id))
  )
  if (relevant.length === 0) return 'fulfilled'
  if (relevant.every(f =>
    f.not_relevant_reason ||
    f.status === 'dismissed' ||
    f.status === 'fixed'
  )) return 'not_relevant'
  return 'open'
}

export function getFrameworkScore(
  framework: ComplianceFramework,
  findings: Array<Record<string, unknown>>
): { fulfilled: number; total: number; hasOpen: boolean } {
  let fulfilled = 0
  let hasOpen = false
  for (const duty of framework.duties) {
    const status = getDutyStatus(duty, findings)
    if (status === 'fulfilled' || status === 'not_relevant') fulfilled++
    if (status === 'open') hasOpen = true
  }
  return { fulfilled, total: framework.duties.length, hasOpen }
}
