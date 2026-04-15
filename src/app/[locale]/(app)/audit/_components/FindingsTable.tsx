'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import type { AgentSource, FixType } from '@/lib/audit/types'
import RecommendationCard from './RecommendationCard'
import { groupFindings, cleanRuleId, type FindingGroup, type AuditFinding } from '@/lib/audit/group-findings'
import { findRecommendation } from '@/lib/audit/finding-recommendations'

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
  fix_type?: FixType | null
}

type FixTypeFilter  = 'all' | FixType
type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low' | 'info'
type StatusFilter   = 'all' | 'open' | 'acknowledged' | 'fixed' | 'dismissed'
type AgentFilter    = 'all' | AgentSource

interface FindingsTableProps {
  findings: DbFinding[]
  runId?: string
  fixTypeFilter?: string
  statusFilter?: string
  severityFilter?: string
  agentFilter?: string
  /** @deprecated — individual finding tasks are no longer shown */
  initialTaskMap?: Record<string, string>
  isExternalProject?: boolean
}

const SEVERITY_COUNTS = (findings: DbFinding[], sev: string) =>
  findings.filter((f) => f.severity === sev).length

const dropdownStyle: React.CSSProperties = {
  fontSize: 12, padding: '4px 8px', borderRadius: 4,
  border: '1px solid var(--border)',
  background: 'transparent', color: 'var(--text-secondary)',
  cursor: 'pointer', flexShrink: 0,
}

/** Wraps a single finding as a group-of-1 for flat view. */
function singleFindingAsGroup(f: DbFinding): FindingGroup {
  return {
    ruleId:         f.rule_id || 'unknown',
    baseMessage:    f.message,
    agentSource:    f.agent_source ?? 'core',
    severity:       f.severity,
    findings:       [f as unknown as AuditFinding],
    count:          1,
    uniqueFileCount: f.file_path ? 1 : 0,
    fixType:        f.fix_type ?? 'manual',
  }
}

