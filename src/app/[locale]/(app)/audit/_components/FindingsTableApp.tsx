'use client'

import React, { useState, useEffect } from 'react'
import { Copy, Check } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'
import type { FindingGroup, AuditFinding } from '@/lib/audit/group-findings'
import { groupFindings } from '@/lib/audit/group-findings'

// No import from finding-recommendations or prompt-export — those are server-only bundles.
// Fix prompts are fetched via /api/audit/fix-prompt on demand.

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

const BTN_STYLE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  border: '1px solid var(--secondary)', borderRadius: 4, padding: '3px 8px',
  fontSize: 11, color: 'var(--secondary)', cursor: 'pointer',
  fontFamily: 'var(--font-mono)', background: 'transparent',
}

function PromptBox({ group, onHide, onDismiss }: { group: FindingGroup; onHide: () => void; onDismiss: () => void }) {
  const [prompt, setPrompt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [dismissing, setDismissing] = useState(false)
  const firstFinding = group.findings[0]

  useEffect(() => {
    const uniqueFiles = [...new Set(group.findings.map(f => f.file_path).filter(Boolean))]
    fetch('/api/audit/fix-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ruleId: group.ruleId,
        message: group.baseMessage,
        severity: group.severity,
        filePath: firstFinding?.file_path ?? null,
        affectedFiles: uniqueFiles,
        agentSource: group.agentSource ?? null,
        fixType: firstFinding?.fix_type ?? null,
      }),
    })
      .then(r => r.json())
      .then(data => setPrompt(data.prompt ?? 'Fixe das Problem.'))
      .catch(() => setPrompt('Fixe das Problem.'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.ruleId])

  function copy() {
    if (!prompt) return
    void navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function dismiss() {
    setDismissing(true)
    await Promise.allSettled(
      group.findings.map(f =>
        fetch(`/api/audit/findings/${f.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'dismissed' }),
        })
      )
    )
    setDismissing(false)
    onDismiss()
  }

  return (
    <div style={{ background: 'var(--active-bg)', borderTop: '1px solid var(--border)' }}>
      <div style={{ padding: '14px 16px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 10 }}>
          Fix-Prompt
        </span>
        {loading ? (
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Wird geladen…</p>
        ) : (
          <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
            {prompt}
          </pre>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={copy} disabled={loading} style={{ ...BTN_STYLE, background: 'var(--secondary)', color: 'var(--active-bg)', opacity: loading ? 0.5 : 1 }}>
          {copied
            ? <><Check size={11} weight="bold" aria-hidden="true" /> Kopiert</>
            : <><Copy size={11} weight="bold" aria-hidden="true" /> Kopieren</>}
        </button>
        <button onClick={onHide} title="Temporär ausblenden — beim nächsten Reload wieder sichtbar" style={BTN_STYLE}>
          Ausblenden
        </button>
        <button
          onClick={dismiss}
          disabled={dismissing}
          title="Dauerhaft als 'Nicht relevant' markieren — erscheint im Tab Behoben/Nicht relevant, nicht mehr in Offen"
          style={{ ...BTN_STYLE, opacity: dismissing ? 0.5 : 1 }}
        >
          {dismissing ? 'Wird gespeichert…' : 'Nicht relevant — dauerhaft ausblenden'}
        </button>
      </div>
    </div>
  )
}

export default function FindingsTableApp({ findings, statusFilter = 'open' }: FindingsTableAppProps) {
  const t = useTranslations('audit')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set())

  const filtered = findings.filter(f => {
    if (statusFilter === 'open') return f.status === 'open' || f.status === 'acknowledged'
    if (statusFilter === 'fixed') return f.status === 'fixed'
    if (statusFilter === 'dismissed') return f.status === 'dismissed'
    return true
  })

  const groups = groupFindings(filtered).filter(g => !hiddenKeys.has(g.ruleId))

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
    <>
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
          const primaryFile = group.findings[0]?.file_path ?? null
          const uniqueFiles = [...new Set(group.findings.map(f => f.file_path).filter((p): p is string => !!p))]
          // Title and problem come from the server via the pre-enriched finding fields
          const title = (group.findings[0] as unknown as Record<string, unknown>)?._recTitle as string | undefined
          const problem = (group.findings[0] as unknown as Record<string, unknown>)?._recProblem as string | undefined
          const hasRec = !!title
          const scoreGain = hasRec ? `+${(group.findings.length * 0.3).toFixed(1)}` : null

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
                    {title ?? group.baseMessage}
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
                  <td colSpan={4} style={{ padding: 0, textAlign: 'left' }}>
                    <div style={{ padding: '12px 16px', background: 'var(--surface-warm)', borderTop: '1px solid var(--border)' }}>
                      <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                        {problem ?? group.baseMessage}
                      </p>
                      {uniqueFiles.length > 1 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {uniqueFiles.slice(0, 8).map(p => (
                            <span key={p} style={{
                              fontSize: 11, fontFamily: 'var(--font-mono)', padding: '1px 7px',
                              background: 'var(--bg-base)', border: '1px solid var(--border)',
                              borderRadius: 3, color: 'var(--text-secondary)',
                            }}>
                              {p.split('/').slice(-2).join('/')}
                            </span>
                          ))}
                          {uniqueFiles.length > 8 && (
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '1px 4px' }}>
                              +{uniqueFiles.length - 8} weitere
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <PromptBox group={group} onHide={() => {
                      setHiddenKeys(prev => new Set(prev).add(key))
                      setExpandedKey(null)
                    }} onDismiss={() => {
                      setHiddenKeys(prev => new Set(prev).add(key))
                      setExpandedKey(null)
                    }} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          )
        })}
      </tbody>
    </table>
    <div style={{
      display: 'flex', gap: 16, flexWrap: 'wrap',
      padding: '8px 16px', borderTop: '1px solid var(--border)',
      background: 'var(--surface-warm)',
    }}>
      {([
        ['critical', 'Kritisch'],
        ['high',     'Hoch'],
        ['medium',   'Mittel'],
        ['low',      'Niedrig'],
        ['info',     'Info'],
      ] as const).map(([sev, label]) => (
        <span key={sev} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          <span className={`severity-dot ${SEV_DOT[sev]}`} role="img" aria-label={label} />
          {label}
        </span>
      ))}
    </div>
    </>
  )
}
