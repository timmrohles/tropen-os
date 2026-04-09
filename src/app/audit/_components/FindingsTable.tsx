'use client'

import { useState, useCallback } from 'react'
import {
  WarningOctagon, Warning, Info, Note, CaretDown, CaretUp,
} from '@phosphor-icons/react/dist/ssr'
import { Wrench, Spinner as PhosphorSpinner, Scales } from '@phosphor-icons/react/dist/ssr'
import type { AgentSource } from '@/lib/audit/types'
import type { GeneratedFix } from '@/lib/fix-engine/types'
import dynamic from 'next/dynamic'

const FixPreview = dynamic(() => import('./FixPreview'), { ssr: false })

interface DbFinding {
  id: string
  rule_id: string
  category_id: number
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
  file_path: string | null
  line: number | null
  suggestion: string | null
  status: 'open' | 'acknowledged' | 'fixed' | 'dismissed'
  resolved_at: string | null
  agent_source?: AgentSource | null
  agent_rule_id?: string | null
  enforcement?: string | null
  consensus_level?: 'unanimous' | 'majority' | 'split' | 'single' | null
  models_flagged?: string[] | null
}

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low' | 'info'
type StatusFilter = 'all' | 'open' | 'acknowledged' | 'fixed' | 'dismissed'
type AgentFilter = 'all' | AgentSource
type SortKey = 'severity' | 'rule' | 'file' | 'message'

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

interface FindingsTableProps {
  findings: DbFinding[]
  runId?: string
}

const SEVERITY_ICON = {
  critical: <WarningOctagon size={14} weight="fill" aria-hidden="true" />,
  high:     <Warning size={14} weight="fill" aria-hidden="true" />,
  medium:   <Info size={14} weight="fill" aria-hidden="true" />,
  low:      <Note size={14} weight="fill" aria-hidden="true" />,
  info:     <Info size={14} weight="fill" aria-hidden="true" />,
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'var(--error)',
  high:     'var(--error)',
  medium:   'var(--text-secondary)',
  low:      'var(--text-tertiary)',
  info:     'var(--text-tertiary)',
}

