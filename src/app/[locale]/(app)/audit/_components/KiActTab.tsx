'use client'
import { AppSection } from '@/components/app-ui/AppSection'
import FindingsTableApp from './FindingsTableApp'
import { ComplianceQuestion } from './ComplianceQuestion'
import type { AuditFinding } from '@/lib/audit/group-findings'

interface KiActTabProps {
  findings: AuditFinding[]
  projectId: string | null
  statusFilter?: string
  complianceData?: Record<string, unknown>
}

const KI_ACT_QUESTIONS = [
  { key: 'ki_risk_class', question: 'KI-Risikoklasse bestimmt?', type: 'select' as const, options: ['Minimales Risiko', 'Begrenztes Risiko', 'Hohes Risiko', 'Unakzeptables Risiko', 'Noch nicht bestimmt'], hint: 'EU AI Act Art. 6 — Klassifizierung ist Pflicht für KI-Systeme.' },
  { key: 'ki_transparency_label', question: 'KI-generierte Inhalte als solche gekennzeichnet?', type: 'boolean' as const, hint: 'Art. 52 EU AI Act — Chatbots und generierte Inhalte müssen erkennbar sein.' },
  { key: 'ki_logging_enabled', question: 'KI-Entscheidungen geloggt?', type: 'boolean' as const, hint: 'Art. 12 EU AI Act — für begrenzte und höhere Risikoklassen Pflicht.' },
  { key: 'ki_purpose_documented', question: 'Zweckbeschreibung des KI-Systems dokumentiert?', type: 'boolean' as const, hint: 'Art. 13 EU AI Act — Nutzer müssen wissen wofür KI eingesetzt wird.' },
]

export function KiActTab({ findings, projectId, statusFilter = 'open', complianceData = {} }: KiActTabProps) {
  const openCount = findings.filter(f => f.status === 'open').length
  return (
    <>
      {openCount > 0 && (
        <AppSection header={`KI-Act-Findings · ${openCount} offen`} style={{ marginBottom: 16 }}>
          <FindingsTableApp findings={findings} statusFilter={statusFilter} />
        </AppSection>
      )}
      {openCount === 0 && (
        <AppSection header="KI-Act-Findings" style={{ marginBottom: 16 }}>
          <div style={{ padding: '20px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Alle automatischen KI-Act-Checks bestanden.</p>
          </div>
        </AppSection>
      )}
      {projectId && (
        <AppSection header="KI-Act Selbst-Auskunft — Antworten werden gespeichert">
          {KI_ACT_QUESTIONS.map(q => (
            <ComplianceQuestion
              key={q.key}
              projectId={projectId}
              questionKey={q.key}
              question={q.question}
              type={q.type}
              options={'options' in q ? q.options : undefined}
              hint={q.hint}
              initialValue={complianceData[q.key]}
            />
          ))}
        </AppSection>
      )}
    </>
  )
}
