'use client'

import { useState, useCallback } from 'react'
import {
  Warning,
  CheckCircle,
  Clock,
  Export,
  HardDrives,
} from '@phosphor-icons/react'
import type { PreflightResult } from '@/lib/preflight/types'
import { buildDecisionPrompt } from '@/lib/preflight/export-prompt'
import { GapsSection } from './GapCard'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  result: PreflightResult
}

// ─── Result Summary ───────────────────────────────────────────────────────────

function ResultSummaryBox({ summary }: { summary: PreflightResult['summary'] }) {
  return (
    <div
      style={{
        padding: '24px 28px',
        background: 'var(--surface-tint)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--border)',
        borderRadius: 8,
        marginBottom: 20,
      }}
    >
      <p
        style={{
          margin: '0 0 6px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        Bevor du loslegst
      </p>
      <h2
        style={{
          margin: '0 0 8px',
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
          fontFamily: 'var(--font-display)',
        }}
      >
        {summary.projectLabel}
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        {summary.headline}
      </p>
    </div>
  )
}

// ─── Reifegrad-Signal (counts bar) ───────────────────────────────────────────

function ReifegradSignal({ gaps }: { gaps: PreflightResult['gaps'] }) {
  const { red, yellow, decidedCount, naCount } = gaps
  const hasBlockers = red.length > 0

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px',
        background: hasBlockers ? 'var(--surface-warm)' : 'var(--teal-light)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: hasBlockers ? 'var(--border)' : 'rgba(30,112,112,0.18)',
        borderRadius: 8,
        marginBottom: 24,
        flexWrap: 'wrap',
        rowGap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasBlockers ? (
          <Warning size={18} weight="fill" color="var(--error)" aria-hidden="true" />
        ) : (
          <CheckCircle size={18} weight="fill" color="var(--teal)" aria-hidden="true" />
        )}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: hasBlockers ? 'var(--error)' : 'var(--teal)' }}>
          {hasBlockers ? `${red.length} offen — zuerst entscheiden` : 'Keine Blocker'}
        </span>
      </div>

      <span style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} aria-hidden="true" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckCircle size={14} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
          {decidedCount} entschieden
        </span>
      </div>

      {yellow.length > 0 && (
        <>
          <span style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} aria-hidden="true" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
              {yellow.length} geparkt
            </span>
          </div>
        </>
      )}

      {naCount > 0 && (
        <>
          <span style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
            {naCount} nicht relevant
          </span>
        </>
      )}
    </div>
  )
}

// ─── Action Paths ─────────────────────────────────────────────────────────────

function ActionPaths({ result }: { result: PreflightResult }) {
  const [copied, setCopied] = useState(false)

  const handleCopyPrompt = useCallback(() => {
    const prompt = buildDecisionPrompt(result)
    void navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [result])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 12,
        marginBottom: 32,
      }}
    >
      {/* Path A — primary: Prompt kopieren */}
      <button
        type="button"
        onClick={handleCopyPrompt}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 10,
          padding: '20px 22px',
          background: copied ? 'var(--teal-light)' : 'var(--bg-surface-solid)',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: copied ? 'rgba(30,112,112,0.35)' : 'var(--teal)',
          borderRadius: 8,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 200ms, border-color 200ms',
        }}
        aria-label="Alle offenen Punkte als Entscheidungs-Prompt in die Zwischenablage kopieren"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Export size={18} weight="bold" color="#ffffff" aria-hidden="true" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: copied ? 'var(--teal)' : 'var(--text-primary)' }}>
              {copied ? 'Kopiert ✓' : 'Alle Punkte als Prompt kopieren'}
            </p>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Für deinen LLM (Claude, Cursor …) — entscheide alles in einem Rutsch.
        </p>
      </button>

      {/* Path B — disabled: Hier durchgehen & Dateien erstellen */}
      <div
        aria-disabled="true"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 10,
          padding: '20px 22px',
          background: 'var(--bg-surface)',
          borderWidth: '1px',
          borderStyle: 'dashed',
          borderColor: 'var(--border)',
          borderRadius: 8,
          opacity: 0.6,
          cursor: 'not-allowed',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <HardDrives size={18} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              Hier durchgehen &amp; Dateien erstellen
            </p>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 4,
                background: 'var(--accent-light)',
                color: 'var(--text-tertiary)',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              kommt bald
            </span>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          CLAUDE.md, README, ADRs … direkt aus deinen Entscheidungen generieren.
        </p>
      </div>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function PreflightResult({ result }: Props) {
  const { summary, gaps } = result

  return (
    <div style={{ marginTop: 32 }}>
      {/* Clear "decide before you build" headline block */}
      <ResultSummaryBox summary={summary} />

      {/* Reifegrad-Signal (counts bar) */}
      <ReifegradSignal gaps={gaps} />

      {/* Two action paths — prominent, above the list */}
      <ActionPaths result={result} />

      {/* Compact gaps list */}
      <GapsSection gaps={gaps} />

      {/* Tiny muted note about Startpaket / Weg B */}
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
        Das Startpaket (CLAUDE.md, .env.example, Migration …) entsteht aus deinen Entscheidungen — Weg B, kommt bald.
      </p>
    </div>
  )
}