export default function FindingsTable({
  findings: initialFindings,
  runId,
  fixTypeFilter: fixTypeFilterProp = 'all',
  statusFilter: statusFilterProp = 'all',
  severityFilter: severityFilterProp = 'all',
  agentFilter: agentFilterProp = 'all',
  isExternalProject = false,
}: FindingsTableProps) {
  const t = useTranslations('audit')
  const router = useRouter()
  const pathname = usePathname()

  const [findings, setFindings] = useState<DbFinding[]>(initialFindings)
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped')
  const [fixTypeHintDismissed, setFixTypeHintDismissed] = useState(() => {
    try { return localStorage.getItem('audit-fixtypes-dismissed') === 'true' } catch { return false }
  })
  const [localFixTypeFilter, setLocalFixTypeFilter] = useState<FixTypeFilter>(
    (['all', 'code-fix', 'code-gen', 'refactoring', 'manual'] as FixTypeFilter[]).includes(fixTypeFilterProp as FixTypeFilter)
      ? fixTypeFilterProp as FixTypeFilter : 'all'
  )

  const VALID_SEVERITIES: SeverityFilter[] = ['all', 'critical', 'high', 'medium', 'low', 'info']
  const VALID_STATUSES:   StatusFilter[]   = ['all', 'open', 'acknowledged', 'fixed', 'dismissed']
  const severityFilter: SeverityFilter = VALID_SEVERITIES.includes(severityFilterProp as SeverityFilter) ? severityFilterProp as SeverityFilter : 'all'
  const statusFilter:   StatusFilter   = VALID_STATUSES.includes(statusFilterProp as StatusFilter)       ? statusFilterProp as StatusFilter       : 'all'
  const agentFilter:    AgentFilter    = agentFilterProp as AgentFilter

  function setFilter(key: 'status' | 'severity' | 'agent', value: string) {
    const params = new URLSearchParams(window.location.search)
    if (value === 'all') params.delete(key)
    else params.set(key, value)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // fixType counts for tabs (based on status/severity/agent-filtered findings, not fixType-filtered)
  const baseFiltered = useMemo(() =>
    findings.filter((f) => {
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false
      if (statusFilter === 'open' && f.status !== 'open' && f.status !== 'acknowledged') return false
      if (statusFilter === 'fixed' && f.status !== 'fixed') return false
      if (statusFilter === 'dismissed' && f.status !== 'dismissed') return false
      if (agentFilter    !== 'all' && (f.agent_source ?? 'core') !== agentFilter) return false
      return true
    }),
    [findings, severityFilter, statusFilter, agentFilter]
  )

  const fixTypeCounts = useMemo(() => {
    const counts = { 'code-fix': 0, 'code-gen': 0, refactoring: 0, manual: 0 }
    for (const f of baseFiltered) {
      const ft = f.fix_type ?? 'manual'
      counts[ft]++
    }
    return counts
  }, [baseFiltered])

  const filtered = useMemo(() =>
    baseFiltered.filter((f) => {
      if (localFixTypeFilter === 'all') return true
      return (f.fix_type ?? 'manual') === localFixTypeFilter
    }),
    [baseFiltered, localFixTypeFilter]
  )

  const groups: FindingGroup[] = useMemo(() => {
    if (viewMode === 'flat') return filtered.map(singleFindingAsGroup)
    return groupFindings(filtered as unknown as AuditFinding[])
  }, [filtered, viewMode])

  const handleMarkFixed = useCallback(async (group: FindingGroup) => {
    await Promise.all(
      group.findings.map((f) =>
        fetch(`/api/audit/findings/${f.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'fixed' }),
        })
      )
    )
    setFindings((prev) =>
      prev.map((f) => group.findings.some((gf) => gf.id === f.id) ? { ...f, status: 'fixed' as const } : f)
    )
  }, [])

  const handleMarkNotRelevant = useCallback(async (group: FindingGroup, reason: string) => {
    await Promise.all(
      group.findings.map((f) =>
        fetch(`/api/audit/findings/${f.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'dismissed', not_relevant_reason: reason }),
        })
      )
    )
    setFindings((prev) =>
      prev.map((f) => group.findings.some((gf) => gf.id === f.id) ? { ...f, status: 'dismissed' as const } : f)
    )
  }, [])

  // handleCopyGroupPrompt removed — Fix-Prompt is now in the Drawer only

  // fixType tabs — primary filter
  const fixTypeChips: Array<{ value: FixTypeFilter; label: string }> = [
    { value: 'all',         label: `${t('fixTypeAll')} (${baseFiltered.length})` },
    { value: 'code-fix',    label: `${t('fixTypeCodeFix')} (${fixTypeCounts['code-fix']})` },
    { value: 'code-gen',    label: `${t('fixTypeCodeGen')} (${fixTypeCounts['code-gen']})` },
    { value: 'refactoring', label: `${t('fixTypeRefactoring')} (${fixTypeCounts.refactoring})` },
    { value: 'manual',      label: `${t('fixTypeManual')} (${fixTypeCounts.manual})` },
  ]

  const severityChips: Array<{ value: SeverityFilter; label: string }> = [
    { value: 'all',      label: `Alle (${filtered.length})` },
    { value: 'critical', label: `Critical (${SEVERITY_COUNTS(filtered as DbFinding[], 'critical')})` },
    { value: 'high',     label: `High (${SEVERITY_COUNTS(filtered as DbFinding[], 'high')})` },
    { value: 'medium',   label: `Medium (${SEVERITY_COUNTS(filtered as DbFinding[], 'medium')})` },
    { value: 'low',      label: `Low (${SEVERITY_COUNTS(filtered as DbFinding[], 'low')})` },
  ]

  // acknowledged = open in UI (legacy status)
  const openCount = findings.filter((f) => f.status === 'open' || f.status === 'acknowledged').length
  const fixedCount = findings.filter((f) => f.status === 'fixed').length
  const dismissedCount = findings.filter((f) => f.status === 'dismissed').length
  const statusChips: Array<{ value: StatusFilter; label: string }> = [
    { value: 'all',      label: `Alle (${findings.length})` },
    { value: 'open',     label: `Offen (${openCount})` },
    { value: 'fixed',    label: `Erledigt (${fixedCount})` },
    { value: 'dismissed', label: `Nicht relevant (${dismissedCount})` },
  ]

  const agentChips: Array<{ value: AgentFilter; label: string }> = [
    { value: 'all',          label: t('allAgents') },
    { value: 'core',         label: 'Core' },
    { value: 'security',     label: 'Security' },
    { value: 'architecture', label: 'Architektur' },
    { value: 'observability',label: 'Observability' },
    { value: 'code-style',   label: 'Code Style' },
    { value: 'testing',      label: 'Testing' },
    { value: 'database',     label: 'Database' },
    { value: 'api',          label: 'API' },
    { value: 'platform',     label: 'Platform' },
    { value: 'legal',        label: 'Legal' },
    { value: 'accessibility',label: 'A11y' },
    { value: 'ai-integration',label: 'AI' },
  ]

  if (findings.length === 0) {
    return (
      <div id="findings-table" data-version="v2" style={{ marginBottom: 24, paddingTop: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)',
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}>
            Findings
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '20px 0' }}>
          Keine Findings in diesem Run.
        </p>
      </div>
    )
  }

  return (
    <div id="findings-table" data-version="v2" style={{ marginBottom: 24, paddingTop: 16 }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}>
            Findings
          </span>

          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: 0 }}>
            {(['grouped', 'flat'] as const).map((mode, i) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '1px 0', marginLeft: i > 0 ? 10 : 0,
                  fontSize: 12, fontWeight: viewMode === mode ? 600 : 400,
                  color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  borderBottom: viewMode === mode ? '1px solid var(--text-primary)' : '1px solid transparent',
                }}
              >
                {mode === 'grouped' ? t('grouped') : t('flat')}
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {groups.length} · {filtered.length} Findings
        </span>
      </div>

      {/* Filter row — all filters as compact dropdowns */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {/* Fix-Typ */}
        <select
          aria-label={t('fixTypeAll')}
          value={localFixTypeFilter}
          onChange={(e) => setLocalFixTypeFilter(e.target.value as FixTypeFilter)}
          style={dropdownStyle}
        >
          {fixTypeChips.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Severity */}
        <select
          aria-label="Severity"
          value={severityFilter}
          onChange={(e) => setFilter('severity', e.target.value)}
          style={dropdownStyle}
        >
          {severityChips.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Agent */}
        <select
          aria-label={t('allAgents')}
          value={agentFilter}
          onChange={(e) => setFilter('agent', e.target.value)}
          style={dropdownStyle}
        >
          {agentChips.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Status */}
        <select
          aria-label="Status"
          value={statusFilter}
          onChange={(e) => setFilter('status', e.target.value)}
          style={dropdownStyle}
        >
          {statusChips.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {!fixTypeHintDismissed && (
        <div style={{
          padding: '10px 14px', marginBottom: 12, borderRadius: 6,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>{t('fixTypeExplainTitle')}</p>
            <p style={{ margin: '0 0 2px' }}>{t('fixTypeExplainCodeFix')}</p>
            <p style={{ margin: '0 0 2px' }}>{t('fixTypeExplainCodeGen')}</p>
            <p style={{ margin: '0 0 2px' }}>{t('fixTypeExplainRefactoring')}</p>
            <p style={{ margin: 0 }}>{t('fixTypeExplainManual')}</p>
          </div>
          <button onClick={() => { setFixTypeHintDismissed(true); try { localStorage.setItem('audit-fixtypes-dismissed', 'true') } catch {} }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2, flexShrink: 0 }}
            aria-label="Close">
            <span style={{ fontSize: 14 }}>×</span>
          </button>
        </div>
      )}

      {/* Findings list */}
      {localFixTypeFilter === 'manual' && (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12, lineHeight: 1.5 }}>
          {t('manualTabHint')}
        </p>
      )}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent)', marginBottom: 4 }}>
            {t('emptyStateTitle', { filterDesc: localFixTypeFilter === 'all' ? 'Findings' : t(`fixTypeBadge${localFixTypeFilter === 'code-fix' ? 'CodeFix' : localFixTypeFilter === 'code-gen' ? 'CodeGen' : localFixTypeFilter === 'refactoring' ? 'Refactoring' : 'Manual'}`) })}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            {t('emptyStateBody')}
          </p>
        </div>
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.ruleId} data-rule-id={group.ruleId}>
              <RecommendationCard
                group={group}
                recommendation={findRecommendation(cleanRuleId(group.ruleId), group.baseMessage)}
                isExternalProject={isExternalProject}
                onMarkFixed={handleMarkFixed}
                onMarkNotRelevant={handleMarkNotRelevant}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
