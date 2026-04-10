'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  WarningOctagon, Warning, Info, Note, CaretDown, CaretUp,
  Spinner as PhosphorSpinner, Scales, CheckCircle, X, DownloadSimple,
} from '@phosphor-icons/react'
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
  affected_files?: string[] | null
  fix_hint?: string | null
}

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low' | 'info'
type StatusFilter = 'all' | 'open' | 'acknowledged' | 'fixed' | 'dismissed'
type AgentFilter = 'all' | AgentSource
type SortKey = 'severity' | 'rule' | 'file' | 'message'

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

interface FindingGroup {
  ruleId: string
  baseMessage: string
  agentSource: AgentSource
  severity: DbFinding['severity']
  findings: DbFinding[]
  count: number
}

function isGroup(item: DbFinding | FindingGroup): item is FindingGroup {
  return 'count' in item
}

function extractBaseMessage(message: string): string {
  const colonIdx = message.lastIndexOf(': src/')
  if (colonIdx > 0) return message.substring(0, colonIdx)
  const colonIdx2 = message.lastIndexOf(': ')
  if (colonIdx2 > message.length * 0.5) return message.substring(0, colonIdx2)
  return message
}

function getHighestSeverity(findings: DbFinding[]): DbFinding['severity'] {
  return findings.reduce<DbFinding['severity']>((best, f) => {
    return SEV_ORDER[f.severity] < SEV_ORDER[best] ? f.severity : best
  }, 'info')
}

function groupFindings(findings: DbFinding[]): Array<DbFinding | FindingGroup> {
  const groups = new Map<string, DbFinding[]>()
  for (const f of findings) {
    const key = f.rule_id || 'unknown'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(f)
  }
  const result: Array<DbFinding | FindingGroup> = []
  for (const [ruleId, group] of groups) {
    if (group.length === 1) {
      result.push(group[0])
    } else {
      result.push({
        ruleId,
        baseMessage: extractBaseMessage(group[0].message),
        agentSource: (group[0].agent_source ?? 'core') as AgentSource,
        severity: getHighestSeverity(group),
        findings: group,
        count: group.length,
      })
    }
  }
  return result.sort((a, b) => {
    const sevA = SEV_ORDER[isGroup(a) ? a.severity : a.severity]
    const sevB = SEV_ORDER[isGroup(b) ? b.severity : b.severity]
    if (sevA !== sevB) return sevA - sevB
    return (isGroup(b) ? b.count : 1) - (isGroup(a) ? a.count : 1)
  })
}

function isFileSizeGroup(group: FindingGroup): boolean {
  return group.findings.some(f => /\d+\s*lines?/i.test(f.message))
}

function extractLineCount(message: string): number {
  const match = message.match(/\((\d+)\s*lines?\)/) ?? message.match(/(\d+)\s*lines?/)
  return match ? parseInt(match[1]) : 0
}

interface FindingsTableProps {
  findings: DbFinding[]
  runId?: string
  statusFilter?: string
  severityFilter?: string
  agentFilter?: string
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
  analytics:          _neutral('Track'),
  'security-scan':    { label: 'SecScan', bg: '#fef2f2', color: '#dc2626' },
  dsgvo:              _neutral('DSGVO'),
  bfsg:               _neutral('BFSG'),
  'ai-act':           _neutral('AI Act'),
}

const STATUS_OPTIONS: Array<{ value: DbFinding['status']; label: string }> = [
  { value: 'open', label: 'Offen' },
  { value: 'acknowledged', label: 'Bekannt' },
  { value: 'fixed', label: 'Behoben' },
  { value: 'dismissed', label: 'Ignoriert' },
]

const SEVERITY_COUNTS = (findings: DbFinding[], sev: string) =>
  findings.filter((f) => f.severity === sev).length

