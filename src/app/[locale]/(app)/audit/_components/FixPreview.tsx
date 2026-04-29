'use client'

import { useState } from 'react'
import { CheckCircle, X, Spinner, WarningCircle, Info, ShieldCheck, Scales, SealCheck, ArrowCounterClockwise, Copy, XCircle, Lightbulb, Clock } from '@phosphor-icons/react'
import type { GeneratedFix, FixStatus } from '@/lib/fix-engine/types'
import {
  RISK_CONFIG, CONFIDENCE_COLOR, CONFIDENCE_LABEL,
  isFalsePositive, AffectedFilesList, FileDiffView,
} from './FixPreviewParts'

interface FixPreviewProps {
  fix: GeneratedFix
  affectedFiles?: string[]
  onApplied?: () => void
  onRejected?: () => void
}

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
      if (!res.ok) {
        setError(data.error ?? 'Generierung fehlgeschlagen')
      }
      // Parent (DeepReviewFindingRow) holds fix state — a page refresh shows the new fix
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
      {/* Risk Badge */}
      {fix.riskLevel && (() => {
        const rc = RISK_CONFIG[fix.riskLevel!]
        return (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 6, marginBottom: 10,
            fontSize: 12, fontWeight: 600,
            background: rc.bg,
            color: rc.color,
            border: '1px solid currentColor',
          }}>
            <ShieldCheck size={13} weight="fill" aria-hidden="true" />
            Risiko: {rc.label}
            {fix.riskAssessment && ` (${fix.riskAssessment.importedByCount} Importe)`}
          </div>
        )
      })()}

      {/* Affected files list (multi-file findings) */}
      {affectedFiles && affectedFiles.length > 1 && (
        <AffectedFilesList files={affectedFiles} />
      )}

      {/* Explanation + confidence */}
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
              Modell: {fix.fixMode === 'consensus' ? 'Konsens' : fix.model.split('-').slice(0, 2).join('-')}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              €{fix.costEur.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Diff view */}
      {fix.diffs.length > 0 ? (
        <div style={{ marginBottom: 12 }}>
          {fix.diffs.map((diff, i) => (
            <FileDiffView key={i} diff={diff} />
          ))}
        </div>
      ) : isFalsePositive(fix) ? (
        <div style={{ marginBottom: 12 }}>
          {fpDismissed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)' }}>
              <SealCheck size={14} weight="fill" aria-hidden="true" />
              Als False Positive markiert — wird im nächsten Run nicht mehr angezeigt.
            </div>
          ) : (
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '10px 12px', borderRadius: 6,
              background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
              marginBottom: 8,
            }}>
              <SealCheck size={14} weight="fill" color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Kein Fix nötig — das Finding ist wahrscheinlich ein False Positive.
                </p>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleDismissFalsePositive}
                  disabled={dismissingFp}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                >
                  {dismissingFp
                    ? <Spinner size={13} weight="bold" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                    : <SealCheck size={13} weight="fill" aria-hidden="true" />
                  }
                  Als False Positive markieren
                </button>
              </div>
            </div>
          )}
        </div>
      ) : later ? null : (
        <div style={{
          padding: '12px 14px', borderRadius: 6, marginBottom: 12,
          border: '1px solid var(--border)',
          background: 'color-mix(in srgb, var(--text-secondary) 5%, transparent)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '0 0 4px', fontWeight: 500 }}>
            Für dieses Finding kann kein automatischer Fix generiert werden.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
            Es erfordert projektspezifische Inhalte (Dokumentation, Konfiguration, Runbooks).
          </p>

          {recommendation ? (
            <div style={{
              padding: '10px 12px', borderRadius: 6, marginBottom: 10,
              background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Lightbulb size={13} weight="fill" color="var(--accent)" aria-hidden="true" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Empfehlung
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {recommendation}
              </p>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {!recommendation && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleShowRecommendation}
                disabled={fetchingRecommendation}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
              >
                {fetchingRecommendation
                  ? <Spinner size={12} weight="bold" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                  : <Lightbulb size={12} weight="bold" aria-hidden="true" />
                }
                {fetchingRecommendation ? 'Lädt…' : 'Empfehlung anzeigen'}
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleDismiss}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
            >
              <XCircle size={12} weight="bold" aria-hidden="true" />
              Nicht relevant
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setLater(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-tertiary)' }}
            >
              <Clock size={12} weight="bold" aria-hidden="true" />
              Später
            </button>
          </div>
        </div>
      )}

      {/* Consensus Section */}
      {fix.fixMode === 'consensus' && fix.judgeExplanation && (
        <div style={{
          marginBottom: 12,
          padding: '10px 12px',
          borderRadius: 6,
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
      )}

      {/* Actions */}
      {localStatus === 'pending' && fix.diffs.length > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleApply}
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
            onClick={handleReject}
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
        <div style={{
          marginTop: 10,
          padding: '12px 14px',
          borderRadius: 6,
          border: '1px solid color-mix(in srgb, var(--error) 25%, transparent)',
          background: 'color-mix(in srgb, var(--error) 6%, transparent)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <WarningCircle size={14} weight="fill" color="var(--error)" aria-hidden="true" />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              Fix konnte nicht automatisch angewendet werden.
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
            Der vorgeschlagene Code stimmt nicht mit deiner Datei überein — das passiert wenn das Modell den Dateiinhalt nicht korrekt rekonstruiert hat.
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleRetry}
              disabled={retrying}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
            >
              {retrying
                ? <Spinner size={12} weight="bold" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                : <ArrowCounterClockwise size={12} weight="bold" aria-hidden="true" />
              }
              {retrying ? 'Generiert…' : 'Erneut generieren'}
            </button>
            {fix.diffs.length > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleCopyDiff}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
              >
                <Copy size={12} weight="bold" aria-hidden="true" />
                {copied ? 'Kopiert!' : 'Diff kopieren'}
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleDismiss}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-tertiary)' }}
            >
              <XCircle size={12} weight="bold" aria-hidden="true" />
              Nicht relevant
            </button>
          </div>
        </div>
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