const CONSENSUS_LABEL: Record<string, string> = { unanimous: '4/4', majority: '3/4', split: '2/4', single: '1/4' }
const MODEL_SHORT: Record<string, string> = {
  anthropic: 'Claude',
  openai:    'GPT',
  google:    'Gemini',
  xai:       'Grok',
}
const _neutral = (label: string) => ({
  label,
  bg: 'color-mix(in srgb, var(--text-secondary) 12%, transparent)',
  color: 'var(--text-secondary)',
})
const AGENT_BADGE: Record<AgentSource, { label: string; bg: string; color: string }> = {
  security:      { label: 'Sec',   bg: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)' },
  architecture:  { label: 'Arch',  bg: 'color-mix(in srgb, var(--accent) 15%, transparent)',         color: 'var(--accent)' },
  observability: { label: 'Obs',   bg: 'color-mix(in srgb, var(--text-secondary) 15%, transparent)', color: 'var(--text-secondary)' },
  core:          { label: 'Core',  bg: 'var(--border)',                                               color: 'var(--text-tertiary)' },
  'code-style':  _neutral('Style'),
  'error-handling': _neutral('Err'),
  database:      _neutral('DB'),
  dependencies:  _neutral('Deps'),
  'git-governance': _neutral('Git'),
  'backup-dr':   _neutral('DR'),
  testing:       { label: 'Test',  bg: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' },
  performance:   _neutral('Perf'),
  platform:      _neutral('CI/CD'),
  api:           _neutral('API'),
  'cost-awareness': _neutral('Cost'),
  scalability:   _neutral('Scale'),
  accessibility: { label: 'A11y', bg: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' },
  'design-system': _neutral('DS'),
  content:       _neutral('i18n'),
  legal:         _neutral('Legal'),
  'ai-integration': _neutral('AI'),
  analytics:     _neutral('Track'),
}

const STATUS_OPTIONS: Array<{ value: DbFinding['status']; label: string }> = [
  { value: 'open', label: 'Offen' },
  { value: 'acknowledged', label: 'Bekannt' },
  { value: 'fixed', label: 'Behoben' },
  { value: 'dismissed', label: 'Ignoriert' },
]

const SEVERITY_COUNTS = (findings: DbFinding[], sev: string) =>
  findings.filter((f) => f.severity === sev).length

export default function FindingsTable({ findings: initialFindings, runId }: FindingsTableProps) {
const [findings, setFindings] = useState<DbFinding[]>(initialFindings)
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [agentFilter, setAgentFilter] = useState<AgentFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('severity')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [fixingId, setFixingId] = useState<string | null>(null)
  const [consensusFixingId, setConsensusFixingId] = useState<string | null>(null)
  const [fixes, setFixes] = useState<Record<string, GeneratedFix>>({})
  const [fixErrors, setFixErrors] = useState<Record<string, string>>({})

  const filtered = findings
    .filter((f) => {
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false
      if (statusFilter !== 'all' && f.status !== statusFilter) return false
      if (agentFilter !== 'all' && (f.agent_source ?? 'core') !== agentFilter) return false
      return true
    })
    .sort((a, b) => {
      let v = 0
      if (sortKey === 'severity') v = SEV_ORDER[a.severity] - SEV_ORDER[b.severity]
      if (sortKey === 'rule')     v = a.rule_id.localeCompare(b.rule_id)
      if (sortKey === 'file')     v = (a.file_path ?? '').localeCompare(b.file_path ?? '')
      if (sortKey === 'message')  v = a.message.localeCompare(b.message)
      return sortDir === 'asc' ? v : -v
    })

  const allSelected = filtered.length > 0 && filtered.every((f) => selected.has(f.id))

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map((f) => f.id)))
  }

  const handleStatusChange = useCallback(async (findingId: string, newStatus: DbFinding['status']) => {
    setUpdatingId(findingId)
    try {
      const res = await fetch(`/api/audit/findings/${findingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setFindings((prev) => prev.map((f) => f.id === findingId ? { ...f, status: newStatus } : f))
      }
    } finally {
      setUpdatingId(null)
    }
  }, [])

  const handleBulkStatus = useCallback(async (newStatus: DbFinding['status']) => {
    if (selected.size === 0) return
    setBulkUpdating(true)
    try {
      const ids = [...selected]
      await Promise.all(ids.map((id) =>
        fetch(`/api/audit/findings/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
      ))
      setFindings((prev) => prev.map((f) => selected.has(f.id) ? { ...f, status: newStatus } : f))
      setSelected(new Set())
    } finally {
      setBulkUpdating(false)
    }
  }, [selected])

  const handleGenerateFix = useCallback(async (findingId: string, runId: string) => {
    setFixingId(findingId)
    setFixErrors((prev) => { const n = { ...prev }; delete n[findingId]; return n })
    try {
      const res = await fetch('/api/audit/fix/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId, runId }),
      })
      const data = await res.json() as {
        fixId?: string; explanation?: string; confidence?: string; diffs?: unknown[]; model?: string; costEur?: number; error?: string; status?: string;
        riskLevel?: string; riskAssessment?: unknown
      }
      if (res.status === 409 && data.fixId) {
        // Fix already exists — load it
        // Expand the row to show existing fix info
        setFixes((prev) => ({
          ...prev,
          [findingId]: {
            id: data.fixId!,
            explanation: 'Fix bereits generiert.',
            confidence: 'medium' as const,
            diffs: [],
            status: (data.status ?? 'pending') as 'pending' | 'applied' | 'rejected',
            model: '',
            costEur: 0,
            generatedAt: '',
            appliedAt: null,
            rejectedAt: null,
            appliedBy: null,
            findingId,
            runId,
            ruleId: '',
            categoryId: 0,
            severity: '',
            message: '',
            filePath: null,
            line: null,
            suggestion: null,
          },
        }))
        return
      }
      if (!res.ok || !data.fixId) {
        setFixErrors((prev) => ({ ...prev, [findingId]: data.error ?? 'Fehler' }))
        return
      }
      setFixes((prev) => ({
        ...prev,
        [findingId]: {
          id: data.fixId!,
          explanation: data.explanation!,
          confidence: data.confidence as 'high' | 'medium' | 'low',
          diffs: (data.diffs ?? []) as import('@/lib/fix-engine/types').FileDiff[],
          status: 'pending',
          model: data.model ?? '',
          costEur: data.costEur ?? 0,
          generatedAt: new Date().toISOString(),
          appliedAt: null,
          rejectedAt: null,
          appliedBy: null,
          findingId,
          runId,
          ruleId: '',
          categoryId: 0,
          severity: '',
          message: '',
          filePath: null,
          line: null,
          suggestion: null,
          fixMode: 'quick' as const,
          riskLevel: data.riskLevel as import('@/lib/fix-engine/types').RiskLevel | undefined,
          riskAssessment: data.riskAssessment as import('@/lib/fix-engine/types').RiskAssessment | undefined,
        },
      }))
      setExpandedId(findingId)
    } catch {
      setFixErrors((prev) => ({ ...prev, [findingId]: 'Netzwerkfehler' }))
    } finally {
      setFixingId(null)
    }
  }, [])

  const handleGenerateConsensusFix = useCallback(async (findingId: string, runId: string) => {
    setConsensusFixingId(findingId)
    setFixErrors((prev) => { const n = { ...prev }; delete n[findingId]; return n })
    try {
      const res = await fetch('/api/audit/fix/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId, runId }),
      })
      const data = await res.json() as {
        fixId?: string; explanation?: string; confidence?: string; diffs?: unknown[]; model?: string; costEur?: number
        fixMode?: string; consensusLevel?: string; winnerProviderId?: string; judgeExplanation?: string
        draftsCount?: number; riskLevel?: string; riskAssessment?: unknown; error?: string; status?: string
      }
      if (res.status === 409 && data.fixId) {
        setFixes((prev) => ({
          ...prev,
          [findingId]: {
            id: data.fixId!, explanation: 'Konsens-Fix bereits generiert.',
            confidence: 'medium' as const, diffs: [],
            status: (data.status ?? 'pending') as 'pending' | 'applied' | 'rejected',
            model: '', costEur: 0, generatedAt: '', appliedAt: null, rejectedAt: null, appliedBy: null,
            findingId, runId, ruleId: '', categoryId: 0, severity: '', message: '', filePath: null, line: null, suggestion: null,
            fixMode: 'consensus' as const,
          },
        }))
        setExpandedId(findingId)
        return
      }
      if (!res.ok || !data.fixId) {
        setFixErrors((prev) => ({ ...prev, [findingId]: data.error ?? 'Fehler' }))
        return
      }
      setFixes((prev) => ({
        ...prev,
        [findingId]: {
          id: data.fixId!, explanation: data.explanation!,
          confidence: data.confidence as 'high' | 'medium' | 'low',
          diffs: (data.diffs ?? []) as import('@/lib/fix-engine/types').FileDiff[],
          status: 'pending', model: data.model ?? '', costEur: data.costEur ?? 0,
          generatedAt: new Date().toISOString(), appliedAt: null, rejectedAt: null, appliedBy: null,
          findingId, runId, ruleId: '', categoryId: 0, severity: '', message: '', filePath: null, line: null, suggestion: null,
          fixMode: 'consensus' as const,
          riskLevel: data.riskLevel as import('@/lib/fix-engine/types').RiskLevel | undefined,
          riskAssessment: data.riskAssessment as import('@/lib/fix-engine/types').RiskAssessment | undefined,
          judgeExplanation: data.judgeExplanation,
        },
      }))
      setExpandedId(findingId)
    } catch {
      setFixErrors((prev) => ({ ...prev, [findingId]: 'Netzwerkfehler' }))
    } finally {
      setConsensusFixingId(null)
    }
  }, [])

  const severityChips: Array<{ value: SeverityFilter; label: string }> = [
    { value: 'all', label: `Alle (${findings.length})` },
    { value: 'critical', label: `Critical (${SEVERITY_COUNTS(findings, 'critical')})` },
    { value: 'high', label: `High (${SEVERITY_COUNTS(findings, 'high')})` },
    { value: 'medium', label: `Medium (${SEVERITY_COUNTS(findings, 'medium')})` },
    { value: 'low', label: `Low (${SEVERITY_COUNTS(findings, 'low')})` },
  ]

  const statusChips: Array<{ value: StatusFilter; label: string }> = [
    { value: 'all', label: 'Alle' },
    { value: 'open', label: 'Offen' },
    { value: 'acknowledged', label: 'Bekannt' },
    { value: 'fixed', label: 'Behoben' },
    { value: 'dismissed', label: 'Ignoriert' },
  ]

  const agentChips: Array<{ value: AgentFilter; label: string }> = [
    { value: 'all', label: 'Alle Agents' },
    { value: 'core', label: 'Core' },
    { value: 'security', label: 'Security' },
    { value: 'architecture', label: 'Architektur' },
    { value: 'observability', label: 'Observability' },
    { value: 'code-style', label: 'Code Style' },
    { value: 'testing', label: 'Testing' },
    { value: 'database', label: 'Database' },
    { value: 'api', label: 'API' },
    { value: 'platform', label: 'Platform' },
    { value: 'legal', label: 'Legal' },
    { value: 'accessibility', label: 'A11y' },
    { value: 'ai-integration', label: 'AI' },
  ]

  if (findings.length === 0) {
    return (
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div className="card-header" style={{ marginBottom: 8 }}>
          <span className="card-header-label">Findings</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
          Keine Findings in diesem Run.
        </p>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
      <div className="card-header" style={{ marginBottom: 14 }}>
        <span className="card-header-label">Findings</span>
        <span suppressHydrationWarning style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          {filtered.length} von {findings.length}
        </span>
      </div>

      {/* Severity filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {severityChips.map(({ value, label }) => (
          <button key={value} className={`chip${severityFilter === value ? ' chip--active' : ''}`}
            onClick={() => setSeverityFilter(value)}>{label}</button>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {statusChips.map(({ value, label }) => (
          <button key={value} className={`chip${statusFilter === value ? ' chip--active' : ''}`}
            onClick={() => setStatusFilter(value)}>{label}</button>
        ))}
      </div>

      {/* Agent filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {agentChips.map(({ value, label }) => (
          <button key={value} className={`chip${agentFilter === value ? ' chip--active' : ''}`}
            onClick={() => setAgentFilter(value)}>{label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>
          Keine Findings für diese Filter.
        </p>
      ) : (
        <>
        {selected.size > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            padding: '8px 12px', borderRadius: 8,
            background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
              {selected.size} ausgewählt
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginRight: 4 }}>→</span>
            {(['open', 'acknowledged', 'fixed', 'dismissed'] as DbFinding['status'][]).map((s) => (
              <button key={s} className="btn btn-ghost btn-sm"
                disabled={bulkUpdating}
                onClick={() => handleBulkStatus(s)}
                style={{ fontSize: 12, opacity: bulkUpdating ? 0.5 : 1 }}>
                {s === 'open' ? 'Offen' : s === 'acknowledged' ? 'Bekannt' : s === 'fixed' ? 'Behoben' : 'Ignorieren'}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}
              style={{ marginLeft: 'auto', fontSize: 12 }}>
              Abwählen
            </button>
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {/* Select-all checkbox */}
              <th style={{ padding: '6px 8px', width: 28 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                  style={{ cursor: 'pointer' }} aria-label="Alle auswählen" />
              </th>
              {/* Sortable headers */}
              {([
                { key: 'severity', label: 'Sev' },
                { key: null,       label: 'Agent' },
                { key: 'rule',     label: 'Regel' },
                { key: 'message',  label: 'Meldung' },
                { key: 'file',     label: 'Datei' },
                { key: null,       label: 'Status' },
              ] as { key: SortKey | null; label: string }[]).map(({ key, label }) => (
                <th key={label} style={{
                  padding: '6px 8px', textAlign: 'left',
                  fontSize: 11, color: key && sortKey === key ? 'var(--accent)' : 'var(--text-tertiary)',
                  fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                  cursor: key ? 'pointer' : 'default', whiteSpace: 'nowrap',
                  userSelect: 'none',
                }} onClick={() => key && toggleSort(key)}>
                  {label}
                  {key && sortKey === key && (
                    sortDir === 'asc'
                      ? <CaretUp size={10} weight="bold" style={{ marginLeft: 3 }} aria-hidden="true" />
                      : <CaretDown size={10} weight="bold" style={{ marginLeft: 3 }} aria-hidden="true" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.flatMap((f) => {
              const isExpanded = expandedId === f.id
              const agentKey = (f.agent_source ?? 'core') as AgentSource
              const badge = AGENT_BADGE[agentKey] ?? AGENT_BADGE.core

              const isSelected = selected.has(f.id)
              const mainRow = (
                <tr key={f.id} style={{
                  borderBottom: isExpanded ? 'none' : '1px solid var(--border)',
                  background: isSelected ? 'color-mix(in srgb, var(--accent) 6%, transparent)'
                    : isExpanded ? 'var(--bg-surface)' : 'transparent',
                }}>
                  {/* Checkbox */}
                  <td style={{ padding: '8px', verticalAlign: 'middle', width: 28 }}>
                    <input type="checkbox" checked={isSelected}
                      onChange={() => toggleSelect(f.id)}
                      style={{ cursor: 'pointer' }} aria-label="Finding auswählen" />
                  </td>
                  {/* Severity */}
                  <td style={{ padding: '8px', color: SEVERITY_COLOR[f.severity], verticalAlign: 'middle' }}>
                    {SEVERITY_ICON[f.severity]}
                  </td>

                  {/* Agent badge + consensus */}
                  <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: badge.bg, color: badge.color, whiteSpace: 'nowrap',
                    }}>
                      {badge.label}
                    </span>
                    {f.consensus_level && (
                      <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, marginTop: 2 }}>
                        {CONSENSUS_LABEL[f.consensus_level]}
                      </div>
                    )}
                  </td>

                  {/* Rule ID */}
                  <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                    <code style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--border)', padding: '2px 5px', borderRadius: 3 }}>
                      {f.rule_id}
                    </code>
                  </td>

                  {/* Message + models + expand */}
                  <td style={{ padding: '8px', verticalAlign: 'middle', maxWidth: 320 }}>
                    <button
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 4, padding: 0,
                        color: 'var(--text-primary)', fontSize: 13, width: '100%',
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : f.id)}
                    >
                      <span style={{ flex: 1, lineHeight: 1.4 }}>{f.message}</span>
                      {f.suggestion && (
                        isExpanded
                          ? <CaretUp size={12} weight="bold" style={{ flexShrink: 0, marginTop: 3, color: 'var(--text-tertiary)' }} aria-hidden="true" />
                          : <CaretDown size={12} weight="bold" style={{ flexShrink: 0, marginTop: 3, color: 'var(--text-tertiary)' }} aria-hidden="true" />
                      )}
                    </button>
                    {f.models_flagged && f.models_flagged.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {f.models_flagged.map((m) => (
                          <span key={m} style={{
                            fontSize: 10, padding: '1px 6px', borderRadius: 10,
                            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                            color: 'var(--accent)', fontWeight: 600,
                          }}>
                            {MODEL_SHORT[m] ?? m}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* File */}
                  <td style={{ padding: '8px', verticalAlign: 'middle', maxWidth: 160 }}>
                    {f.file_path ? (
                      <code style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.file_path}{f.line ? `:${f.line}` : ''}
                      </code>
                    ) : <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>}
                  </td>

                  {/* Status + Fix */}
                  <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      <select
                        value={f.status}
                        disabled={updatingId === f.id}
                        onChange={(e) => handleStatusChange(f.id, e.target.value as DbFinding['status'])}
                        style={{
                          fontSize: 12, padding: '3px 6px', borderRadius: 4,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          opacity: updatingId === f.id ? 0.5 : 1,
                        }}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      {runId && (
                        <div style={{ display: 'inline-flex', borderRadius: 4, border: '1px solid var(--border)' }}>
                          {/* Quick fix button */}
                          <button
                              title="Quick Fix (1 Modell)"
                              disabled={fixingId === f.id || consensusFixingId === f.id}
                              onClick={() => handleGenerateFix(f.id, runId)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: 11, padding: '2px 7px',
                                border: 'none', borderRight: '1px solid var(--border)',
                                background: 'var(--bg-surface)', color: 'var(--accent)',
                                cursor: 'pointer', fontWeight: 600,
                                opacity: (fixingId === f.id || consensusFixingId === f.id) ? 0.6 : 1,
                              }}
                            >
                              {fixingId === f.id
                                ? <PhosphorSpinner size={11} weight="bold" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                                : <Wrench size={11} weight="bold" aria-hidden="true" />
                              }
                              {fixingId !== f.id && 'Quick'}
                            </button>
                            {/* Consensus fix button */}
                            <button
                              title="Konsens-Fix (4 Modelle + Opus-Judge)"
                              disabled={fixingId === f.id || consensusFixingId === f.id}
                              onClick={() => handleGenerateConsensusFix(f.id, runId)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: 11, padding: '2px 7px',
                                border: 'none',
                                background: 'var(--bg-surface)', color: 'var(--accent)',
                                cursor: 'pointer', fontWeight: 600,
                                opacity: (fixingId === f.id || consensusFixingId === f.id) ? 0.6 : 1,
                              }}
                            >
                              {consensusFixingId === f.id
                                ? <PhosphorSpinner size={11} weight="bold" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                                : <Scales size={11} weight="bold" aria-hidden="true" />
                              }
                              {consensusFixingId !== f.id && '4M'}
                            </button>
                          </div>
                      )}
                      {fixErrors[f.id] && (
                        <span style={{ fontSize: 10, color: 'var(--error)', maxWidth: 120, wordBreak: 'break-word' }}>
                          {fixErrors[f.id]}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )

              const hasDetail = isExpanded && (f.suggestion || fixes[f.id] || fixErrors[f.id])
              if (!hasDetail) return [mainRow]

              return [
                mainRow,
                <tr key={`${f.id}-detail`} style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <td colSpan={7} style={{ padding: '0 8px 12px 32px' }}>
                    {f.suggestion && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--text-tertiary)' }}>Vorschlag: </strong>
                        {f.suggestion}
                      </p>
                    )}
                    {fixes[f.id] && (
                      <FixPreview
                        fix={fixes[f.id]}
                        onApplied={() => setFindings((prev) => prev.map((fd) => fd.id === f.id ? { ...fd, status: 'fixed' } : fd))}
                        onRejected={() => setFixes((prev) => { const n = { ...prev }; delete n[f.id]; return n })}
                      />
                    )}
                    {fixErrors[f.id] && (
                      <p style={{ fontSize: 12, color: 'var(--error)', margin: '4px 0 0' }}>
                        {fixErrors[f.id]}
                      </p>
                    )}
                  </td>
                </tr>,
              ]
            })}
          </tbody>
        </table>
        </>
      )}
    </div>
  )
}
