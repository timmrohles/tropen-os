'use client'
import { AppSection } from '@/components/app-ui/AppSection'
import FindingsTableApp from './FindingsTableApp'
import { ComplianceQuestion } from './ComplianceQuestion'
import type { AuditFinding } from '@/lib/audit/group-findings'

interface DsgvoTabProps {
  findings: AuditFinding[]
  projectId: string | null
  statusFilter?: string
  complianceData?: Record<string, unknown>
}

const DSGVO_QUESTIONS = [
  { key: 'has_avv_supabase', question: 'AVV mit Supabase abgeschlossen?', type: 'boolean' as const, hint: 'Art. 28 DSGVO — Pflicht für Auftragsverarbeiter. Unter app.supabase.com → Legal → DPA.' },
  { key: 'has_avv_vercel', question: 'AVV mit Vercel abgeschlossen?', type: 'boolean' as const, hint: 'Art. 28 DSGVO — unter vercel.com → Settings → Legal → DPA.' },
  { key: 'has_privacy_policy', question: 'Datenschutzerklärung aktuell und vollständig?', type: 'boolean' as const, hint: 'Art. 13/14 DSGVO — Informationspflicht gegenüber Betroffenen.' },
  { key: 'data_location', question: 'Wo werden personenbezogene Daten gespeichert?', type: 'select' as const, options: ['EU/EEA (konform)', 'USA mit SCC', 'USA ohne SCC', 'Unbekannt'] },
  { key: 'has_deletion_process', question: 'Account-Löschung technisch möglich (Art. 17)?', type: 'boolean' as const, hint: 'Recht auf Vergessenwerden — User muss Account löschen können.' },
]

export function DsgvoTab({ findings, projectId, statusFilter = 'open', complianceData = {} }: DsgvoTabProps) {
  const openCount = findings.filter(f => f.status === 'open').length
  return (
    <>
      {openCount > 0 && (
        <AppSection header={`DSGVO-Findings · ${openCount} offen`} style={{ marginBottom: 16 }}>
          <FindingsTableApp findings={findings} statusFilter={statusFilter} />
        </AppSection>
      )}
      {openCount === 0 && (
        <AppSection header="DSGVO-Findings" style={{ marginBottom: 16 }}>
          <div style={{ padding: '20px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Alle automatischen DSGVO-Checks bestanden.</p>
          </div>
        </AppSection>
      )}
      {projectId && (
        <AppSection header="Stamm-Daten — Antworten werden gespeichert">
          {DSGVO_QUESTIONS.map(q => (
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