export default function FindingsTable({
  findings: initialFindings,
  runId,
  statusFilter: statusFilterProp = 'all',
  severityFilter: severityFilterProp = 'all',
  agentFilter: agentFilterProp = 'all',
}: FindingsTableProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [findings, setFindings] = useState<DbFinding[]>(initialFindings)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('severity')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [fixingIds, setFixingIds] = useState<Set<string>>(new Set())
  const [consensusFixingIds, setConsensusFixingIds] = useState<Set<string>>(new Set())
  const [fixes, setFixes] = useState<Record<string, GeneratedFix>>({})
  const [fixErrors, setFixErrors] = useState<Record<string, string>>({})
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [groupBatchFixingIds, setGroupBatchFixingIds] = useState<Set<string>>(new Set())
  const [batchConfirmGroup, setBatchConfirmGroup] = useState<FindingGroup | null>(null)
  const [expandedSubGroups, setExpandedSubGroups] = useState<Record<string, Set<string>>>({})

  // Filter values come from URL params (via props) — no client state needed
  const VALID_SEVERITIES: SeverityFilter[] = ['all', 'critical', 'high', 'medium', 'low', 'info']
  const VALID_STATUSES: StatusFilter[] = ['all', 'open', 'acknowledged', 'fixed', 'dismissed']
  const severityFilter: SeverityFilter = VALID_SEVERITIES.includes(severityFilterProp as SeverityFilter) ? severityFilterProp as SeverityFilter : 'all'
  const statusFilter: StatusFilter     = VALID_STATUSES.includes(statusFilterProp as StatusFilter)     ? statusFilterProp as StatusFilter     : 'all'
  const agentFilter: AgentFilter       = agentFilterProp as AgentFilter

  function setFilter(key: 'status' | 'severity' | 'agent', value: string) {
    const params = new URLSearchParams(window.location.search)
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function toggleSubGroup(ruleId: string, label: string) {
    setExpandedSubGroups(prev => ({
      ...prev,
      [ruleId]: (() => {
        const s = new Set(prev[ruleId] ?? ['high', 'medium'])
        s.has(label) ? s.delete(label) : s.add(label)
        return s
      })(),
    }))
  }

  function getOpenSubGroups(ruleId: string): Set<string> {
    return expandedSubGroups[ruleId] ?? new Set(['high', 'medium'])
  }

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

  const groupedItems = useMemo(() => groupFindings(filtered), [filtered])
  const totalFindings = filtered.length

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

  function handleExport(format: 'csv' | 'json') {
    const rows = findings.filter((f) => selected.has(f.id))
    if (rows.length === 0) return

    let content: string
    let mime: string
    let ext: string

    if (format === 'json') {
      content = JSON.stringify(rows.map((f) => ({
        id: f.id,
        rule: f.rule_id,
        severity: f.severity,
        agent: f.agent_source ?? 'core',
        message: f.message,
        file: f.file_path ?? '',
        line: f.line ?? '',
        suggestion: f.suggestion ?? '',
        status: f.status,
        enforcement: f.enforcement ?? '',
      })), null, 2)
      mime = 'application/json'
      ext = 'json'
    } else {
      const cols = ['rule', 'severity', 'agent', 'message', 'file', 'line', 'suggestion', 'status']
      const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`
      const lines = [
        cols.join(','),
        ...rows.map((f) => [
          f.rule_id, f.severity, f.agent_source ?? 'core', f.message,
          f.file_path ?? '', f.line ?? '', f.suggestion ?? '', f.status,
        ].map(String).map(escape).join(',')),
      ]
      content = lines.join('\r\n')
      mime = 'text/csv'
      ext = 'csv'
    }

    const date = new Date().toISOString().slice(0, 10)
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-findings-${date}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

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
    setFixingIds((prev) => new Set(prev).add(findingId))
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
      setFixingIds((prev) => { const s = new Set(prev); s.delete(findingId); return s })
    }
  }, [])

  const handleGenerateConsensusFix = useCallback(async (findingId: string, runId: string) => {
    setConsensusFixingIds((prev) => new Set(prev).add(findingId))
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
      setConsensusFixingIds((prev) => { const s = new Set(prev); s.delete(findingId); return s })
    }
  }, [])

  const handleGroupDismiss = useCallback(async (group: FindingGroup) => {
    await Promise.all(
      group.findings.map((f) =>
        fetch(`/api/audit/findings/${f.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'dismissed' }),
        })
      )
    )
    setFindings((prev) =>
      prev.map((f) =>
        group.findings.some((gf) => gf.id === f.id) ? { ...f, status: 'dismissed' } : f
      )
    )
  }, [])

  const handleGroupFix = useCallback(async (group: FindingGroup) => {
    if (!runId) return
    const fixable = group.findings.filter((f) => f.file_path)
    if (fixable.length === 0) return
    setGroupBatchFixingIds((prev) => new Set(prev).add(group.ruleId))
    try {
      await fetch('/api/audit/fix/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId,
          findingIds: fixable.map((f) => f.id),
          mode: 'quick',
        }),
      })
    } finally {
      setGroupBatchFixingIds((prev) => { const s = new Set(prev); s.delete(group.ruleId); return s })
    }
  }, [runId])

  const severityChips: Array<{ value: SeverityFilter; label: string }> = [
    { value: 'all', label: `Alle (${findings.length})` },
    { value: 'critical', label: `Critical (${SEVERITY_COUNTS(findings, 'critical')})` },
    { value: 'high', label: `High (${SEVERITY_COUNTS(findings, 'high')})` },
    { value: 'medium', label: `Medium (${SEVERITY_COUNTS(findings, 'medium')})` },
    { value: 'low', label: `Low (${SEVERITY_COUNTS(findings, 'low')})` },
  ]

  const STATUS_COUNT = (st: DbFinding['status']) => findings.filter((f) => f.status === st).length
  const statusChips: Array<{ value: StatusFilter; label: string }> = [
    { value: 'all',          label: `Alle (${findings.length})` },
    { value: 'open',         label: `Offen (${STATUS_COUNT('open')})` },
    { value: 'acknowledged', label: `Bekannt (${STATUS_COUNT('acknowledged')})` },
    { value: 'fixed',        label: `Behoben (${STATUS_COUNT('fixed')})` },
    { value: 'dismissed',    label: `Ignoriert (${STATUS_COUNT('dismissed')})` },
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
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          {groupedItems.length} Einträge · {totalFindings} Findings
        </span>
      </div>

      {/* Severity filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {severityChips.map(({ value, label }) => (
          <button key={value} className={`chip${severityFilter === value ? ' chip--active' : ''}`}
            onClick={() => setFilter('severity', value)}>{label}</button>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {statusChips.map(({ value, label }) => (
          <button key={value} className={`chip${statusFilter === value ? ' chip--active' : ''}`}
            onClick={() => setFilter('status', value)}>{label}</button>
        ))}
      </div>

      {/* Agent filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {agentChips.map(({ value, label }) => (
          <button key={value} className={`chip${agentFilter === value ? ' chip--active' : ''}`}
            onClick={() => setFilter('agent', value)}>{label}</button>
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
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => handleExport('csv')}
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <DownloadSimple size={12} weight="bold" aria-hidden="true" /> CSV
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleExport('json')}
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <DownloadSimple size={12} weight="bold" aria-hidden="true" /> JSON
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}
                style={{ fontSize: 12 }}>
                Abwählen
              </button>
            </div>
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
            {groupedItems.flatMap((item) => {
              if (!isGroup(item)) {
                // Single finding — same logic as before
                const f = item
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
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Fix generieren"
                            disabled={fixingIds.has(f.id)}
                            onClick={() => handleGenerateFix(f.id, runId)}
                          >
                            {fixingIds.has(f.id)
                              ? <PhosphorSpinner size={11} weight="bold" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                              : 'Fix'
                            }
                          </button>
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
                          affectedFiles={f.affected_files ?? undefined}
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
              }

              // Group row
              const groupExpanded = expandedGroups.has(item.ruleId)
              const groupMainRow = (
                <tr key={`group-${item.ruleId}`} style={{
                  borderBottom: groupExpanded ? 'none' : '1px solid var(--border)',
                  background: groupExpanded ? 'color-mix(in srgb, var(--accent) 4%, transparent)' : 'transparent',
                  cursor: 'pointer',
                }} onClick={() => setExpandedGroups((prev) => {
                  const next = new Set(prev)
                  next.has(item.ruleId) ? next.delete(item.ruleId) : next.add(item.ruleId)
                  return next
                })}>
                  {/* Checkbox-Spalte: selektiert alle Findings der Gruppe */}
                  <td style={{ padding: '8px', width: 28 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={item.findings.length > 0 && item.findings.every(f => selected.has(f.id))}
                      onChange={() => {
                        const allIn = item.findings.every(f => selected.has(f.id))
                        setSelected(prev => {
                          const s = new Set(prev)
                          item.findings.forEach(f => allIn ? s.delete(f.id) : s.add(f.id))
                          return s
                        })
                      }}
                      style={{ cursor: 'pointer' }}
                      aria-label="Alle Findings dieser Gruppe auswählen"
                    />
                  </td>

                  {/* Severity */}
                  <td style={{ padding: '8px', color: SEVERITY_COLOR[item.severity], verticalAlign: 'middle' }}>
                    {SEVERITY_ICON[item.severity]}
                  </td>

                  {/* Agent badge */}
                  <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: AGENT_BADGE[item.agentSource]?.bg ?? 'var(--border)',
                      color: AGENT_BADGE[item.agentSource]?.color ?? 'var(--text-tertiary)',
                    }}>
                      {AGENT_BADGE[item.agentSource]?.label ?? 'Core'}
                    </span>
                  </td>

                  {/* Rule ID */}
                  <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                    <code style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--border)', padding: '2px 5px', borderRadius: 3 }}>
                      {item.ruleId}
                    </code>
                  </td>

                  {/* Message + count badge + expand caret */}
                  <td style={{ padding: '8px', verticalAlign: 'middle', maxWidth: 320 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.baseMessage}</span>
                      <span style={{
                        background: 'var(--accent-light)', color: 'var(--accent)',
                        padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                      }}>
                        {item.count} Dateien
                      </span>
                      {groupExpanded
                        ? <CaretUp size={12} weight="bold" style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} aria-hidden="true" />
                        : <CaretDown size={12} weight="bold" style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} aria-hidden="true" />
                      }
                    </div>
                  </td>

                  {/* File: leer bei Gruppe */}
                  <td style={{ padding: '8px' }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>
                  </td>

                  {/* Batch-Aktionen */}
                  <td style={{ padding: '8px', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      {runId && (
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={groupBatchFixingIds.has(item.ruleId)}
                            onClick={() => setBatchConfirmGroup(item)}
                            style={{ fontSize: 11, padding: '2px 7px', opacity: groupBatchFixingIds.has(item.ruleId) ? 0.5 : 1 }}
                          >
                            Alle fixen
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleGroupDismiss(item)}
                            style={{ fontSize: 11, padding: '2px 7px' }}
                          >
                            Alle ignorieren
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )

              const batchConfirmRow = batchConfirmGroup?.ruleId === item.ruleId ? (
                <tr key={`batch-confirm-${item.ruleId}`} style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <td colSpan={7} style={{ padding: '8px 8px 12px 32px' }}>
                    {/* Matches FixPreview layout exactly */}
                    <div style={{ marginTop: 4 }}>
                      <div style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                        padding: '10px 12px', borderRadius: 6,
                        background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                        marginBottom: 12,
                      }}>
                        <Info size={14} weight="fill" color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '0 0 2px', lineHeight: 1.5 }}>
                            {batchConfirmGroup.count} Findings für Regel <code style={{ fontSize: 12, background: 'color-mix(in srgb, var(--accent) 15%, transparent)', padding: '1px 4px', borderRadius: 3 }}>{item.ruleId}</code> fixen?
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 4px', lineHeight: 1.5 }}>
                            Fixes werden generiert aber nicht automatisch angewendet. Du reviewst jeden einzeln.
                          </p>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                            Geschätzte Kosten: ca. €{(batchConfirmGroup.findings.filter(f => f.file_path).length * 0.02).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                          onClick={() => { const group = batchConfirmGroup; setBatchConfirmGroup(null); handleGroupFix(group) }}
                        >
                          <CheckCircle size={13} weight="fill" aria-hidden="true" />
                          Fixes generieren
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                          onClick={() => setBatchConfirmGroup(null)}
                        >
                          <X size={13} weight="bold" aria-hidden="true" />
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null

              if (!groupExpanded) return batchConfirmRow ? [groupMainRow, batchConfirmRow] : [groupMainRow]

              // Sub-grouped rendering for file-size groups with mixed severities
              if (isFileSizeGroup(item) && new Set(item.findings.map(f => f.severity)).size > 1) {
                const openSubs = getOpenSubGroups(item.ruleId)
                const subGroupDefs: Array<{ sev: DbFinding['severity']; label: string }> = [
                  { sev: 'high',   label: 'Muss aufgeteilt werden' },
                  { sev: 'medium', label: 'Aufteilen erwägen' },
                  { sev: 'low',    label: 'Beobachten' },
                ]

                const subRows: React.ReactNode[] = []
                subGroupDefs.forEach(({ sev, label }) => {
                  const subFindings = item.findings.filter(f => f.severity === sev)
                  if (subFindings.length === 0) return
                  const isOpen = openSubs.has(sev)
                  subRows.push(
                    <tr key={`subgroup-${item.ruleId}-${sev}`}
                      onClick={() => toggleSubGroup(item.ruleId, sev)}
                      style={{ cursor: 'pointer', background: 'color-mix(in srgb, var(--bg-base) 60%, transparent)' }}>
                      <td colSpan={7} style={{ padding: '5px 8px 5px 32px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          {isOpen
                            ? <CaretDown size={10} weight="bold" aria-hidden="true" />
                            : <CaretUp size={10} weight="bold" aria-hidden="true" />
                          }
                          <span style={{ color: SEVERITY_COLOR[sev], fontWeight: 600 }}>{label}</span>
                          <span style={{ color: 'var(--text-tertiary)' }}>({subFindings.length})</span>
                        </span>
                      </td>
                    </tr>
                  )
                  if (isOpen) {
                    subFindings.forEach((f) => {
                      const lineCount = extractLineCount(f.message)
                      subRows.push(
                        <tr key={f.id} style={{
                          background: 'color-mix(in srgb, var(--accent) 4%, transparent)',
                          borderBottom: '1px solid color-mix(in srgb, var(--border) 50%, transparent)',
                        }}>
                          <td colSpan={4} style={{ padding: '4px 8px' }} />
                          <td style={{ padding: '4px 8px', paddingLeft: 48 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <code style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                {f.file_path ?? '—'}
                              </code>
                              {lineCount > 0 && (
                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                  ({lineCount} Zeilen)
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '4px 8px', verticalAlign: 'middle' }}>
                            <select
                              value={f.status}
                              disabled={updatingId === f.id}
                              onChange={(e) => handleStatusChange(f.id, e.target.value as DbFinding['status'])}
                              style={{
                                fontSize: 12, padding: '2px 5px', borderRadius: 4,
                                border: '1px solid var(--border)', background: 'var(--bg-surface)',
                                color: 'var(--text-primary)', cursor: 'pointer',
                                opacity: updatingId === f.id ? 0.5 : 1,
                              }}
                            >
                              {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '4px 8px', verticalAlign: 'middle' }}>
                            {runId && f.file_path && (
                              <button
                                title="Fix generieren"
                                className="btn btn-ghost btn-sm"
                                disabled={fixingIds.has(f.id)}
                                onClick={() => handleGenerateFix(f.id, runId)}
                              >
                                {fixingIds.has(f.id)
                                  ? <PhosphorSpinner size={11} weight="bold" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                                  : 'Fix'
                                }
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  }
                })

                return [groupMainRow, ...(batchConfirmRow ? [batchConfirmRow] : []), ...subRows]
              }

              const childRows = item.findings.map((f, idx) => (
                <tr key={f.id} style={{
                  borderBottom: idx === item.findings.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'color-mix(in srgb, var(--accent) 4%, transparent)',
                }}>
                  <td style={{ padding: '6px 8px', width: 28 }} />
                  <td style={{ padding: '6px 8px' }} />
                  <td style={{ padding: '6px 8px' }} />
                  <td style={{ padding: '6px 8px' }} />

                  {/* Dateiname */}
                  <td style={{ padding: '6px 8px', paddingLeft: 24 }}>
                    <code style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {f.file_path ?? '—'}{f.line ? `:${f.line}` : ''}
                    </code>
                  </td>

                  {/* Status-Dropdown */}
                  <td style={{ padding: '6px 8px', verticalAlign: 'middle' }}>
                    <select
                      value={f.status}
                      disabled={updatingId === f.id}
                      onChange={(e) => handleStatusChange(f.id, e.target.value as DbFinding['status'])}
                      style={{
                        fontSize: 12, padding: '2px 5px', borderRadius: 4,
                        border: '1px solid var(--border)', background: 'var(--bg-surface)',
                        color: 'var(--text-primary)', cursor: 'pointer',
                        opacity: updatingId === f.id ? 0.5 : 1,
                      }}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Fix-Button */}
                  <td style={{ padding: '6px 8px', verticalAlign: 'middle' }}>
                    {runId && f.file_path && (
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Fix generieren"
                        disabled={fixingIds.has(f.id)}
                        onClick={() => handleGenerateFix(f.id, runId)}
                      >
                        {fixingIds.has(f.id)
                          ? <PhosphorSpinner size={11} weight="bold" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                          : 'Fix'
                        }
                      </button>
                    )}
                    {/* Fix-Preview wenn vorhanden */}
                    {fixes[f.id] && (
                      <div style={{ marginTop: 4 }}>
                        <FixPreview
                          fix={fixes[f.id]}
                          affectedFiles={f.affected_files ?? undefined}
                          onApplied={() => setFindings((prev) => prev.map((fd) => fd.id === f.id ? { ...fd, status: 'fixed' } : fd))}
                          onRejected={() => setFixes((prev) => { const n = { ...prev }; delete n[f.id]; return n })}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))

              return [groupMainRow, ...(batchConfirmRow ? [batchConfirmRow] : []), ...childRows]
            })}
          </tbody>
        </table>
        </>
      )}


    </div>
  )
}
