'use client'

import { useState } from 'react'
import { CheckCircle, X, Spinner, Info, ShieldCheck, Scales, XCircle } from '@phosphor-icons/react'
import type { GeneratedFix, FixStatus } from '@/lib/fix-engine/types'
import {
  RISK_CONFIG, CONFIDENCE_COLOR, CONFIDENCE_LABEL,
  AffectedFilesList,
} from './FixPreviewParts'
import { DiffSection, ErrorSection } from './FixPreviewSections'

// ── Types ──────────────────────────────────────────────────────────────────────

interface FixPreviewProps {
  fix: GeneratedFix
  affectedFiles?: string[]
  onApplied?: () => void
  onRejected?: () => void
}

// ── Sub-sections ───────────────────────────────────────────────────────────────

function RiskBadge({ fix }: { fix: GeneratedFix }) {
  if (!fix.riskLevel) return null
  const rc = RISK_CONFIG[fix.riskLevel]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 6, marginBottom: 10,
      fontSize: 12, fontWeight: 600,
      background: rc.bg, color: rc.color,
      border: '1px solid currentColor',
    }}>
      <ShieldCheck size={13} weight="fill" aria-hidden="true" />
      Risiko: {rc.label}
      {fix.riskAssessment && ` (${fix.riskAssessment.importedByCount} Importe)`}
    </div>
  )
}

function ExplanationBox({ fix }: { fix: GeneratedFix }) {
  const modelLabel = fix.fixMode === 'consensus'
    ? 'Konsens'
    : fix.model.split('-').slice(0, 2).join('-')
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '10px 12px', borderRadius: 6,
      background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
      border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
      marginBottom: 12,
    }}>
      <Info size={14} weight="fill" color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
          {fix.explanation}
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            Konfidenz:{' '}
            <strong style={{ color: CONFIDENCE_COLOR[fix.confidence] }}>
              {CONFIDENCE_LABEL[fix.confidence]}
            </strong>
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            Modell: {modelLabel}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            €{fix.costEur.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  )
}

function ConsensusSection({ fix }: { fix: GeneratedFix }) {
  if (fix.fixMode !== 'consensus' || !fix.judgeExplanation) return null
  return (
    <div style={{
      marginBottom: 12, padding: '10px 12px', borderRadius: 6,
      background: 'color-mix(in srgb, var(--text-secondary) 6%, transparent)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Scales size={13} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Konsens-Fix — {fix.drafts?.length ?? 0} Modelle
        </span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
        {fix.judgeExplanation}
      </p>
      {fix.riskAssessment?.reasons && fix.riskAssessment.reasons.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {fix.riskAssessment.reasons.map((r, i) => (
            <span key={i} style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 4,
              background: 'var(--border)', color: 'var(--text-tertiary)',
            }}>{r}</span>
          ))}
        </div>
      )}
    </div>
  )
}


// ── Main component ─────────────────────────────────────────────────────────────

