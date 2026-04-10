'use client'

import { useState, useCallback } from 'react'
import {
  WarningOctagon, Warning, Info, Note, CaretDown, CaretUp,
  Spinner as PhosphorSpinner, Scales,
} from '@phosphor-icons/react'
import dynamic from 'next/dynamic'
import type { GeneratedFix } from '@/lib/fix-engine/types'
import type { FileDiff } from '@/lib/fix-engine/types'

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
  agent_source?: string | null
  agent_rule_id?: string | null
  enforcement?: string | null
  consensus_level?: 'unanimous' | 'majority' | 'split' | 'single' | null
  models_flagged?: string[] | null
  avg_confidence?: number | null
}

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--error)',
  high: 'var(--error)',
  medium: 'var(--text-secondary)',
  low: 'var(--text-tertiary)',
  info: 'var(--text-tertiary)',
}

const CONSENSUS_LABEL: Record<string, string> = {
  unanimous: 'Einstimmig',
  majority:  'Mehrheit',
  split:     'Gespalten',
  single:    'Einzeln',
}

const CONSENSUS_BG: Record<string, string> = {
  unanimous: 'color-mix(in srgb, var(--accent) 12%, transparent)',
  majority:  'color-mix(in srgb, var(--accent) 8%, transparent)',
  split:     'color-mix(in srgb, var(--text-secondary) 10%, transparent)',
  single:    'color-mix(in srgb, var(--text-tertiary) 10%, transparent)',
}

const CONSENSUS_COLOR: Record<string, string> = {
  unanimous: 'var(--accent)',
  majority:  'var(--accent)',
  split:     'var(--text-secondary)',
  single:    'var(--text-tertiary)',
}

function SeverityIcon({ severity }: { severity: DbFinding['severity'] }) {
  const color = SEV_COLOR[severity]
  if (severity === 'critical') return <WarningOctagon size={14} weight="fill" color={color} aria-hidden="true" />
  if (severity === 'high')     return <Warning        size={14} weight="fill" color={color} aria-hidden="true" />
  if (severity === 'medium')   return <Warning        size={14} weight="bold" color={color} aria-hidden="true" />
  if (severity === 'low')      return <Note           size={14} weight="bold" color={color} aria-hidden="true" />
  return                              <Info           size={14} weight="bold" color={color} aria-hidden="true" />
}

function getUniqueModels(findings: DbFinding[]): string[] {
  const set = new Set<string>()
  for (const f of findings) {
    for (const m of f.models_flagged ?? []) set.add(m)
  }
  return [...set].sort()
}

// ---------------------------------------------------------------------------
// DeepReviewFindingRow
// ---------------------------------------------------------------------------

