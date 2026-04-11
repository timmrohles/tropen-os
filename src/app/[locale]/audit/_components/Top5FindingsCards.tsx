'use client'

import { useState } from 'react'
import {
  WarningOctagon, Warning, Info, Note,
  CheckCircle, Copy, X, ListPlus, CaretDown,
} from '@phosphor-icons/react'

interface Finding {
  id: string
  rule_id: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  file_path: string | null
  line: number | null
  suggestion: string | null
  status: 'open' | 'acknowledged' | 'fixed' | 'dismissed'
  agent_source?: string | null
}

interface Top5FindingsCardsProps {
  findings: Finding[]
  runId: string
  scanProjectId?: string | null
  initialTaskMap: Record<string, string>
  totalCount: number
}

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

const SEV_ICON: Record<string, React.ReactNode> = {
  critical: <WarningOctagon size={16} weight="fill" aria-hidden="true" />,
  high:     <Warning        size={16} weight="fill" aria-hidden="true" />,
  medium:   <Info           size={16} weight="fill" aria-hidden="true" />,
  low:      <Note           size={16} weight="fill" aria-hidden="true" />,
  info:     <Info           size={16} weight="fill" aria-hidden="true" />,
}

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--error)',
  high:     'var(--error)',
  medium:   'var(--text-secondary)',
  low:      'var(--text-tertiary)',
  info:     'var(--text-tertiary)',
}

const SEV_BG: Record<string, string> = {
  critical: 'color-mix(in srgb, var(--error) 6%, transparent)',
  high:     'color-mix(in srgb, var(--error) 4%, transparent)',
  medium:   'transparent',
  low:      'transparent',
  info:     'transparent',
}

function buildCopyPrompt(f: Finding): string {
  const parts: string[] = []
  parts.push(`Problem: ${f.message}`)
  if (f.file_path) {
    parts.push(`Datei: ${f.file_path}${f.line ? ` (Zeile ${f.line})` : ''}`)
  }
  if (f.agent_source) {
    parts.push(`Kategorie: ${f.agent_source}`)
  }
  parts.push('')
  if (f.suggestion) {
    parts.push(`Was zu tun ist:\n${f.suggestion}`)
  } else {
    parts.push('Analysiere das Problem und behebe es.')
  }
  return parts.join('\n')
}

export default function Top5FindingsCards({
  findings,
  runId,
  scanProjectId,
  initialTaskMap,
  totalCount,
}: Top5FindingsCardsProps) {
  const [taskMap, setTaskMap] = useState<Record<string, string>>(initialTaskMap)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Top 5: open, not dismissed, sorted by severity
  const top5 = findings
    .filter((f) => f.status === 'open' && !dismissedIds.has(f.id))
    .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])
    .slice(0, 5)

  if (top5.length === 0) return null

  async function handleAddTask(f: Finding) {
    if (taskMap[f.id] || togglingIds.has(f.id)) return
    setTogglingIds((p) => { const s = new Set(p); s.add(f.id); return s })
    try {
      const res = await fetch('/api/audit/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding_id:      f.id,
          audit_run_id:    runId || undefined,
          scan_project_id: scanProjectId ?? null,
          title:           f.message.slice(0, 400),
          agent_source:    f.agent_source,
          rule_id:         f.rule_id,
          severity:        f.severity,
          file_path:       f.file_path,
          suggestion:      f.suggestion,
        }),
      })
      if (res.ok) {
        const data = await res.json() as { id: string }
        setTaskMap((p) => ({ ...p, [f.id]: data.id }))
      }
    } finally {
      setTogglingIds((p) => { const s = new Set(p); s.delete(f.id); return s })
    }
  }

  async function handleDismiss(f: Finding) {
    if (togglingIds.has(f.id)) return
    setTogglingIds((p) => { const s = new Set(p); s.add(f.id); return s })
    try {
      const res = await fetch(`/api/audit/findings/${f.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      })
      if (res.ok) {
        setDismissedIds((p) => { const s = new Set(p); s.add(f.id); return s })
      }
    } finally {
      setTogglingIds((p) => { const s = new Set(p); s.delete(f.id); return s })
    }
  }

  function handleCopy(f: Finding) {
    const text = buildCopyPrompt(f)
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(f.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  function scrollToAll() {
    const el = document.getElementById('findings-table')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Top Findings
        </span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={scrollToAll}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
        >
          Alle {totalCount} Findings anzeigen
          <CaretDown size={12} weight="bold" aria-hidden="true" />
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {top5.map((f) => {
          const isTask    = !!taskMap[f.id]
          const isToggling = togglingIds.has(f.id)
          const isCopied  = copiedId === f.id

          return (
            <div
              key={f.id}
              className="card"
              style={{
                padding: '14px 16px',
                background: SEV_BG[f.severity],
                borderLeft: `3px solid ${SEV_COLOR[f.severity]}`,
                borderRadius: 8,
              }}
            >
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <span style={{ color: SEV_COLOR[f.severity], flexShrink: 0, paddingTop: 1 }}>
                  {SEV_ICON[f.severity]}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, flex: 1 }}>
                  {f.message}
                </span>
              </div>

              {/* Context (file + suggestion) */}
              {(f.file_path || f.suggestion) && (
                <div style={{ marginLeft: 24, marginBottom: 10 }}>
                  {f.file_path && (
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, fontFamily: 'var(--font-mono, monospace)' }}>
                      {f.file_path}{f.line ? `:${f.line}` : ''}
                    </p>
                  )}
                  {f.suggestion && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {f.suggestion.length > 140 ? f.suggestion.slice(0, 140) + '…' : f.suggestion}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 24, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleAddTask(f)}
                  disabled={isTask || isToggling}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                  title={isTask ? 'Bereits als Aufgabe gespeichert' : 'Als Aufgabe hinzufügen'}
                >
                  {isTask
                    ? <><CheckCircle size={13} weight="fill" color="var(--accent)" aria-hidden="true" /> Aufgabe</>
                    : <><ListPlus    size={13} weight="bold"                        aria-hidden="true" /> Als Aufgabe</>
                  }
                </button>

                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleCopy(f)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                  title="Als Prompt für Cursor oder Claude Code kopieren"
                >
                  {isCopied
                    ? <><CheckCircle size={13} weight="fill" color="var(--accent)" aria-hidden="true" /> Kopiert</>
                    : <><Copy        size={13} weight="bold"                        aria-hidden="true" /> Als Prompt kopieren</>
                  }
                </button>

                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDismiss(f)}
                  disabled={isToggling}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-tertiary)' }}
                  title="Finding ignorieren"
                >
                  <X size={13} weight="bold" aria-hidden="true" />
                  Ignorieren
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
