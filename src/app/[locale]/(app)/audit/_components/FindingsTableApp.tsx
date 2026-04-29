'use client'

import React, { useState } from 'react'
import { Copy, Check } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'
import type { FindingGroup, AuditFinding } from '@/lib/audit/group-findings'
import { groupFindings } from '@/lib/audit/group-findings'
import { buildFixPrompt } from '@/lib/audit/prompt-export'
import { findRecommendation } from '@/lib/audit/finding-recommendations'
import type { PromptFinding } from '@/lib/audit/prompt-export/types'

interface FindingsTableAppProps {
  findings: AuditFinding[]
  statusFilter?: string
  isQuickWins?: boolean
}

const SEV_DOT: Record<string, string> = {
  critical: 'severity-dot--critical',
  high:     'severity-dot--high',
  medium:   'severity-dot--medium',
  low:      'severity-dot--low',
  info:     'severity-dot--info',
}

function PromptBox({ group }: { group: FindingGroup }) {
  const [copied, setCopied] = useState(false)
  const firstFinding = group.findings[0]
  const pf: PromptFinding = {
    ruleId: group.ruleId.split('::')[0],
    severity: group.severity,
    message: group.baseMessage,
    filePath: firstFinding?.file_path ?? null,
    agentSource: group.agentSource ?? null,
    fixType: firstFinding?.fix_type ?? null,
    affectedFiles: group.findings.map(f => f.file_path).filter((p): p is string => !!p),
  }
  const generated = buildFixPrompt(pf, 'cursor')
  const prompt = generated.content

  function copy() {
    void navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      background: 'var(--active-bg)',
      borderTop: '1px solid var(--border)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)',
        }}>
          Fix-Prompt für Cursor
        </span>
        <button
          onClick={copy}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 4, padding: '3px 8px',
            fontSize: 11, color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {copied
            ? <><Check size={11} weight="bold" aria-hidden="true" /> Kopiert</>
            : <><Copy size={11} weight="bold" aria-hidden="true" /> Kopieren</>}
        </button>
      </div>
      <pre style={{
        margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7,
        color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap', overflowX: 'auto',
      }}>
        {prompt}
      </pre>
    </div>
  )
}

export default function FindingsTableApp({ findings, statusFilter = 'open' }: FindingsTableAppProps) {
  const t = useTranslations('audit')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const filtered = findings.filter(f => {
    if (statusFilter === 'open') return f.status === 'open' || f.status === 'acknowledged'
    if (statusFilter === 'fixed') return f.status === 'fixed'
    if (statusFilter === 'dismissed') return f.status === 'dismissed'
    return true
  })

  const groups = groupFindings(filtered)

  if (groups.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {statusFilter === 'open' ? 'Keine offenen Findings. Gut gemacht.' : 'Keine Findings in diesem Status.'}
        </p>
      </div>
    )
  }

  return (
    <table className="app-table">
      <thead>
        <tr>
          <th style={{ width: 32 }}>SEV</th>
          <th>Titel</th>
          <th style={{ width: 260 }}>Pfad</th>
          <th style={{ width: 72, textAlign: 'right' }}>Score +</th>
        </tr>
      </thead>
      <tbody>
        {groups.map(group => {
          const key = group.ruleId
          const isExpanded = expandedKey === key
          const recommendation = findRecommendation(group.ruleId, group.baseMessage)
          const primaryFile = group.findings[0]?.file_path ?? null
          const scoreGain = recommendation ? `+${(group.findings.length * 0.3).toFixed(1)}` : null

          return (
            <React.Fragment key={key}>
              <tr
                onClick={() => setExpandedKey(isExpanded ? null : key)}
                style={{ cursor: 'pointer' }}
                data-rule-id={key}
              >
                <td>
                  <span className={`severity-dot ${SEV_DOT[group.severity] ?? 'severity-dot--info'}`}
                    role="img" title={group.severity} aria-label={`Schweregrad: ${group.severity}`} />
                </td>
                <td>
                  <span style={{ fontSize: 13, fontWeight: isExpanded ? 600 : 400, color: 'var(--text-primary)' }}>
                    {recommendation?.title ?? group.baseMessage}
                  </span>
                  {group.findings.length > 1 && (
                    <span
                      title={`${group.findings.length} Vorkommen in der Codebase`}
                      style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', cursor: 'help' }}
                    >
                      ×{group.findings.length}
                    </span>
                  )}
                </td>
                <td className="app-table-mono" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {primaryFile ?? '—'}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {scoreGain}
                </td>
              </tr>
              {isExpanded && (
                <tr key={`${key}-expanded`}>
                  <td colSpan={4} style={{ padding: 0 }}>
                    {/* Context panel — Coach-Erklärung + betroffene Dateien */}
                    <div style={{ padding: '12px 16px', background: 'var(--surface-warm)', borderTop: '1px solid var(--border)' }}>
                      <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                        {recommendation?.problem ?? group.baseMessage}
                      </p>
                      {group.findings.length > 1 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {group.findings.slice(0, 8).map(f => f.file_path).filter(Boolean).map(p => (
                            <span key={p} style={{
                              fontSize: 11, fontFamily: 'var(--font-mono)', padding: '1px 7px',
                              background: 'var(--bg-base)', border: '1px solid var(--border)',
                              borderRadius: 3, color: 'var(--text-secondary)',
                            }}>
                              {p!.split('/').slice(-2).join('/')}
                            </span>
                          ))}
                          {group.findings.length > 8 && (
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '1px 4px' }}>
                              +{group.findings.length - 8} weitere
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <PromptBox group={group} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          )
        })}
      </tbody>
    </table>
  )
}
