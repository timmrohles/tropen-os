'use client'

import { useState } from 'react'
import { CheckCircle, X, Spinner, WarningCircle, Code, Info, ShieldCheck, Scales, SealCheck, ArrowCounterClockwise, Copy, XCircle, Lightbulb, Clock } from '@phosphor-icons/react'
import type { GeneratedFix, FileDiff, FixStatus } from '@/lib/fix-engine/types'

interface FixPreviewProps {
  fix: GeneratedFix
  affectedFiles?: string[]
  onApplied?: () => void
  onRejected?: () => void
}

const RISK_CONFIG = {
  safe:     { label: 'Sicher',   bg: 'color-mix(in srgb, var(--accent) 12%, transparent)',         color: 'var(--accent)' },
  moderate: { label: 'Moderat',  bg: 'color-mix(in srgb, var(--text-secondary) 15%, transparent)', color: 'var(--text-secondary)' },
  critical: { label: 'Kritisch', bg: 'color-mix(in srgb, var(--error) 12%, transparent)',           color: 'var(--error)' },
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high:   'var(--accent)',
  medium: 'var(--text-secondary)',
  low:    'var(--error)',
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high:   'Hoch',
  medium: 'Mittel',
  low:    'Gering',
}

function AffectedFilesList({ files }: { files: string[] }) {
  const [expanded, setExpanded] = useState(false)
  const preview = files.slice(0, 3)
  const rest = files.length - 3

  return (
    <div style={{
      marginBottom: 10,
      padding: '8px 12px',
      borderRadius: 6,
      background: 'color-mix(in srgb, var(--text-secondary) 8%, transparent)',
      border: '1px solid var(--border)',
      fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: expanded || rest <= 0 ? 6 : 0 }}>
        <Code size={13} weight="bold" color="var(--text-secondary)" aria-hidden="true" />
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
          {files.length} betroffene Dateien
        </span>
        {rest > 0 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {expanded ? 'Weniger anzeigen' : `+${rest} weitere`}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {(expanded ? files : preview).map((fp) => (
          <code key={fp} style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block' }}>
            {fp}
          </code>
        ))}
      </div>
    </div>
  )
}

function DiffHunkView({ hunk }: { hunk: import('@/lib/fix-engine/types').DiffHunk }) {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5 }}>
      <div style={{
        padding: '2px 8px',
        background: 'color-mix(in srgb, var(--text-tertiary) 15%, transparent)',
        color: 'var(--text-tertiary)',
        fontSize: 11,
      }}>
        @@ -{hunk.oldStart},{hunk.oldCount} +{hunk.newStart},{hunk.newCount} @@
      </div>
      {hunk.lines.map((line, i) => {
        const type = line[0]
        const content = line.slice(1)
        const bg = type === '+' ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
          : type === '-' ? 'color-mix(in srgb, var(--error) 12%, transparent)'
          : 'transparent'
        const color = type === '+' ? 'var(--accent)'
          : type === '-' ? 'var(--error)'
          : 'var(--text-secondary)'
        return (
          <div key={i} style={{ display: 'flex', background: bg }}>
            <span style={{
              width: 20, flexShrink: 0, textAlign: 'center',
              color, fontWeight: type !== ' ' ? 700 : 400,
            }}>
              {type === '+' ? '+' : type === '-' ? '-' : ' '}
            </span>
            <span style={{ color: 'var(--text-primary)', whiteSpace: 'pre', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {content}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function FileDiffView({ diff }: { diff: FileDiff }) {
  const [expanded, setExpanded] = useState(true)
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: 8,
    }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '8px 12px',
          background: 'color-mix(in srgb, var(--text-secondary) 6%, transparent)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <Code size={13} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
        <code style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{diff.filePath}</code>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {diff.hunks.length} Hunk{diff.hunks.length !== 1 ? 's' : ''}
        </span>
      </button>
      {expanded && (
        <div style={{ overflow: 'auto', maxHeight: 400 }}>
          {diff.hunks.map((hunk, i) => (
            <DiffHunkView key={i} hunk={hunk} />
          ))}
        </div>
      )}
    </div>
  )
}

const FALSE_POSITIVE_KEYWORDS = ['incorrect', 'not empty', 'properly handles', 'false positive', 'already', 'does exist', 'is present', 'no issue']

function isFalsePositive(fix: GeneratedFix): boolean {
  if (fix.diffs.length > 0) return false
  if (fix.confidence !== 'high') return false
  const lower = fix.explanation.toLowerCase()
  return FALSE_POSITIVE_KEYWORDS.some((kw) => lower.includes(kw))
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
