'use client'
// src/app/feeds/_components/RunHistoryPanel.tsx
import type { FeedRun } from '@/types/feeds'
import {
  CheckCircle, XCircle, Clock, ArrowClockwise,
  Warning,
} from '@phosphor-icons/react'

interface Props {
  runs: FeedRun[]
  loading: boolean
  onRefresh: () => void
}

function statusIcon(status: FeedRun['status']) {
  if (status === 'success') return <CheckCircle size={14} color="var(--accent)" weight="fill" />
  if (status === 'error')   return <XCircle size={14} color="var(--error, #e53e3e)" weight="fill" />
  if (status === 'partial') return <Warning size={14} color="var(--warning, #d97706)" weight="fill" />
  return <Clock size={14} color="var(--text-tertiary)" weight="fill" />
}

function formatDuration(ms: number | null) {
  if (!ms) return '–'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatCost(eur: number | null) {
  if (!eur) return null
  if (eur < 0.001) return '<0.001 €'
  return `${eur.toFixed(3)} €`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function RunHistoryPanel({ runs, loading, onRefresh }: Props) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Run-Historie
        </span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Aktualisieren"
        >
          <ArrowClockwise size={14} weight="bold" />
        </button>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Lade...</p>
      ) : runs.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Noch keine Runs.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {runs.map((run) => (
            <div
              key={run.id}
              className="card"
              style={{ padding: '10px 14px', fontSize: 13 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {statusIcon(run.status)}
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {formatTime(run.startedAt)}
                </span>
                <span style={{ color: 'var(--text-tertiary)', marginLeft: 'auto', fontSize: 12 }}>
                  {run.triggeredBy === 'manual' ? 'manuell' : run.triggeredBy}
                  {run.durationMs ? ` · ${formatDuration(run.durationMs)}` : ''}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)', fontSize: 12 }}>
                <span>Gefunden: <strong>{run.itemsFound}</strong></span>
                <span>Bewertet: <strong>{run.itemsScored}</strong></span>
                <span>Verteilt: <strong>{run.itemsDistributed}</strong></span>
                {run.costEur ? (
                  <span style={{ color: 'var(--text-tertiary)' }}>{formatCost(run.costEur)}</span>
                ) : null}
              </div>

              {run.errors && run.errors.length > 0 && (
                <div style={{ marginTop: 6, padding: '6px 8px', background: 'rgba(229,62,62,0.06)', borderRadius: 4 }}>
                  {run.errors.slice(0, 2).map((e, i) => (
                    <p key={i} style={{ fontSize: 12, color: 'var(--error, #e53e3e)', margin: 0 }}>
                      {e.step}: {e.message}
                    </p>
                  ))}
                  {run.errors.length > 2 && (
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
                      +{run.errors.length - 2} weitere Fehler
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
