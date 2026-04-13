'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Copy, X, ListPlus, CaretDown } from '@phosphor-icons/react'

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

const SEV_DOT_COLOR: Record<string, string> = {
  critical: 'var(--error)',
  high:     'var(--warning)',
  medium:   'var(--text-tertiary)',
  low:      'var(--text-tertiary)',
  info:     'var(--text-tertiary)',
}

const SEV_LABEL: Record<string, string> = {
  critical: 'critical',
  high:     'high',
  medium:   'medium',
  low:      'low',
  info:     'info',
}

const SEV_LABEL_COLOR: Record<string, string> = {
  critical: 'var(--error)',
  high:     'var(--warning)',
  medium:   'var(--text-tertiary)',
  low:      'var(--text-tertiary)',
  info:     'var(--text-tertiary)',
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  // On touch devices (no hover), always show actions
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none)').matches)
  }, [])

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
    <div style={{ marginBottom: 40 }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 6, paddingBottom: 8, borderBottom: '1px solid var(--border)',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}>
          Top Findings
        </span>
        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, color: 'var(--text-tertiary)',
          }}
          onClick={scrollToAll}
        >
          Alle {totalCount} anzeigen
          <CaretDown size={11} weight="bold" aria-hidden="true" />
        </button>
      </div>

      {/* Finding rows */}
      <div>
        {top5.map((f, idx) => {
          const isTask     = !!taskMap[f.id]
          const isToggling = togglingIds.has(f.id)
          const isCopied   = copiedId === f.id
          const isExpanded = expandedId === f.id
          const isHovered  = hoveredId === f.id
          const isLast     = idx === top5.length - 1

          return (
            <div
              key={f.id}
              onMouseEnter={() => setHoveredId(f.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                borderBottom: isLast ? 'none' : '1px solid var(--border)',
                background: isHovered || isExpanded
                  ? 'rgba(26,23,20,0.03)'
                  : 'transparent',
                borderRadius: 4,
                transition: 'background 0.1s',
              }}
            >
              {/* Main row */}
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                gap: 10, padding: '10px 8px',
              }}>
                {/* Severity dot */}
                <span style={{
                  display: 'inline-block',
                  width: 8, height: 8, borderRadius: '50%',
                  background: SEV_DOT_COLOR[f.severity],
                  flexShrink: 0, marginTop: 5,
                }} aria-hidden="true" />

                {/* Content */}
                <button
                  style={{
                    flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', padding: 0, minWidth: 0,
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : f.id)}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {f.message}
                  </div>
                  {f.suggestion && !isExpanded && (
                    <div style={{
                      fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4,
                    }}>
                      {f.suggestion.length > 100 ? f.suggestion.slice(0, 100) + '…' : f.suggestion}
                    </div>
                  )}
                  {f.file_path && (
                    <div style={{
                      fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
                      color: 'var(--text-tertiary)', marginTop: 3,
                    }}>
                      {f.file_path}{f.line ? `:${f.line}` : ''}
                    </div>
                  )}
                </button>

                {/* Right: severity label + actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {/* Task + Prompt — hover-only, pointer-events off when hidden */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    opacity: isHovered || isExpanded || isTouchDevice ? 1 : 0,
                    pointerEvents: isHovered || isExpanded || isTouchDevice ? 'auto' : 'none',
                    transition: 'opacity 0.1s',
                  }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddTask(f) }}
                      disabled={isTask || isToggling}
                      title={isTask ? 'Bereits als Aufgabe gespeichert' : 'Als Aufgabe hinzufügen'}
                      style={{
                        background: 'none', border: 'none', cursor: isTask ? 'default' : 'pointer',
                        padding: '3px 6px', borderRadius: 4, fontSize: 11,
                        color: isTask ? 'var(--accent)' : 'var(--text-tertiary)',
                        display: 'flex', alignItems: 'center', gap: 3,
                        opacity: isTask ? 0.7 : 1,
                      }}
                    >
                      {isTask
                        ? <CheckCircle size={12} weight="fill" aria-hidden="true" />
                        : <ListPlus    size={12} weight="bold"  aria-hidden="true" />}
                      Task
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(f) }}
                      title="Als Prompt für Cursor oder Claude Code kopieren"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '3px 6px', borderRadius: 4, fontSize: 11,
                        color: isCopied ? 'var(--accent)' : 'var(--text-tertiary)',
                        display: 'flex', alignItems: 'center', gap: 3,
                      }}
                    >
                      {isCopied
                        ? <CheckCircle size={12} weight="fill" aria-hidden="true" />
                        : <Copy        size={12} weight="bold"  aria-hidden="true" />}
                      {isCopied ? 'Kopiert' : 'Prompt'}
                    </button>
                  </div>

                  {/* Severity label */}
                  <span style={{
                    fontSize: 11, fontWeight: 500,
                    color: SEV_LABEL_COLOR[f.severity],
                    minWidth: 44, textAlign: 'right',
                  }}>
                    {SEV_LABEL[f.severity]}
                  </span>

                  {/* Dismiss — always visible, always clickable */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDismiss(f) }}
                    disabled={isToggling}
                    title="Finding ignorieren"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '3px 4px', borderRadius: 4,
                      color: 'var(--text-tertiary)',
                      display: 'flex', alignItems: 'center',
                      opacity: isToggling ? 0.4 : 0.5,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = isToggling ? '0.4' : '0.5')}
                  >
                    <X size={12} weight="bold" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && f.suggestion && (
                <div style={{
                  padding: '0 8px 12px 26px',
                  fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
                }}>
                  {f.suggestion}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
