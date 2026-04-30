'use client'

import React, { useState } from 'react'
import { Lightning, CaretDown, CaretUp, Copy, Check, X } from '@phosphor-icons/react'
import type { GlobalQuickWinFinding } from '@/lib/audit/quick-wins'
import type { AuditDomain } from '@/lib/audit/types'

interface GlobalQuickWinsBarProps {
  wins: GlobalQuickWinFinding[]
  runId?: string | null
  projectId?: string | null
}

const DOMAIN_LABEL: Record<AuditDomain, string> = {
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

function tabHref(domain: AuditDomain, runId?: string | null, projectId?: string | null): string {
  const params = new URLSearchParams()
  params.set('tab', domain)
  if (runId) params.set('runId', runId)
  if (projectId) params.set('project', projectId)
  return `/audit?${params.toString()}`
}

// ── Fix-Session Modal ──────────────────────────────────────────────────────

interface ModalProps {
  prompt: string
  fileCount: number
  estimatedMinutes: number
  onClose: () => void
}

function FixSessionModal({ prompt, fileCount, estimatedMinutes, onClose }: ModalProps) {
  const [copied, setCopied] = useState(false)

  function copy() {
    void navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(26,23,20,0.45)', backdropFilter: 'blur(2px)',
        }}
        aria-hidden="true"
      />
      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Fix-Session bereit"
        style={{
          position: 'fixed', inset: 0, zIndex: 201,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 16px',
        }}
      >
        <div style={{
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border)',
          borderRadius: 8, width: '100%', maxWidth: 680,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(26,23,20,0.16)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Fix-Session bereit
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {fileCount} {fileCount === 1 ? 'Datei' : 'Dateien'} · ~{estimatedMinutes} Min
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Schließen"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)' }}
            >
              <X size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>

          {/* Prompt preview */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
            <pre style={{
              margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11,
              lineHeight: 1.7, color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {prompt}
            </pre>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderTop: '1px solid var(--border)',
            background: 'var(--surface-warm)',
          }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', maxWidth: 360 }}>
              Füge den Prompt in Cursor oder Claude Code ein. Findings sind nach Datei sortiert.
            </p>
            <button
              onClick={copy}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
            >
              {copied
                ? <><Check size={14} weight="bold" aria-hidden="true" /> Kopiert</>
                : <><Copy size={14} weight="bold" aria-hidden="true" /> Prompt kopieren</>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function GlobalQuickWinsBar({ wins, runId, projectId }: GlobalQuickWinsBarProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<{ prompt: string; fileCount: number; estimatedMinutes: number } | null>(null)

  const totalMinutes = Math.round(wins.reduce((s, w) => s + w.effortMinutes, 0) / 5) * 5
  const totalGain = wins.reduce((s, w) => s + w.estimatedScoreGain, 0)
  const uniqueDomains = new Set(wins.map(w => w.domain)).size

  async function startSession() {
    if (!wins.length) return
    setLoading(true)
    try {
      const res = await fetch('/api/audit/fix-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingIds: wins.map(w => w.id) }),
      })
      const data = await res.json() as { prompt?: string; fileCount?: number; estimatedMinutes?: number }
      if (data.prompt) {
        setModal({ prompt: data.prompt, fileCount: data.fileCount ?? 0, estimatedMinutes: data.estimatedMinutes ?? 0 })
      }
    } catch {
      // silent fail — user can retry
    } finally {
      setLoading(false)
    }
  }

  if (!wins.length) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', marginBottom: 16,
        background: 'var(--surface-warm)', border: '1px solid var(--border)',
        borderRadius: 4,
      }}>
        <Lightning size={14} color="var(--text-tertiary)" weight="fill" aria-hidden="true" />
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          QUICK WINS · Keine offenen Quick-Wins. Solide Arbeit.
        </span>
      </div>
    )
  }

  return (
    <>
      {/* Bar */}
      <div style={{
        marginBottom: 16,
        background: 'var(--active-bg)',
        border: '1px solid rgba(168,184,82,0.25)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', flexWrap: 'wrap',
        }}>
          {/* Label */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--secondary)', flexShrink: 0,
          }}>
            <Lightning size={12} weight="fill" aria-hidden="true" />
            Quick Wins · {wins.length} schnelle Fixes
          </span>

          {/* Summary */}
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', flex: 1, minWidth: 160 }}>
            {wins.length} {wins.length === 1 ? 'Finding' : 'Findings'} aus {uniqueDomains} {uniqueDomains === 1 ? 'Domain' : 'Domains'}.
            {' '}~{totalMinutes} Min Bearbeitungszeit.
            {' '}Score +{totalGain.toFixed(1)} Punkte.
          </span>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => void startSession()}
              disabled={loading}
              className="btn btn-primary"
              style={{ fontSize: 12, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Lightning size={12} weight="fill" aria-hidden="true" />
              {loading ? 'Wird generiert…' : 'Fix-Session starten'}
            </button>
            <button
              onClick={() => setOpen(v => !v)}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, color: 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-mono)',
              }}
              aria-expanded={open}
            >
              {open
                ? <><CaretUp size={11} weight="bold" aria-hidden="true" /> Details verbergen</>
                : <><CaretDown size={11} weight="bold" aria-hidden="true" /> Details anzeigen</>}
            </button>
          </div>
        </div>

        {/* Accordion details */}
        {open && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {wins.map((w) => (
              <a
                key={w.id}
                href={tabHref(w.domain, runId, projectId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 16px', textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span
                  className={`severity-dot ${SEV_DOT[w.severity] ?? 'severity-dot--info'}`}
                  role="img"
                  aria-label={`Schweregrad: ${w.severity}`}
                />
                <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {w.title}
                </span>
                <span style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)',
                  color: 'var(--secondary)', flexShrink: 0,
                  background: 'rgba(168,184,82,0.12)', padding: '1px 6px', borderRadius: 3,
                }}>
                  {DOMAIN_LABEL[w.domain]}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--secondary)', flexShrink: 0, minWidth: 36, textAlign: 'right' }}>
                  +{w.estimatedScoreGain.toFixed(1)}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', flexShrink: 0, minWidth: 60, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'rtl' }}>
                  {w.filePath ?? '—'}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <FixSessionModal
          prompt={modal.prompt}
          fileCount={modal.fileCount}
          estimatedMinutes={modal.estimatedMinutes}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
