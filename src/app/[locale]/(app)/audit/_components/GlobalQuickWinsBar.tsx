'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Lightning, CaretDown, CaretUp, Copy, Check, X } from '@phosphor-icons/react'
// Inline types — no import from server-only modules (rule-registry chain)
interface QuickWinFinding {
  id: string
  ruleId: string
  severity: string
  title: string
  domain: string
  estimatedScoreGain: number
  filePath: string | null
}

interface QuickWinCluster {
  filePath: string | null
  findings: QuickWinFinding[]
  totalScoreGain: number
}

interface GlobalQuickWinsBarProps {
  clusters: QuickWinCluster[]
  runId?: string | null
  projectId?: string | null
}

const DOMAIN_LABEL: Record<string, string> = {
  'code-quality': 'Code',
  'performance':  'Perf',
  'security':     'Sec',
  'accessibility':'A11y',
  'dsgvo':        'DSGVO',
  'ki-act':       'KI-Act',
  'documentation':'Doku',
}

const SEV_DOT: Record<string, string> = {
  critical: 'severity-dot--critical',
  high:     'severity-dot--high',
  medium:   'severity-dot--medium',
  low:      'severity-dot--low',
  info:     'severity-dot--info',
}

const BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  border: '1px solid var(--secondary)', borderRadius: 4, padding: '3px 8px',
  fontSize: 11, color: 'var(--active-bg)', cursor: 'pointer',
  fontFamily: 'var(--font-mono)', background: 'var(--secondary)',
}

const BTN_GHOST: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, padding: '3px 8px',
  fontSize: 11, color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
  fontFamily: 'var(--font-mono)', background: 'transparent',
}

// tabHref is now a method on the component (uses auditBase from usePathname)

function shortPath(p: string): string {
  const parts = p.replace(/\\/g, '/').split('/')
  return parts.length > 2 ? parts.slice(-2).join('/') : p
}

export default function GlobalQuickWinsBar({ clusters, runId, projectId }: GlobalQuickWinsBarProps) {
  const pathname = usePathname() // e.g. "/de/audit"
  const auditBase = pathname.split('/').slice(0, 2).join('/') + '/audit' // "/de/audit"
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<{ prompt: string; fileCount: number } | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const allFindings = clusters.flatMap(c => c.findings)
  const totalScoreGain = clusters.reduce((s, c) => s + c.totalScoreGain, 0)

  async function startSession() {
    if (!allFindings.length) return
    setLoading(true)
    setSessionError(null)
    setSession(null)
    try {
      const res = await fetch('/api/audit/fix-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingIds: allFindings.map(f => f.id) }),
      })
      const data = await res.json() as { prompt?: string; fileCount?: number; error?: string }
      if (!res.ok) {
        setSessionError(data.error ?? `Fehler ${res.status}`)
        return
      }
      if (data.prompt) {
        setSession({ prompt: data.prompt, fileCount: data.fileCount ?? 0 })
        setOpen(false)
      } else {
        setSessionError('Kein Prompt generiert — bitte erneut versuchen')
      }
    } catch (e) {
      setSessionError(e instanceof Error ? e.message : 'Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    if (!session?.prompt) return
    void navigator.clipboard.writeText(session.prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!clusters.length) {
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 4, background: '#fff', marginBottom: 16 }}>
        <div className="app-section__header">
          <span className="app-section__header-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Lightning size={11} weight="fill" aria-hidden="true" />
            Dein nächster Sprint
          </span>
          <span>Keine offenen Quick-Wins</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 4, background: '#fff', marginBottom: 16 }}>

      {/* Header-Balken — wie SCORE / CODE-QUALITÄT */}
      <div className="app-section__header">
        <span className="app-section__header-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Lightning size={11} weight="fill" aria-hidden="true" />
          Dein nächster Sprint
        </span>
        <span>{allFindings.length} Findings · Score +{totalScoreGain.toFixed(1)}</span>
      </div>

      {/* Action-Zeile */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', flexWrap: 'wrap',
        borderBottom: (open || session) ? '1px solid var(--border)' : 'none',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, minWidth: 160 }}>
          Höchster Impact, nach Datei geclustert — eine Datei nach der anderen.
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <button
            onClick={() => void startSession()}
            disabled={loading}
            className="btn btn-primary"
            style={{ fontSize: 12, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Lightning size={12} weight="fill" aria-hidden="true" />
            {loading ? 'Wird generiert…' : 'Fix-Session starten'}
          </button>
          {sessionError && (
            <span style={{ fontSize: 11, color: 'var(--error)', fontFamily: 'var(--font-mono)' }}>
              ⚠ {sessionError}
            </span>
          )}
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
            }}
            aria-expanded={open}
          >
            {open
              ? <><CaretUp size={11} weight="bold" aria-hidden="true" /> verbergen</>
              : <><CaretDown size={11} weight="bold" aria-hidden="true" /> Details</>}
          </button>
        </div>
      </div>

      {/* Cluster-Akkordeon */}
      {open && (
        <div style={{ borderBottom: session ? '1px solid var(--border)' : 'none' }}>
          {clusters.map((cluster, ci) => (
            <div key={cluster.filePath ?? '__no_file__'}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 16px', background: 'var(--surface-warm)',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  {String(ci + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {cluster.filePath ? shortPath(cluster.filePath) : '— globale Fixes'}
                </span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--secondary)', flexShrink: 0 }}>
                  +{cluster.totalScoreGain.toFixed(1)}
                </span>
              </div>
              {cluster.findings.map((w) => (
                <a
                  key={w.id}
                  href={`${auditBase}?tab=${w.domain}${runId ? `&runId=${runId}` : ''}${projectId ? `&project=${projectId}` : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 16px 7px 36px', textDecoration: 'none',
                    borderBottom: '1px solid var(--border)', background: '#fff',
                  }}
                >
                  <span className={`severity-dot ${SEV_DOT[w.severity] ?? 'severity-dot--info'}`} role="img" aria-label={`Schweregrad: ${w.severity}`} />
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {w.title}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--secondary)', flexShrink: 0, background: 'var(--secondary-light)', padding: '1px 6px', borderRadius: 3 }}>
                    {DOMAIN_LABEL[w.domain]}
                  </span>
                </a>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Fix-Session Prompt — inline, dunkel, wie PromptBox in FindingsTableApp */}
      {session && (
        <div style={{ background: 'var(--active-bg)', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '14px 16px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4,
            }}>
              Fix-Session · {session.fileCount} {session.fileCount === 1 ? 'Datei' : 'Dateien'} — einzelne Fix-Prompts findest du in den Findings unten.
            </span>
            <pre style={{
              margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11,
              lineHeight: 1.7, color: 'rgba(255,255,255,0.75)',
              whiteSpace: 'pre-wrap', maxHeight: 320, overflow: 'auto',
            }}>
              {session.prompt}
            </pre>
          </div>
          <div style={{
            display: 'flex', gap: 6, padding: '10px 16px',
            background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <button onClick={copy} style={BTN}>
              {copied ? <><Check size={11} weight="bold" aria-hidden="true" /> Kopiert</> : <><Copy size={11} weight="bold" aria-hidden="true" /> Kopieren</>}
            </button>
            <button onClick={() => setSession(null)} style={BTN_GHOST}>
              <X size={11} weight="bold" aria-hidden="true" /> Schließen
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