export default function FixPreview({ fix, affectedFiles, onApplied, onRejected }: FixPreviewProps) {
  const [applying, setApplying] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [dismissingFp, setDismissingFp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localStatus, setLocalStatus] = useState<FixStatus>(fix.status)
  const [fpDismissed, setFpDismissed] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [later, setLater] = useState(false)
  const [recommendation, setRecommendation] = useState<string | null>(null)
  const [fetchingRecommendation, setFetchingRecommendation] = useState(false)

  async function handleShowRecommendation() {
    setFetchingRecommendation(true)
    try {
      const res = await fetch('/api/audit/fix/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId: fix.findingId, runId: fix.runId, mode: 'recommendation' }),
      })
      const data = await res.json() as { explanation?: string; error?: string }
      setRecommendation(data.explanation ?? data.error ?? 'Keine Empfehlung verfügbar')
    } catch {
      setRecommendation('Netzwerkfehler beim Laden der Empfehlung')
    } finally {
      setFetchingRecommendation(false)
    }
  }

  async function handleRetry() {
    setError(null)
    setRetrying(true)
    try {
      const res = await fetch('/api/audit/fix/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId: fix.findingId, runId: fix.runId }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) setError(data.error ?? 'Generierung fehlgeschlagen')
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setRetrying(false)
    }
  }

  function handleCopyDiff() {
    const text = fix.diffs.map(diff =>
      `--- ${diff.filePath}\n+++ ${diff.filePath}\n` +
      diff.hunks.map(h =>
        `@@ -${h.oldStart},${h.oldCount} +${h.newStart},${h.newCount} @@\n` +
        h.lines.join('\n')
      ).join('\n')
    ).join('\n\n')
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDismiss() {
    try {
      await fetch(`/api/audit/findings/${fix.findingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      })
      setDismissed(true)
    } catch {
      setError('Netzwerkfehler')
    }
  }

  async function handleApply() {
    setApplying(true)
    setError(null)
    try {
      const res = await fetch('/api/audit/fix/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixId: fix.id }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        const reason = data.error ?? 'Anwenden fehlgeschlagen'
        setError(reason.length > 200 ? reason.slice(0, 200) + '…' : reason)
        return
      }
      setLocalStatus('applied')
      onApplied?.()
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setApplying(false)
    }
  }

  async function handleDismissFalsePositive() {
    setDismissingFp(true)
    setError(null)
    try {
      await fetch(`/api/audit/findings/${fix.findingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed', dismissReason: 'false_positive' }),
      })
      setFpDismissed(true)
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setDismissingFp(false)
    }
  }

  async function handleReject() {
    setRejecting(true)
    setError(null)
    try {
      const res = await fetch('/api/audit/fix/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixId: fix.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setError(data.error ?? 'Ablehnen fehlgeschlagen')
        return
      }
      setLocalStatus('rejected')
      onRejected?.()
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setRejecting(false)
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <RiskBadge fix={fix} />

      {affectedFiles && affectedFiles.length > 1 && (
        <AffectedFilesList files={affectedFiles} />
      )}

      <ExplanationBox fix={fix} />

      <DiffSection
        fix={fix}
        dismissingFp={dismissingFp}
        fpDismissed={fpDismissed}
        later={later}
        recommendation={recommendation}
        fetchingRecommendation={fetchingRecommendation}
        onDismissFp={() => void handleDismissFalsePositive()}
        onDismiss={() => void handleDismiss()}
        onLater={() => setLater(true)}
        onShowRecommendation={() => void handleShowRecommendation()}
      />

      <ConsensusSection fix={fix} />

      {/* Apply / Reject actions */}
      {localStatus === 'pending' && fix.diffs.length > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => void handleApply()}
            disabled={applying || rejecting}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
          >
            {applying
              ? <Spinner size={13} weight="bold" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
              : <CheckCircle size={13} weight="fill" aria-hidden="true" />
            }
            {applying ? 'Anwenden…' : 'Fix anwenden'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => void handleReject()}
            disabled={applying || rejecting}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
          >
            <X size={13} weight="bold" aria-hidden="true" />
            Ablehnen
          </button>
        </div>
      )}

      {localStatus === 'applied' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)' }}>
          <CheckCircle size={14} weight="fill" aria-hidden="true" />
          Fix wurde angewendet
        </div>
      )}

      {localStatus === 'rejected' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-tertiary)' }}>
          <X size={14} weight="bold" aria-hidden="true" />
          Fix wurde abgelehnt
        </div>
      )}

      {error && !dismissed && (
        <ErrorSection
          retrying={retrying}
          hasDiffs={fix.diffs.length > 0}
          copied={copied}
          onRetry={() => void handleRetry()}
          onCopyDiff={handleCopyDiff}
          onDismiss={() => void handleDismiss()}
        />
      )}

      {dismissed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
          <XCircle size={13} weight="bold" aria-hidden="true" />
          Als nicht relevant markiert
        </div>
      )}
    </div>
  )
}
