'use client'

import React, { useState } from 'react'
import { Lightning } from '@phosphor-icons/react'
import { type FindingCluster, SEV_DOT } from './audit-findings-utils'
import { FixPromptInline } from './FixPromptInline'

// ── FindingClusterRow ──────────────────────────────────────────────────────────

export function FindingClusterRow({ cluster, runId, onFixed }: {
  cluster: FindingCluster
  runId?: string | null
  onFixed?: (ids: string[]) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null)
  const [clusterBundle, setClusterBundle] = useState<string | null>(null)
  const [clusterBundleLoading, setClusterBundleLoading] = useState(false)
  const [clusterBundleCopied, setClusterBundleCopied] = useState(false)
  const [fixing, setFixing] = useState(false)
  const isMulti = cluster.findings.length > 1

  async function handleFixed() {
    setFixing(true)
    try {
      await Promise.all(cluster.findings.map(f =>
        fetch(`/api/audit/findings/${f.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'fixed' }),
        })
      ))
      onFixed?.(cluster.findings.map(f => f.id))
    } finally { setFixing(false) }
  }

  function toggleFinding(id: string) {
    setExpandedFindingId(prev => prev === id ? null : id)
  }

  async function loadClusterBundle() {
    if (clusterBundle || clusterBundleLoading) return
    setClusterBundleLoading(true)
    try {
      const res = await fetch('/api/audit/fix-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingIds: cluster.findings.map(f => f.id) }),
      })
      const data = await res.json() as { prompt?: string }
      setClusterBundle(data.prompt ?? null)
    } finally { setClusterBundleLoading(false) }
  }

  function copyClusterBundle() {
    if (!clusterBundle) return
    void navigator.clipboard.writeText(clusterBundle).then(() => {
      setClusterBundleCopied(true)
      setTimeout(() => setClusterBundleCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Cluster-Header — div statt button damit Bundle-Button rechts passt */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px' }}>
        {/* Klickbarer Bereich links */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{ display: 'contents', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left' }}
          aria-label={expanded ? 'Einklappen' : 'Aufklappen'}
        >
          <span className={`severity-dot ${SEV_DOT[cluster.severity] ?? ''}`} aria-label={cluster.severity} style={{ flexShrink: 0 }} />
        </button>
        <div style={{ minWidth: 0, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cluster.title}
          </div>
          {isMulti ? (
            <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
              {cluster.findings.length} Dateien betroffen · {expanded ? '▲ einklappen' : '▼ aufklappen'}
            </div>
          ) : cluster.findings[0].file_path ? (
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cluster.findings[0].file_path}
            </div>
          ) : null}
          {cluster.findings[0]._limitation && !isMulti && (
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.4, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              💡 {cluster.findings[0]._limitation as string}
            </div>
          )}
        </div>
        {/* Bundle-Button rechts — nur bei aufgeklapptem Multi-Cluster */}
        {isMulti && expanded && !clusterBundle && (
          <button
            onClick={loadClusterBundle}
            disabled={clusterBundleLoading}
            className="btn btn-primary"
            style={{ fontSize: 11, padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
          >
            <Lightning size={11} weight="fill" aria-hidden="true" />
            {clusterBundleLoading ? 'Wird generiert…' : `Alle ${cluster.findings.length} auf einmal fixen`}
          </button>
        )}
        {/* Fix-Prompt anzeigen — rechtsbündig für Single-Findings, immer sichtbar */}
        {!isMulti && runId && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
            style={{ fontSize: 11, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2, flexShrink: 0 }}
          >
            {expanded ? 'Einklappen' : 'Fix-Prompt anzeigen'}
          </button>
        )}
        {/* CommitteeBadge — zeigt Komitee-Konfidenz wenn avg_confidence gesetzt */}
        {cluster.findings[0].avg_confidence != null && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
            color: 'var(--teal)',
            padding: '1px 7px', borderRadius: 10,
            background: 'var(--teal-light)',
            flexShrink: 0,
          }}
          title={`Modelle: ${Array.isArray(cluster.findings[0].models_flagged) ? (cluster.findings[0].models_flagged as string[]).join(', ') : ''}`}
          >
            ✨ {Array.isArray(cluster.findings[0].models_flagged) ? (cluster.findings[0].models_flagged as string[]).length : '?'}M · {Math.round(Number(cluster.findings[0].avg_confidence))}%
          </span>
        )}
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          {cluster.severity !== 'info' ? `+${cluster.totalScoreGain}` : ''}
        </span>
      </div>

      {/* Multi-file: Datei-Liste mit je eigenem Fix-Prompt-Bereich darunter */}
      {expanded && isMulti && (
        <div style={{ background: 'rgba(26,23,20,0.02)', borderTop: '1px solid var(--border)' }}>
          {/* Bundle-Prompt wenn generiert */}
          {clusterBundle && (
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--active-bg)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ color: '#e8e6e1', padding: '10px 12px', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 240, overflow: 'auto' }}>
                  {clusterBundle}
                </div>
                <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button onClick={copyClusterBundle} style={{ fontSize: 11, color: '#ffffff', background: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: 4, cursor: 'pointer', padding: '3px 10px' }}>
                    {clusterBundleCopied ? '✓ Kopiert' : 'Kopieren'}
                  </button>
                  <button onClick={() => setClusterBundle(null)} style={{ fontSize: 11, fontFamily: 'inherit', color: '#ffffff', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '3px 10px' }}>
                    Verbergen
                  </button>
                </div>
              </div>
            </div>
          )}
          {cluster.findings.map(f => (
            <div key={f.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 44px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.file_path ?? '—'}
                </span>
                {f._limitation && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>💡</span>}
                {runId && (
                  <button
                    onClick={() => toggleFinding(f.id)}
                    style={{ fontSize: 11, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2, flexShrink: 0 }}
                  >
                    {expandedFindingId === f.id ? 'Einklappen' : 'Fix-Prompt anzeigen'}
                  </button>
                )}
              </div>
              {expandedFindingId === f.id && runId && (
                <FixPromptInline
                  ruleId={f.rule_id}
                  message={f.message as string}
                  severity={f.severity}
                  filePath={f.file_path}
                  autoLoad
                  onHide={() => setExpandedFindingId(null)}
                  onFixed={() => void handleFixed()}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Single finding: expandierbarer Fix-Prompt */}
      {expanded && !isMulti && (
        <div style={{ padding: '8px 14px 12px', background: 'rgba(26,23,20,0.02)' }}>
          {cluster.findings[0].message && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px', lineHeight: 1.5 }}>
              {cluster.findings[0].message as string}
            </p>
          )}
          {cluster.findings[0].suggestion && cluster.findings[0].suggestion !== cluster.findings[0].message && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
              {cluster.findings[0].suggestion as string}
            </p>
          )}
          {runId && (
            <FixPromptInline
              ruleId={cluster.findings[0].rule_id}
              message={cluster.findings[0].message as string}
              severity={cluster.findings[0].severity}
              filePath={cluster.findings[0].file_path}
              onHide={() => setExpanded(false)}
              onFixed={() => void handleFixed()}
            />
          )}
        </div>
      )}
    </div>
  )
}