function DeepReviewFindingRow({ finding, runId }: { finding: DbFinding; runId: string }) {
  const [expanded, setExpanded]   = useState(false)
  const [status, setStatus]       = useState(finding.status)
  const [fixing, setFixing]       = useState(false)
  const [fix, setFix]             = useState<GeneratedFix | null>(null)
  const [fixError, setFixError]   = useState<string | null>(null)

  const handleStatusChange = useCallback(async (next: DbFinding['status']) => {
    setStatus(next)
    await fetch(`/api/audit/findings/${finding.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
  }, [finding.id])

  const handleFix = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    setFixing(true)
    setFixError(null)
    try {
      const res = await fetch('/api/audit/fix/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId: finding.id, runId }),
      })
      const data = await res.json() as {
        fixId?: string; explanation?: string; confidence?: string
        diffs?: unknown[]; model?: string; costEur?: number
        error?: string; status?: string
        riskLevel?: string; riskAssessment?: unknown
      }
      if (!res.ok || !data.fixId) {
        const reason = data.error ?? 'Fehler'
        setFixError(reason.length > 200 ? reason.slice(0, 200) + '…' : reason)
        return
      }
      setFix({
        id: data.fixId!,
        explanation: data.explanation!,
        confidence: data.confidence as 'high' | 'medium' | 'low',
        diffs: (data.diffs ?? []) as FileDiff[],
        status: 'pending',
        model: data.model ?? '',
        costEur: data.costEur ?? 0,
        generatedAt: new Date().toISOString(),
        appliedAt: null,
        rejectedAt: null,
        appliedBy: null,
        findingId: finding.id,
        runId,
        ruleId: '',
        categoryId: 0,
        severity: '',
        message: '',
        filePath: null,
        line: null,
        suggestion: null,
        fixMode: 'quick' as const,
        riskLevel: data.riskLevel as GeneratedFix['riskLevel'],
        riskAssessment: data.riskAssessment as GeneratedFix['riskAssessment'],
      })
      setExpanded(true)
    } catch {
      setFixError('Netzwerkfehler')
    } finally {
      setFixing(false)
    }
  }, [finding.id, runId])

  return (
    <div style={{
      background: 'var(--bg-base)',
      borderRadius: 8,
      overflow: 'hidden',
      border: '1px solid var(--border)',
    }}>
      {/* Main row */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          cursor: 'pointer',
        }}
      >
        <SeverityIcon severity={finding.severity} />

        {/* Rule ID */}
        <code style={{
          background: 'color-mix(in srgb, var(--text-secondary) 8%, transparent)',
          padding: '1px 6px', borderRadius: 4,
          fontSize: 11, color: 'var(--text-secondary)',
          flexShrink: 0, maxWidth: 160,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {finding.rule_id || finding.agent_source || '—'}
        </code>

        {/* Message */}
        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {finding.message}
        </span>

        {/* File */}
        {finding.file_path && (
          <code style={{
            fontSize: 11, color: 'var(--text-tertiary)',
            maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {finding.file_path}
          </code>
        )}

        {/* Fix button */}
        {finding.file_path && !fix && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, padding: '2px 7px', flexShrink: 0 }}
            onClick={handleFix}
            disabled={fixing}
          >
            {fixing
              ? <PhosphorSpinner size={11} weight="bold" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
              : 'Fix'
            }
          </button>
        )}

        {/* Status select */}
        <select
          value={status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => void handleStatusChange(e.target.value as DbFinding['status'])}
          style={{
            fontSize: 11, padding: '2px 5px', borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <option value="open">Offen</option>
          <option value="acknowledged">Bekannt</option>
          <option value="fixed">Behoben</option>
          <option value="dismissed">Ignoriert</option>
        </select>

        {/* Expand chevron */}
        {expanded
          ? <CaretUp   size={12} weight="bold" color="var(--text-tertiary)" aria-hidden="true" style={{ flexShrink: 0 }} />
          : <CaretDown size={12} weight="bold" color="var(--text-tertiary)" aria-hidden="true" style={{ flexShrink: 0 }} />
        }
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          padding: '0 14px 12px 36px',
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
        }}>
          {finding.suggestion && (
            <p style={{
              fontSize: 12, color: 'var(--text-secondary)',
              margin: '0 0 8px', lineHeight: 1.6,
            }}>
              {finding.suggestion}
            </p>
          )}

          {/* Meta badges */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {finding.consensus_level && (
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600,
                background: CONSENSUS_BG[finding.consensus_level],
                color: CONSENSUS_COLOR[finding.consensus_level],
              }}>
                {CONSENSUS_LABEL[finding.consensus_level]}
              </span>
            )}
            {finding.avg_confidence != null && (
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                Ø {Math.round(finding.avg_confidence * 100)}% Konfidenz
              </span>
            )}
            {(finding.models_flagged ?? []).map((m) => (
              <span key={m} style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 4,
                background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                color: 'var(--accent)',
              }}>
                {m}
              </span>
            ))}
          </div>

          {fixError && (
            <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 8 }}>{fixError}</p>
          )}

          {fix && (
            <div style={{ marginTop: 8 }}>
              <FixPreview
                fix={fix}
                onApplied={() => void handleStatusChange('fixed')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DeepReviewFindings
// ---------------------------------------------------------------------------

interface DeepReviewFindingsProps {
  findings: DbFinding[]
  runId: string
}

export default function DeepReviewFindings({ findings, runId }: DeepReviewFindingsProps) {
  if (findings.length === 0) return null

  const uniqueModels = getUniqueModels(findings)
  const sorted = [...findings].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])

  return (
    <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Scales size={16} weight="fill" color="var(--text-primary)" aria-hidden="true" />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Deep Review
          </span>
          <span style={{
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            padding: '2px 10px', borderRadius: 10,
            fontSize: 12, fontWeight: 500,
          }}>
            {findings.length} {findings.length === 1 ? 'Finding' : 'Findings'}
          </span>
        </div>

        {uniqueModels.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {uniqueModels.map((model) => (
              <span key={model} style={{
                background: 'var(--bg-base)',
                padding: '2px 8px', borderRadius: 6,
                fontSize: 11, color: 'var(--text-tertiary)',
                border: '1px solid var(--border)',
              }}>
                {model}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Finding rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((finding) => (
          <DeepReviewFindingRow key={finding.id} finding={finding} runId={runId} />
        ))}
      </div>
    </div>
  )
}
