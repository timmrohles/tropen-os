'use client'

import { Spinner, SealCheck, Lightbulb, XCircle, Clock, ArrowCounterClockwise, Copy, WarningCircle } from '@phosphor-icons/react'
import type { GeneratedFix } from '@/lib/fix-engine/types'
import { isFalsePositive, FileDiffView } from './FixPreviewParts'

// ── FalsePositiveSection ───────────────────────────────────────────────────────

export function FalsePositiveSection({ dismissingFp, fpDismissed, onDismiss }: {
  dismissingFp: boolean
  fpDismissed: boolean
  onDismiss: () => void
}) {
  if (fpDismissed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)' }}>
        <SealCheck size={14} weight="fill" aria-hidden="true" />
        Als False Positive markiert — wird im nächsten Run nicht mehr angezeigt.
      </div>
    )
  }
  return (
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
          onClick={onDismiss}
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
  )
}

// ── NoFixSection ───────────────────────────────────────────────────────────────

export function NoFixSection({ recommendation, fetchingRecommendation, onShowRecommendation, onDismiss, onLater }: {
  recommendation: string | null
  fetchingRecommendation: boolean
  onShowRecommendation: () => void
  onDismiss: () => void
  onLater: () => void
}) {
  return (
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

      {recommendation && (
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
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {!recommendation && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onShowRecommendation}
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
          onClick={onDismiss}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
        >
          <XCircle size={12} weight="bold" aria-hidden="true" />
          Nicht relevant
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onLater}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-tertiary)' }}
        >
          <Clock size={12} weight="bold" aria-hidden="true" />
          Später
        </button>
      </div>
    </div>
  )
}

// ── ErrorSection ───────────────────────────────────────────────────────────────

export function ErrorSection({ retrying, hasDiffs, copied, onRetry, onCopyDiff, onDismiss }: {
  retrying: boolean
  hasDiffs: boolean
  copied: boolean
  onRetry: () => void
  onCopyDiff: () => void
  onDismiss: () => void
}) {
  return (
    <div style={{
      marginTop: 10, padding: '12px 14px', borderRadius: 6,
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
          onClick={onRetry}
          disabled={retrying}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
        >
          {retrying
            ? <Spinner size={12} weight="bold" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
            : <ArrowCounterClockwise size={12} weight="bold" aria-hidden="true" />
          }
          {retrying ? 'Generiert…' : 'Erneut generieren'}
        </button>
        {hasDiffs && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onCopyDiff}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
          >
            <Copy size={12} weight="bold" aria-hidden="true" />
            {copied ? 'Kopiert!' : 'Diff kopieren'}
          </button>
        )}
        <button
          className="btn btn-ghost btn-sm"
          onClick={onDismiss}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-tertiary)' }}
        >
          <XCircle size={12} weight="bold" aria-hidden="true" />
          Nicht relevant
        </button>
      </div>
    </div>
  )
}

// ── DiffSection ────────────────────────────────────────────────────────────────

export function DiffSection({ fix, dismissingFp, fpDismissed, later, recommendation, fetchingRecommendation, onDismissFp, onDismiss, onLater, onShowRecommendation }: {
  fix: GeneratedFix
  dismissingFp: boolean
  fpDismissed: boolean
  later: boolean
  recommendation: string | null
  fetchingRecommendation: boolean
  onDismissFp: () => void
  onDismiss: () => void
  onLater: () => void
  onShowRecommendation: () => void
}) {
  if (fix.diffs.length > 0) {
    return (
      <div style={{ marginBottom: 12 }}>
        {fix.diffs.map((diff, i) => <FileDiffView key={i} diff={diff} />)}
      </div>
    )
  }

  if (isFalsePositive(fix)) {
    return (
      <div style={{ marginBottom: 12 }}>
        <FalsePositiveSection
          dismissingFp={dismissingFp}
          fpDismissed={fpDismissed}
          onDismiss={onDismissFp}
        />
      </div>
    )
  }

  if (later) return null

  return (
    <NoFixSection
      recommendation={recommendation}
      fetchingRecommendation={fetchingRecommendation}
      onShowRecommendation={onShowRecommendation}
      onDismiss={onDismiss}
      onLater={onLater}
    />
  )
}
