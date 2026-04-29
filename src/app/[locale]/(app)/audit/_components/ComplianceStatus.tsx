'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Minus, CaretDown, CaretUp } from '@phosphor-icons/react'
import { AppSection } from '@/components/app-ui/AppSection'
import {
  complianceFrameworks,
  getDutyStatus,
  getFrameworkScore,
  type ComplianceDuty,
} from '@/lib/audit/compliance-mapping'

interface ComplianceStatusProps {
  findings: Array<Record<string, unknown>>
}

function DutyTableRow({
  duty,
  findings,
}: {
  duty: ComplianceDuty
  findings: Array<Record<string, unknown>>
}) {
  const [open, setOpen] = useState(false)
  const status = getDutyStatus(duty, findings)

  const openFindings = findings.filter(f =>
    duty.ruleIds.some(id => (f.rule_id as string | null)?.startsWith(id)) &&
    f.status === 'open' && !f.not_relevant_reason
  )

  const iconColor =
    status === 'fulfilled' ? 'var(--status-success)'
    : status === 'open' ? 'var(--status-danger)'
    : 'var(--text-tertiary)'

  const icon =
    status === 'fulfilled' ? <CheckCircle size={14} weight="fill" color={iconColor} aria-hidden="true" />
    : status === 'open' ? <XCircle size={14} weight="fill" color={iconColor} aria-hidden="true" />
    : <Minus size={14} weight="bold" color={iconColor} aria-hidden="true" />

  return (
    <>
      <tr onClick={() => status === 'open' && openFindings.length > 0 && setOpen(v => !v)}
          style={{ cursor: status === 'open' && openFindings.length > 0 ? 'pointer' : 'default' }}>
        <td style={{ width: 32 }}>{icon}</td>
        <td style={{
          fontSize: 13,
          color: status === 'not_relevant' ? 'var(--text-tertiary)' : 'var(--text-primary)',
          fontWeight: status === 'open' ? 500 : 400,
        }}>
          {duty.label}
          {status === 'open' && openFindings.length > 0 && (
            <span style={{ marginLeft: 6, color: 'var(--text-tertiary)' }}>
              {open ? <CaretUp size={11} weight="bold" aria-hidden="true" /> : <CaretDown size={11} weight="bold" aria-hidden="true" />}
            </span>
          )}
        </td>
        <td style={{ textAlign: 'right' }}>
          {status === 'open' && (
            <a href="#findings" onClick={e => { e.preventDefault(); document.getElementById('findings')?.scrollIntoView({ behavior: 'smooth' }) }}
               style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Fix-Prompt ↓
            </a>
          )}
          {status === 'not_relevant' && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Nicht relevant</span>
          )}
        </td>
      </tr>
      {open && openFindings.length > 0 && (
        <tr>
          <td colSpan={3} style={{ padding: 0, background: 'var(--bg-surface-2)' }}>
            <div style={{ padding: '8px 16px', borderLeft: '2px solid var(--status-danger)' }}>
              {openFindings.slice(0, 3).map((f, i) => (
                <div key={i} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                  {(f.rule_id as string) ?? ''}{f.message ? ` — ${String(f.message).slice(0, 60)}` : ''}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function ComplianceStatus({ findings }: ComplianceStatusProps) {
  const allOpen = complianceFrameworks.every(fw => {
    const { hasOpen } = getFrameworkScore(fw, findings)
    return !hasOpen
  })

  if (allOpen) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center' }}>
        <CheckCircle size={32} weight="fill" color="var(--status-success)" aria-hidden="true" />
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 12, marginBottom: 4 }}>
          Alle Pflichten erfüllt.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Nichts zu tun.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {complianceFrameworks.map(fw => {
        const { fulfilled, total, hasOpen } = getFrameworkScore(fw, findings)
        const scoreColor = hasOpen ? 'var(--status-danger)' : 'var(--status-success)'

        return (
          <AppSection
            key={fw.id}
            header={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className={`duty-tag ${fw.tagClass}`}>{fw.label}</span>
                {hasOpen && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-danger)' }} aria-hidden="true" />}
              </span>
            }
            headerRight={
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: scoreColor }}>
                {fulfilled}/{total} erfüllt
              </span>
            }
          >
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>Status</th>
                  <th>Pflicht</th>
                  <th style={{ width: 140 }}>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {fw.duties.map(duty => (
                  <DutyTableRow key={duty.id} duty={duty} findings={findings} />
                ))}
              </tbody>
            </table>
          </AppSection>
        )
      })}
    </div>
  )
}
